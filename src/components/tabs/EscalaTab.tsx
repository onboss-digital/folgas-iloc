'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Coffee,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Edit3,
} from 'lucide-react';
import { Employee, WeekSchedule, CompanySettings, DayInfo, AuthUser } from '../../types';
import { formatNameAndSurname, getEmployeeDayHours } from '../../lib/scheduleEngine';
import { HistoricoEscalas } from '../escala/HistoricoEscalas';
import { LinkEscalaCard } from '../escala/LinkEscalaCard';
import { GerenciarEscalasTab, getWeekDisplayHeader } from '../escala/GerenciarEscalasTab';

interface EscalaTabProps {
  employees: Employee[];
  schedule: WeekSchedule;
  settings: CompanySettings;
  days: DayInfo[];
  weekOffset: number;
  onChangeWeekOffset: (delta: number) => void;
  onResetWeekOffset: () => void;
  todayStr?: string;
  currentUser?: AuthUser | null;
  onCopySuccess?: () => void;
  onSaveDraft?: (schedule: WeekSchedule) => void;
  onPublishSchedule?: (schedule: WeekSchedule) => void;
  onCopyPreviousWeek?: () => void;
  onAddEmployee?: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee?: (employee: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
  isScheduleCreated?: boolean;
  onCreateScheduleForWeek?: () => void;
  onNavigateToAjustes?: () => void;
}

export function EscalaTab({
  employees,
  schedule,
  settings,
  days,
  weekOffset,
  onChangeWeekOffset,
  onResetWeekOffset,
  todayStr,
  currentUser,
  onCopySuccess,
  onSaveDraft,
  onPublishSchedule,
  onCopyPreviousWeek,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  isScheduleCreated,
  onCreateScheduleForWeek,
  onNavigateToAjustes,
}: EscalaTabProps) {
  // Informações formatadas do mês e semana
  const weekHeader = getWeekDisplayHeader(days);

  // Dia de hoje ou selecionado
  const todayIndex = days.findIndex(d => d.isToday) !== -1 ? days.findIndex(d => d.isToday) : 3;
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIndex);

