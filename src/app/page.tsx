'use client';

import React, { useState, useEffect } from 'react';
import { ActiveTab, Employee, ShiftStatus, WeekSchedule, CompanySettings, AuthUser } from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_SETTINGS,
  INITIAL_WEEK_SCHEDULE,
  INITIAL_SCHEDULE_HISTORY,
  getWeekDays,
  getWeekDateRange,
  calculateDailyCoverage,
  formatNameAndSurname,
  ADMIN_EMAIL,
} from '../lib/scheduleEngine';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EscalaTab } from '../components/tabs/EscalaTab';
import { AjustesTab } from '../components/tabs/AjustesTab';
import { FuncionarioDashboard } from '../components/funcionario/FuncionarioDashboard';
import { CompartilharEscalaModal } from '../components/modal/CompartilharEscalaModal';
import { LoginView } from '../components/auth/LoginView';
import { Toast, ToastMessage } from '../components/Toast';
import { PerfilView } from '../components/perfil/PerfilView';
import {
  updateUserProfile,
  fetchEmployeesFromSupabase,
  fetchScheduleFromSupabase,
  saveScheduleToSupabase,
  fetchSettingsFromSupabase,
  saveSettingsToSupabase,
} from '../lib/supabase';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [schedulesMap, setSchedulesMap] = useState<Record<string, WeekSchedule>>({});
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [todayStr, setTodayStr] = useState<string>('2026-10-29');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Calcula dados da semana atual baseados no weekOffset
  const currentWeekInfo = getWeekDateRange(weekOffset);
  const startDateStr = currentWeekInfo.startDateStr;
  const days = getWeekDays(startDateStr, todayStr);
  const todayIndex = days.findIndex(d => d.isToday) !== -1 ? days.findIndex(d => d.isToday) : 3;

  // Escala correspondente a semana navegada
  const schedule: WeekSchedule = schedulesMap[currentWeekInfo.weekId] || {
    weekId: currentWeekInfo.weekId,
    weekNumber: currentWeekInfo.weekNumber,
    year: 2026,
    startDate: currentWeekInfo.startDateStr,
    endDate: currentWeekInfo.endDateStr,
    isPublished: false,
    isPublicShareEnabled: false,
    shifts: Object.fromEntries(
      employees.map(e => [e.id, Array(7).fill('SEM_ESCALA')])
    ),
    customHours: {},
  };

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToast({ id, type, text });
    setTimeout(() => {
      setToast(curr => (curr?.id === id ? null : curr));
    }, 3200);
  };

  // Restringe abas exclusivas de admin para colaborador
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && activeTab === 'ajustes') {
      setActiveTab('inicio');
    }
  }, [currentUser, activeTab]);

  // Carrega dados salvos e sincroniza com o banco de dados
  useEffect(() => {
    const initData = async () => {
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        setTodayStr(`${y}-${m}-${d}`);

        // 1. Limpeza automática imediata de dados mock/demo legados do navegador
        const legacyMockIds = ['thiago', 'carlos', 'pedro', 'joao', 'paulo', 'mariana'];
        const savedEmployeesRaw = localStorage.getItem('iloc_employees');
        let hasLegacyMocks = false;
        if (savedEmployeesRaw) {
          try {
            const parsed = JSON.parse(savedEmployeesRaw);
            if (Array.isArray(parsed) && parsed.some(e => legacyMockIds.includes(e?.id))) {
              hasLegacyMocks = true;
            }
          } catch {}
        }

        if (hasLegacyMocks) {
          localStorage.removeItem('iloc_employees');
          localStorage.removeItem('iloc_schedules_map');
          localStorage.removeItem('iloc_schedule');
          const savedAuthRaw = localStorage.getItem('iloc_auth_user');
          if (savedAuthRaw) {
            try {
              const parsedAuth = JSON.parse(savedAuthRaw);
              if (legacyMockIds.includes(parsedAuth?.id)) {
                localStorage.removeItem('iloc_auth_user');
              }
            } catch {}
          }
        }

        // 2. Recupera sessão salva
        const savedAuth = localStorage.getItem('iloc_auth_user');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            if (legacyMockIds.includes(parsed?.id)) {
              localStorage.removeItem('iloc_auth_user');
              setCurrentUser(null);
            } else {
              setCurrentUser(parsed);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        // 3. Carrega configurações
        const savedSettings = localStorage.getItem('iloc_settings');
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings));
          } catch {}
        }
        const cloudSettings = await fetchSettingsFromSupabase();
        if (cloudSettings) {
          setSettings(cloudSettings);
        }

        // 4. Carrega colaboradores
        let loadedEmployees: Employee[] = [];
        const savedEmployees = localStorage.getItem('iloc_employees');
        if (savedEmployees) {
          try {
            loadedEmployees = JSON.parse(savedEmployees);
          } catch {}
        }

        const cloudEmployees = await fetchEmployeesFromSupabase();
        if (cloudEmployees !== null) {
          // Supabase é a fonte da verdade definitiva
          loadedEmployees = cloudEmployees;
          localStorage.setItem('iloc_employees', JSON.stringify(cloudEmployees));
        }
        setEmployees(loadedEmployees);

        // 5. Carrega escalas
        let loadedMap: Record<string, WeekSchedule> = {};
        const savedMap = localStorage.getItem('iloc_schedules_map');
        if (savedMap) {
          try {
            loadedMap = JSON.parse(savedMap);
          } catch {}
        }

        const cloudCurrentSchedule = await fetchScheduleFromSupabase(currentWeekInfo.weekId);
        if (cloudCurrentSchedule) {
          loadedMap[cloudCurrentSchedule.weekId] = cloudCurrentSchedule;
        }
        setSchedulesMap(loadedMap);
      } catch (err) {
        console.warn('Aviso na inicialização dos dados:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    initData();
  }, [currentWeekInfo.weekId]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('iloc_auth_user', JSON.stringify(user));
    } catch {}
    showToast(`Bem-vindo, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('iloc_auth_user');
    } catch {}
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const persistEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    try {
      localStorage.setItem('iloc_employees', JSON.stringify(newEmployees));
    } catch {}
  };

  const persistSettings = (newSettings: CompanySettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('iloc_settings', JSON.stringify(newSettings));
    } catch {}
    saveSettingsToSupabase(newSettings).catch(() => {});
  };

  const persistSchedule = (newSchedule: WeekSchedule) => {
    const updatedMap = {
      ...schedulesMap,
      [newSchedule.weekId]: newSchedule,
    };
    setSchedulesMap(updatedMap);
    try {
      localStorage.setItem('iloc_schedules_map', JSON.stringify(updatedMap));
      if (newSchedule.weekId === '2026-W44') {
        localStorage.setItem('iloc_schedule', JSON.stringify(newSchedule));
      }
    } catch {}

    // Sincronização em nuvem quando Supabase estiver disponível
    saveScheduleToSupabase(newSchedule).catch(() => {});
  };

  // Manipuladores de Escala
  const handleUpdateShift = (employeeId: string, dayIndex: number, newStatus: ShiftStatus) => {
    const currentEmpShifts = schedule.shifts[employeeId] || Array(7).fill('T');
    const updatedEmpShifts = [...currentEmpShifts];
    updatedEmpShifts[dayIndex] = newStatus;

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [employeeId]: updatedEmpShifts,
      },
    };

    persistSchedule(updatedSchedule);
  };

  const handleSetShifts = (newShifts: Record<string, ShiftStatus[]>) => {
    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: newShifts,
    };
    persistSchedule(updatedSchedule);
    showToast('Escala gerada automaticamente em conformidade 5x2.', 'success');
  };

  const handleSaveDraft = (newSchedule: WeekSchedule) => {
    const draftSchedule: WeekSchedule = {
      ...newSchedule,
      isPublished: false,
    };
    persistSchedule(draftSchedule);
    showToast('Rascunho da escala salvo com sucesso.', 'success');
  };

  const handlePublishSchedule = (newSchedule: WeekSchedule) => {
    if (currentUser?.role !== 'admin') {
      showToast('Apenas o administrador possui permissão para publicar e gerar o link da escala.', 'warning');
      return;
    }

    const activeEmps = employees.filter(e => e.status === 'active');
    const coverage = calculateDailyCoverage(newSchedule.shifts, activeEmps, settings.minStaffPerDay);
    const belowMinDays = coverage.filter(c => c.isBelowMinimum);

    if (belowMinDays.length > 0) {
      const names = belowMinDays.map(d => d.dayName).join(', ');
      showToast(`Atenção: Os dias ${names} estão abaixo do mínimo de ${settings.minStaffPerDay} pessoas.`, 'warning');
    }

    const generatedToken = `escala-semana-${newSchedule.weekNumber}-${Date.now().toString(36)}`;

    const updatedSchedule: WeekSchedule = {
      ...newSchedule,
      isPublished: true,
      isPublicShareEnabled: true,
      shareToken: generatedToken,
      publishedAt: new Date().toISOString(),
    };
    persistSchedule(updatedSchedule);
    showToast('Escala publicada com sucesso! Link exclusivo gerado.', 'success');
    setIsShareModalOpen(true);
  };

  const handleCreateScheduleForWeek = () => {
    const activeEmps = employees.filter(e => e.status === 'active');
    if (activeEmps.length === 0) {
      showToast('Cadastre os colaboradores em Ajustes antes de criar a escala.', 'warning');
      setActiveTab('ajustes');
      return;
    }

    const initialShifts: Record<string, ShiftStatus[]> = {};
    const initialCustomHours: Record<string, (string | undefined)[]> = {};

    activeEmps.forEach(emp => {
      // 5x2 padrão (Seg..Sex trabalho, Sab..Dom folga) ou respeitando dias preferenciais
      const empShifts: ShiftStatus[] = Array(7).fill('T');
      const preferred = emp.preferredDaysOff && emp.preferredDaysOff.length > 0
        ? emp.preferredDaysOff
        : [5, 6];
      preferred.forEach(d => {
        if (d >= 0 && d < 7) empShifts[d] = 'F';
      });
      initialShifts[emp.id] = empShifts;

      const habitual = emp.workHours || '08:00 às 17:00';
      const empCustom: (string | undefined)[] = Array(7).fill(undefined);
      for (let i = 0; i < 7; i++) {
        if (empShifts[i] === 'T') {
          empCustom[i] = habitual;
        }
      }
      initialCustomHours[emp.id] = empCustom;
    });

    const newWeekSchedule: WeekSchedule = {
      ...schedule,
      shifts: initialShifts,
      customHours: initialCustomHours,
      isPublished: false,
      isPublicShareEnabled: false,
    };

    persistSchedule(newWeekSchedule);
    showToast('Escala criada com sucesso com os colaboradores da equipe!', 'success');
  };

  const handleCopyPreviousWeek = () => {
    const prevWeekInfo = getWeekDateRange(weekOffset - 1);
    const prevSchedule = schedulesMap[prevWeekInfo.weekId];

    if (!prevSchedule) {
      showToast('Nenhuma escala anterior encontrada para copiar.', 'warning');
      return;
    }

    const activeEmpIds = new Set(employees.filter(e => e.status === 'active').map(e => e.id));
    const copiedShifts: Record<string, ShiftStatus[]> = {};
    const copiedCustomHours: Record<string, (string | undefined)[]> = {};

    activeEmpIds.forEach(id => {
      if (prevSchedule.shifts[id]) {
        copiedShifts[id] = [...prevSchedule.shifts[id]];
      } else {
        copiedShifts[id] = Array(7).fill('T');
      }

      if (prevSchedule.customHours && prevSchedule.customHours[id]) {
        copiedCustomHours[id] = [...prevSchedule.customHours[id]];
      }
    });

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: copiedShifts,
      customHours: copiedCustomHours,
      isPublished: false,
    };

    persistSchedule(updatedSchedule);
    showToast('Escala da semana anterior copiada com sucesso.', 'success');
  };

  const handleTogglePublicShare = (enabled: boolean) => {
    if (currentUser?.role !== 'admin') {
      showToast('Apenas o administrador pode alterar ou revogar o compartilhamento da escala.', 'warning');
      return;
    }

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      isPublicShareEnabled: enabled,
    };
    persistSchedule(updatedSchedule);
    if (enabled) {
      showToast('Compartilhamento público reativado.', 'success');
    } else {
      showToast('Acesso público revogado com sucesso.', 'info');
    }
  };

  // Manipuladores de Colaboradores
  const handleAddEmployee = (data: Employee | Omit<Employee, 'id'>) => {
    const newId = 'id' in data && data.id ? data.id : `emp_${Date.now()}`;
    const newEmp: Employee = {
      ...data,
      id: newId,
    };
    const updatedEmployees = [...employees, newEmp];
    persistEmployees(updatedEmployees);

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: {
        ...schedule.shifts,
        [newId]: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      },
    };
    persistSchedule(updatedSchedule);
    showToast(`Colaborador ${formatNameAndSurname(newEmp.name)} cadastrado com sucesso.`, 'success');
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => (e.id === updatedEmp.id ? updatedEmp : e));
    persistEmployees(updated);
    showToast(`Dados de ${updatedEmp.name.split(' ')[0]} atualizados.`, 'success');
  };

  const handleToggleEmployeeStatus = (id: string) => {
    const updated = employees.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === 'active' ? 'inactive' : 'active';
        return { ...e, status: nextStatus as 'active' | 'inactive' };
      }
      return e;
    });
    persistEmployees(updated);
    const emp = employees.find(e => e.id === id);
    const statusLabel = emp?.status === 'active' ? 'inativado' : 'reativado';
    showToast(`Colaborador ${emp?.name.split(' ')[0]} ${statusLabel}.`, 'info');
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    const updatedEmployees = employees.filter(e => e.id !== id);
    persistEmployees(updatedEmployees);

    const updatedShifts = { ...schedule.shifts };
    delete updatedShifts[id];
    const updatedCustom = { ...(schedule.customHours || {}) };
    delete updatedCustom[id];

    const updatedSchedule: WeekSchedule = {
      ...schedule,
      shifts: updatedShifts,
      customHours: updatedCustom,
    };
    persistSchedule(updatedSchedule);

    showToast(`Colaborador ${emp ? formatNameAndSurname(emp.name) : ''} removido com sucesso.`, 'info');
  };

  // Exportação CSV
  const handleExportSchedule = () => {
    const headers = ['Colaborador', 'Cargo', ...days.map(d => `${d.name} (${d.formattedDate})`)];
    const rows = employees
      .filter(e => e.status === 'active')
      .map(emp => {
        const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
        const shiftTexts = empShifts.map(s => (s === 'T' ? 'Trabalho' : 'Folga'));
        return [emp.name, emp.role, ...shiftTexts];
      });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `escala_iloc_semana_${schedule.weekNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Planilha da escala exportada com sucesso.', 'success');
  };

  const handleClearAllData = () => {
    try {
      localStorage.setItem('iloc_data_cleared', 'true');
      localStorage.setItem('iloc_employees', '[]');
      localStorage.setItem('iloc_schedules_map', '{}');
      localStorage.removeItem('iloc_schedule');
    } catch {}

    setEmployees([]);
    setSchedulesMap({});
    setWeekOffset(0);

    const adminUser: AuthUser = {
      id: 'admin_luiz',
      name: 'Luiz Administrador',
      email: ADMIN_EMAIL,
      role: 'admin',
    };
    setCurrentUser(adminUser);
    try {
      localStorage.setItem('iloc_auth_user', JSON.stringify(adminUser));
    } catch {}

    showToast('Base de dados zerada com sucesso. O sistema está pronto para seu teste real.', 'success');
  };

  const handleResetDemoData = () => {
    try {
      localStorage.removeItem('iloc_data_cleared');
      localStorage.setItem('iloc_employees', JSON.stringify(INITIAL_EMPLOYEES));
      localStorage.setItem('iloc_settings', JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem('iloc_schedules_map', JSON.stringify(INITIAL_SCHEDULE_HISTORY));
      localStorage.setItem('iloc_schedule', JSON.stringify(INITIAL_WEEK_SCHEDULE));
    } catch {}

    persistEmployees(INITIAL_EMPLOYEES);
    persistSettings(INITIAL_SETTINGS);
    setSchedulesMap(INITIAL_SCHEDULE_HISTORY);
    persistSchedule(INITIAL_WEEK_SCHEDULE);
    setWeekOffset(0);
    showToast('Dados de demonstração restaurados com sucesso.', 'info');
  };

  const loggedEmp = employees.find(
    e => e.id === currentUser?.id || e.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  const handleUpdateProfile = async (data: {
    name: string;
    email: string;
    avatarUrl?: string;
    newPassword?: string;
  }): Promise<{ error: string | null }> => {
    if (!currentUser) return { error: 'Usuário não autenticado.' };

    const { error } = await updateUserProfile({
      userId: currentUser.id,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,
      newPassword: data.newPassword,
    });

    if (error) {
      return { error };
    }

    const updatedUser: AuthUser = {
      ...currentUser,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl || '',
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('iloc_auth_user', JSON.stringify(updatedUser));
    } catch {}

    const updatedEmployees = employees.map(emp => {
      const isMatch =
        emp.id === currentUser.id ||
        emp.email?.toLowerCase() === currentUser.email?.toLowerCase();
      if (isMatch) {
        const initials = data.name
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        return {
          ...emp,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatarUrl || '',
          initials: initials || emp.initials,
        };
      }
      return emp;
    });

    persistEmployees(updatedEmployees);
    showToast('Perfil atualizado com sucesso!', 'success');
    return { error: null };
  };

  const tabTitles: Record<ActiveTab, string> = {
    inicio: 'Início',
    escala: currentUser?.role === 'admin' ? 'Gerenciar Escalas' : 'Escala do Time',
    ajustes: 'Ajustes',
    perfil: 'Meu Perfil',
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm animate-pulse">
            iLoc
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Carregando sistema de escalas...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        currentTabTitle={tabTitles[activeTab]}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProfile={() => setActiveTab('perfil')}
        employeeAvatarUrl={loggedEmp?.avatarUrl}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto pt-20 md:pt-24 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8">
        {activeTab === 'inicio' && (
          <FuncionarioDashboard
            allEmployees={employees}
            schedule={schedule}
            days={days}
            todayIndex={todayIndex}
            todayStr={todayStr}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'escala' && (
          <EscalaTab
            employees={employees}
            schedule={schedule}
            settings={settings}
            days={days}
            weekOffset={weekOffset}
            onChangeWeekOffset={delta => setWeekOffset(prev => prev + delta)}
            onResetWeekOffset={() => setWeekOffset(0)}
            todayStr={todayStr}
            currentUser={currentUser}
            onCopySuccess={() => showToast('Link da escala copiado com sucesso.', 'success')}
            onSaveDraft={handleSaveDraft}
            onPublishSchedule={handlePublishSchedule}
            onCopyPreviousWeek={handleCopyPreviousWeek}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            isScheduleCreated={Boolean(schedulesMap[currentWeekInfo.weekId])}
            onCreateScheduleForWeek={handleCreateScheduleForWeek}
            onNavigateToAjustes={() => setActiveTab('ajustes')}
          />
        )}

        {activeTab === 'ajustes' && (
          <AjustesTab
            settings={settings}
            schedule={schedule}
            employees={employees}
            days={days}
            currentUser={currentUser}
            onUpdateSettings={persistSettings}
            onResetDemoData={handleResetDemoData}
            onClearAllData={handleClearAllData}
            onExportSchedule={handleExportSchedule}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {activeTab === 'perfil' && currentUser && (
          <PerfilView
            currentUser={currentUser}
            employeeData={loggedEmp}
            onBack={() => setActiveTab('inicio')}
            onSaveProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Menu de Navegação Inferior: 2 abas para Colaborador (Início, Escala), 4 abas para Administrador */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Modal de Compartilhamento Público e WhatsApp: regras de admin vs colaborador */}
      <CompartilharEscalaModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        schedule={schedule}
        isAdmin={currentUser?.role === 'admin'}
        onTogglePublicShare={handleTogglePublicShare}
        onCopySuccess={() => showToast('Link copiado para a área de transferência.', 'success')}
      />

      <Toast toast={toast} />
    </div>
  );
}
