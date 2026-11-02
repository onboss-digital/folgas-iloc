'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Calendar,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  UserPlus,
  Mail,
  Lock,
  User,
  ShieldCheck,
  ShieldAlert,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Edit2,
  Trash2,
  Briefcase,
  Building2,
  Laptop,
  Globe,
} from 'lucide-react';
import { CompanySettings, Employee, WeekSchedule, DayInfo, AuthUser, WorkModel, TimezonePreference } from '../../types';
import { formatNameAndSurname, ADMIN_EMAIL } from '../../lib/scheduleEngine';
import { inviteAndRegisterCollaborator, isSupabaseConfigured } from '../../lib/supabase';

interface AjustesTabProps {
  settings: CompanySettings;
  schedule: WeekSchedule;
  employees: Employee[];
  days: DayInfo[];
  currentUser?: AuthUser | null;
  onUpdateSettings: (settings: CompanySettings) => void;
  onResetDemoData?: () => void;
  onClearAllData?: () => void;
  onExportSchedule?: () => void;
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
}

export function AjustesTab({
  settings,
  employees,
  currentUser,
  onUpdateSettings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}: AjustesTabProps) {
  // Modal de Convite
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState('Operações de Loja');
  const [customTeam, setCustomTeam] = useState('');
  const [role, setRole] = useState('Colaborador');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Modal de Edição de Colaborador
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editTeam, setEditTeam] = useState('Operações de Loja');
  const [editCustomTeam, setEditCustomTeam] = useState('');
  const [editStartTime, setEditStartTime] = useState('08:00');
  const [editEndTime, setEditEndTime] = useState('17:00');

  // Modal de Exclusão
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isSupabaseReady = isSupabaseConfigured();

  // Lista de equipes existentes
  const existingTeams = Array.from(
    new Set(employees.map(e => e.team).filter(Boolean))
  ) as string[];
  const defaultTeams = ['Operações de Loja', 'Vendas e Atendimento', 'Logística e Estoque', 'Suporte ao Cliente'];
  const availableTeams = Array.from(new Set([...defaultTeams, ...existingTeams]));

  const handleMinStaffChange = (delta: number) => {
    const newVal = settings.minStaffPerDay + delta;
    if (newVal >= 0) {
      onUpdateSettings({
        ...settings,
        minStaffPerDay: newVal,
      });
    }
  };

  const handleMinStaffDirectChange = (valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateSettings({
        ...settings,
        minStaffPerDay: val,
      });
    } else if (valueStr === '') {
      onUpdateSettings({
        ...settings,
        minStaffPerDay: 0,
      });
    }
  };

  const toggleRotateShifts = () => {
    onUpdateSettings({
      ...settings,
      rotateShifts: !settings.rotateShifts,
    });
  };

  const toggleRotateSundays = () => {
    onUpdateSettings({
      ...settings,
      rotateSundays: !settings.rotateSundays,
    });
  };

  const toggleOperatesOnHolidays = () => {
    onUpdateSettings({
      ...settings,
      operatesOnHolidays: settings.operatesOnHolidays === undefined ? false : !settings.operatesOnHolidays,
    });
  };

  const handleOpenInviteModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setTeam('Operações de Loja');
    setCustomTeam('');
    setRole('Colaborador');
    setStartTime('08:00');
    setEndTime('17:00');
    setModalError('');
    setIsInviteModalOpen(true);
  };

  const handleConfirmInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const finalTeam = team === 'NOVA' ? customTeam.trim() : team;

    if (!cleanName) {
      setModalError('Informe o nome e sobrenome do colaborador.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setModalError('Informe um endereço de e-mail institucional válido.');
      return;
    }

    if (!password || password.length < 6) {
      setModalError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!finalTeam) {
      setModalError('Informe a equipe do colaborador.');
      return;
    }

    // Verifica se já existe um colaborador com esse e-mail
    const emailExists = employees.some(
      emp => emp.email?.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      setModalError('Já existe um colaborador cadastrado com este e-mail.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { employee: newEmp, error } = await inviteAndRegisterCollaborator({
        name: cleanName,
        email: cleanEmail,
        password,
        currentAdminEmail: currentUser?.email || ADMIN_EMAIL,
        team: finalTeam,
        role: role.trim() || 'Colaborador',
        workHours: `${startTime} às ${endTime}`,
      });

      if (error || !newEmp) {
        setModalError(error || 'Não foi possível cadastrar o colaborador.');
      } else {
        onAddEmployee(newEmp);
        setIsInviteModalOpen(false);
        setSuccessNotice(`Colaborador ${formatNameAndSurname(newEmp.name)} cadastrado com sucesso.`);
        setTimeout(() => setSuccessNotice(''), 4000);
      }
    } catch {
      setModalError('Erro inesperado ao registrar no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir edição de colaborador
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditRole(emp.role);
    if (availableTeams.includes(emp.team || '')) {
      setEditTeam(emp.team || 'Operações de Loja');
      setEditCustomTeam('');
    } else {
      setEditTeam('NOVA');
      setEditCustomTeam(emp.team || '');
    }

    let start = '08:00';
    let end = '17:00';
    if (emp.workHours && emp.workHours.includes('às')) {
      const parts = emp.workHours.split('às').map(p => p.trim());
      if (parts[0]) start = parts[0];
      if (parts[1]) end = parts[1];
    }
    setEditStartTime(start);
    setEditEndTime(end);
  };

  // Salvar edição de colaborador
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !onUpdateEmployee) return;

    const finalTeam = editTeam === 'NOVA' ? editCustomTeam.trim() : editTeam;
    const updated: Employee = {
      ...editingEmployee,
      name: editName.trim() || editingEmployee.name,
      role: editRole.trim() || editingEmployee.role,
      team: finalTeam || editingEmployee.team,
      workHours: `${editStartTime} às ${editEndTime}`,
      initials: (editName.trim() || editingEmployee.name)
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    };

    onUpdateEmployee(updated);
    setEditingEmployee(null);
    setSuccessNotice(`Colaborador ${formatNameAndSurname(updated.name)} atualizado.`);
    setTimeout(() => setSuccessNotice(''), 3500);
  };

  // Confirmar exclusão de colaborador
  const handleConfirmDelete = () => {
    if (!employeeToDelete || !onDeleteEmployee) return;
    onDeleteEmployee(employeeToDelete.id);
    setEmployeeToDelete(null);
    setSuccessNotice('Colaborador removido com sucesso.');
    setTimeout(() => setSuccessNotice(''), 3500);
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header Contextual */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Painel de Ajustes
          </h1>
          <p className="text-xs text-slate-500">
            Gerenciamento de equipe, convites e parâmetros da filial
          </p>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* GRID RESPONSIVO: 1 COLUNA NO CELULAR, 2 COLUNAS NO COMPUTADOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* ==============================================================
            SEÇÃO SOLICITADA: CONVIDAR COLABORADOR E LISTA DE COLABORADORES
            ============================================================== */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Gerenciamento da Equipe
              </h2>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              {employees.length} cadastrados
            </span>
          </div>

          {/* Card de Convite */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">
                  Convidar Colaborador
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Cadastre novos membros e crie suas credenciais individuais de login na plataforma.
                </p>
              </div>
            </div>

            {/* Validação de Administrador */}
            {isAdmin ? (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Admin autorizado: <strong>{ADMIN_EMAIL}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenInviteModal}
                  className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Convidar Colaborador</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Somente o administrador <strong>{ADMIN_EMAIL}</strong> tem permissão para cadastrar e convidar colaboradores.
                </span>
              </div>
            )}

            {/* Subtítulo da Lista de Colaboradores */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Colaboradores Cadastrados
              </span>
              <span className="text-[10px] text-slate-400">
                {employees.length} membros vinculados
              </span>
            </div>

            {/* Lista de Colaboradores ou Estado Vazio */}
            {employees.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Nenhum colaborador cadastrado ainda
                </span>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Cadastre sua equipe aqui. Eles aparecerão automaticamente na montagem da escala semanal em Gerenciar Escalas.
                </p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenInviteModal}
                    className="mt-1 h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Convidar Primeiro Colaborador</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className="py-3 px-1 flex items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs`}
                      >
                        {emp.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{emp.email || 'Aguardando e-mail'}</span>
                          </span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-md font-medium">
                            {emp.team || 'Operações de Loja'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {emp.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 font-mono">
                        {emp.workHours || '08:00 às 17:00'}
                      </span>

                      {isAdmin && onUpdateEmployee && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
                          title="Editar dados cadastrais"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      {isAdmin && onDeleteEmployee && (
                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(emp)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-all active:scale-95"
                          title="Excluir colaborador"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==============================================================
            SEÇÃO 2: PARÂMETROS DA ESCALA 5x2
            ============================================================== */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Parâmetros da Escala de Trabalho
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-3.5">
            {/* Regime de Trabalho */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  Regime de Trabalho
                </span>
                <span className="text-[11px] text-slate-500">
                  Organização de jornadas, turnos e folgas da equipe
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                5x2 CLT
              </span>
            </div>

            {/* Equipe Mínima por Dia */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  Mínimo de Colaboradores
                </span>
                <span className="text-[11px] text-slate-500">
                  Contingente mínimo em expediente diário definido por você
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleMinStaffChange(-1)}
                  disabled={settings.minStaffPerDay <= 0}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 disabled:opacity-30 transition-all shadow-2xs"
                  title="Diminuir contingente mínimo"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={settings.minStaffPerDay}
                  onChange={e => handleMinStaffDirectChange(e.target.value)}
                  className="w-14 h-8 text-center text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  title="Digite diretamente o número mínimo desejado"
                />
                <button
                  type="button"
                  onClick={() => handleMinStaffChange(1)}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-slate-700 transition-all shadow-2xs"
                  title="Aumentar contingente mínimo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Alternância de Domingos */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  Revezamento aos Domingos
                </span>
                <span className="text-[11px] text-slate-500">
                  Priorizar alternância de domingos entre colaboradores
                </span>
              </div>

              <button
                type="button"
                onClick={toggleRotateSundays}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  settings.rotateSundays ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.rotateSundays ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Operação em Feriados Nacionais */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800">
                  Operação em Feriados
                </span>
                <span className="text-[11px] text-slate-500">
                  Permitir escala de trabalho em feriados nacionais (CLT)
                </span>
              </div>

              <button
                type="button"
                onClick={toggleOperatesOnHolidays}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  settings.operatesOnHolidays !== false ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.operatesOnHolidays !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>


          </div>
        </section>
      </div>

      {/* ==============================================================
          MODAL: CONVIDAR E CADASTRAR COLABORADOR
          ============================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">
                  Convidar Colaborador
                </h3>
                <span className="text-[11px] text-slate-500">
                  Crie o acesso individual e adicione à equipe
                </span>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmInvite} className="flex flex-col gap-3">
              {/* Campo Nome e Sobrenome */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  Nome e Sobrenome
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Campo E-mail */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  E-mail
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: carlos@ilocmobile.com.br"
                    className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  Senha Provisória
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full h-10 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Linha Dupla: Equipe e Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Equipe
                  </label>
                  <select
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {availableTeams.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="NOVA">+ Digitar nova equipe...</option>
                  </select>
                  {team === 'NOVA' && (
                    <input
                      type="text"
                      required
                      value={customTeam}
                      onChange={e => setCustomTeam(e.target.value)}
                      placeholder="Nome da nova equipe"
                      className="mt-1 w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Cargo
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Ex: Vendedor, Caixa, Atendente"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Horário Habitual de Trabalho */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-bold text-slate-700">
                  Horário Habitual de Trabalho
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Entrada</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 mt-4">até</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Saída</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Atalhos Rápidos de Horário */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[
                    { label: '08h–17h', start: '08:00', end: '17:00' },
                    { label: '09h–18h', start: '09:00', end: '18:00' },
                    { label: '10h–19h', start: '10:00', end: '19:00' },
                    { label: '12h–21h', start: '12:00', end: '21:00' },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setStartTime(p.start);
                        setEndTime(p.end);
                      }}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 text-[10px] font-bold transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL DE EDIÇÃO DE COLABORADOR EM AJUSTES
          ============================================================== */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-900">
                  Editar Colaborador
                </h3>
                <span className="text-[11px] text-slate-500">
                  Atualize os dados e horários da equipe
                </span>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Equipe
                  </label>
                  <select
                    value={editTeam}
                    onChange={e => setEditTeam(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {availableTeams.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="NOVA">+ Digitar nova equipe...</option>
                  </select>
                  {editTeam === 'NOVA' && (
                    <input
                      type="text"
                      required
                      value={editCustomTeam}
                      onChange={e => setEditCustomTeam(e.target.value)}
                      placeholder="Nome da nova equipe"
                      className="mt-1 w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">
                    Cargo
                  </label>
                  <input
                    type="text"
                    required
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Horário Habitual */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-bold text-slate-700">
                  Horário Habitual de Trabalho
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Entrada</span>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={e => setEditStartTime(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400 mt-4">até</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">Saída</span>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={e => setEditEndTime(e.target.value)}
                      className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE COLABORADOR
          ============================================================== */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 text-center flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-900">
                Excluir Colaborador
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tem certeza que deseja remover <strong>{formatNameAndSurname(employeeToDelete.name)}</strong>? Ele deixará de ter acesso à plataforma e não aparecerá nas próximas escalas.
              </p>
            </div>
            <div className="w-full pt-2 flex items-center justify-center gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="flex-1 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