  const isAdmin = currentUser?.role === 'admin';
  const loggedEmp = employees.find(
    e => e.id === currentUser?.id || e.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  // Modo de visualização do Administrador ('editor' ou 'preview')
  const [adminViewMode, setAdminViewMode] = useState<'editor' | 'preview'>('editor');

  // Lista de equipes distintas cadastradas
  const distinctTeams = Array.from(
    new Set(employees.map(e => e.team).filter(Boolean))
  ) as string[];

  // Time selecionado: se for colaborador, utiliza estritamente o seu time vinculado
  const [selectedTeam, setSelectedTeam] = useState<string>(
    !isAdmin && loggedEmp?.team !== undefined
      ? loggedEmp.team
      : distinctTeams[0] || 'Operações de Loja'
  );

  // Atualiza time se usuario mudar
  React.useEffect(() => {
    if (!isAdmin && loggedEmp?.team !== undefined) {
      setSelectedTeam(loggedEmp.team);
    }
  }, [isAdmin, loggedEmp?.team]);

  // Se for administrador e estiver no modo Editor, renderiza o painel de criação e gerenciamento
  if (isAdmin && adminViewMode === 'editor') {
    return (
      <div className="flex flex-col gap-3">
        {/* Barra superior de alternância para o Administrador */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100 border border-slate-200">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            Modo: Editor de Escala
          </span>
          <button
            onClick={() => setAdminViewMode('preview')}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Ver como Colaborador
          </button>
        </div>

        <GerenciarEscalasTab
          employees={employees}
          schedule={schedule}
          settings={settings}
          days={days}
          weekOffset={weekOffset}
          onChangeWeekOffset={onChangeWeekOffset}
          onResetWeekOffset={onResetWeekOffset}
          onSaveDraft={onSaveDraft || (() => {})}
          onPublishSchedule={onPublishSchedule || (() => {})}
          onCopyPreviousWeek={onCopyPreviousWeek || (() => {})}
          currentUser={currentUser}
          onPreviewAsColaborador={() => setAdminViewMode('preview')}
          onAddEmployee={onAddEmployee}
          onUpdateEmployee={onUpdateEmployee}
          onDeleteEmployee={onDeleteEmployee}
          isScheduleCreated={isScheduleCreated}
          onCreateSchedule={onCreateScheduleForWeek}
          onNavigateToAjustes={onNavigateToAjustes}
        />
      </div>
    );
  }

  // Formata o nome do dia da semana
  const formatDayTitle = (name: string) => {
    if (name === 'DOM') return 'Domingo';
    if (name === 'SÁB') return 'Sábado';
    return `${name}-feira`;
  };

  // Formata a data completa de forma determinística
  const formatFullDisplayDate = (day: DayInfo) => {
    if (!day || !day.fullDate) return '';
    const parts = day.fullDate.split('-').map(Number);
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const dayNumber = parts[2] || day.dayNumber;
    const monthName = months[(parts[1] || 1) - 1];
    return `${formatDayTitle(day.name)}, ${dayNumber} de ${monthName}`;
  };

  const selectedDayInfo = days[selectedDayIdx] || days[0];

  // FILTRAGEM RÍGIDA POR TIME: Nunca misturar funcionários de equipes diferentes
  const teamEmployees = employees.filter(
    emp => emp.status === 'active' && emp.team === selectedTeam
  );

  // Identifica quem folga, quem trabalha e quem está ausente no time no dia selecionado
  const offEmployees: Employee[] = [];
  const workingEmployees: Employee[] = [];
  const absentEmployees: Employee[] = [];

  teamEmployees.forEach(emp => {
    const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
    const status = empShifts[selectedDayIdx] || 'T';
    if (status === 'F') {
      offEmployees.push(emp);
    } else if (status === 'AUSENTE' || status === 'FERIAS' || status === 'AFASTADO') {
      absentEmployees.push(emp);
    } else if (status === 'T') {
      workingEmployees.push(emp);
    }
  });

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Se o Administrador estiver no modo de pré-visualização, mostra botão de retorno */}
      {isAdmin && adminViewMode === 'preview' && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold">
              Visualizando como a equipe enxerga a escala
            </span>
          </div>
          <button
            onClick={() => setAdminViewMode('editor')}
            className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-2xs"
          >
            Voltar ao Editor
          </button>
        </div>
      )}

      {/* Topo: Identificação do Time */}
      <section className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Escala do Time
            </span>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              {selectedTeam || 'Operações de Loja'}
            </h1>
          </div>
        </div>
      </section>

      {/* SEÇÃO: LINK DA ESCALA (ACESSO DIRETO PARA VISUALIZAR E COPIAR - EXCLUSIVO ADMINISTRADOR) */}
      {isAdmin && <LinkEscalaCard schedule={schedule} onCopySuccess={onCopySuccess} />}

      {/* AVISO QUANDO A ESCALA FOR RASCUNHO (NÃO PUBLICADA) PARA COLABORADORES */}
      {!schedule.isPublished && (
        <section className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-xs font-bold">
              Escala em Organização • {weekHeader.weekSubtitle}
            </span>
            <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
              O administrador está definindo as folgas e os horários desta semana. As informações definitivas estarão disponíveis após a publicação oficial.
            </p>
          </div>
        </section>
      )}

      {/* Identificação Clara do Dia e Seletor dos 7 Dias da Semana */}
      <section className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeWeekOffset(-1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-90"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-900">
              {weekHeader.monthTitle} • {weekHeader.weekSubtitle}
            </span>
            <button
              onClick={() => onChangeWeekOffset(1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-90"
              title="Próxima semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {schedule.isPublished ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Publicada
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                Rascunho
              </span>
            )}
          </div>
        </div>

        {/* 7 Dias da Semana */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {days.map((day, idx) => {
            const isSelected = selectedDayIdx === idx;
            return (
              <button
                key={day.fullDate}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : day.isHoliday
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                }`}
                title={day.isHoliday ? `Feriado: ${day.holidayName}` : undefined}
              >
                <span className="text-[10px] font-bold tracking-tight">
                  {day.name}
                </span>
                <span className="text-xs font-black mt-0.5">
                  {day.dayNumber}
                </span>
                {day.isHoliday ? (
                  <span
                    className={`text-[8px] font-black uppercase px-1 py-0.2 rounded mt-0.5 leading-tight ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-200 text-purple-800'
                    }`}
                  >
                    Fer
                  </span>
                ) : day.isToday ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? 'bg-white' : 'bg-blue-600'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Título amplo da data selecionada */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {formatFullDisplayDate(selectedDayInfo)}
            </h2>
          </div>
          {selectedDayInfo.isHoliday && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Feriado Nacional: {selectedDayInfo.holidayName}</span>
            </div>
          )}
        </div>
      </section>

      {/* CASO O USUÁRIO NÃO ESTEJA VINCULADO A NENHUM TIME */}
      {!selectedTeam ? (
        <section className="w-full p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Nenhum Time Vinculado
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Você não está vinculado a nenhuma equipe ou time da filial. Solicite ao gestor a inclusão do seu perfil em um time para consultar sua escala.
          </p>
        </section>
      ) : (
        <>
          {/* GRID RESPONSIVO: 1 COLUNA NO CELULAR, 2 COLUNAS NO COMPUTADOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* SEÇÃO 1: FOLGANDO NESTE DIA */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-red-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Folgando no Time
                  </h2>
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                  {offEmployees.length} {offEmployees.length === 1 ? 'colaborador' : 'colaboradores'}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {offEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-12 h-12 rounded-full object-cover shadow-xs border border-slate-200"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-sm font-bold shadow-xs`}
                          >
                            {emp.initials}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full ring-2 ring-white" />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {emp.role}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex-shrink-0">
                      {selectedDayInfo.isHoliday ? 'Folga no Feriado' : 'Folga'}
                    </span>
                  </div>
                ))}

                {offEmployees.length === 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center text-xs text-slate-500">
                    Nenhum colaborador deste time de folga nesta data.
                  </div>
                )}
              </div>
            </section>

            {/* SEÇÃO 2: TRABALHANDO NESTE DIA */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Trabalhando no Time
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {workingEmployees.length} {workingEmployees.length === 1 ? 'colaborador' : 'colaboradores'}
                </span>
              </div>

              {selectedDayInfo.isHoliday && workingEmployees.length > 0 && (
                <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold">
                      Operação em Feriado Nacional: {selectedDayInfo.holidayName}
                    </span>
                    <span className="text-[11px] text-purple-800 leading-tight mt-0.5">
                      Os colaboradores escalados possuem direito a folga compensatória na mesma semana ou pagamento com adicional de 100% conforme CLT.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {workingEmployees.map(emp => {
                  const dayHours = getEmployeeDayHours(schedule, emp, selectedDayIdx);

                  return (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-12 h-12 rounded-full object-cover shadow-xs border border-slate-200"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-sm font-bold shadow-xs`}
                            >
                              {emp.initials}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {formatNameAndSurname(emp.name)}
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {emp.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                          selectedDayInfo.isHoliday
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <Clock className={`w-3 h-3 ${selectedDayInfo.isHoliday ? 'text-purple-600' : 'text-emerald-600'}`} />
                          <span>{dayHours}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {selectedDayInfo.isHoliday ? 'Feriado • 1h intervalo' : '1h de intervalo'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {workingEmployees.length === 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center text-xs text-slate-500">
                    Nenhum colaborador deste time escalado para trabalhar nesta data.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SEÇÃO 3: AUSÊNCIAS JUSTIFICADAS / LICENÇAS (SE HOUVER) */}
          {absentEmployees.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Ausências Justificadas
                  </h2>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {absentEmployees.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {absentEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold`}
                          >
                            {emp.initials}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {emp.role}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                      Ausente
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* SEÇÃO: HISTÓRICO DE ESCALAS */}
      <HistoricoEscalas
        employees={employees}
        todayStr={todayStr || days[todayIndex]?.fullDate || '2026-10-31'}
        currentSchedule={schedule}
        selectedTeam={selectedTeam}
        defaultEmployeeId={loggedEmp?.id}
      />
    </div>
  );
}
