'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Building2,
  ShieldCheck,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { Employee, WeekSchedule, DayInfo } from '../../types';
import {
  getWeekDays,
  formatNameAndSurname,
  getEmployeeDayHours,
} from '../../lib/scheduleEngine';
import { getWeekDisplayHeader } from '../../components/escala/GerenciarEscalasTab';
import { fetchPublicScheduleByToken, fetchPublicScheduleByWeekId, fetchLatestPublishedScheduleFromSupabase } from '../../lib/supabase';
import { getTodayStrBrasilia } from '../../lib/dateUtils';

function EscalaPublicaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const semanaParam = searchParams.get('semana') || searchParams.get('week');
  const periodoParam = searchParams.get('periodo');

  const [schedule, setSchedule] = useState<WeekSchedule>({
    weekId: '',
    weekNumber: 1,
    year: 2026,
    startDate: '',
    endDate: '',
    isPublished: false,
    isPublicShareEnabled: false,
    shifts: {},
    customHours: {},
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  const startDateStr = schedule.startDate || '2026-10-26';
  const todayStr = getTodayStrBrasilia();
  const days: DayInfo[] = getWeekDays(startDateStr, todayStr);
  const weekHeader = getWeekDisplayHeader(days);

  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      let resolvedSchedule: WeekSchedule | null = null;
      let resolvedEmployees: Employee[] = [];

      // 1. Se houver semana específica na URL (ex: 2026-W45), busca prioritariamente pela semana oficial
      if (semanaParam) {
        try {
          const { schedule: weekSched, employees: weekEmps } = await fetchPublicScheduleByWeekId(semanaParam);
          if (weekSched) {
            resolvedSchedule = weekSched;
            if (weekEmps && weekEmps.length > 0) {
              resolvedEmployees = weekEmps;
            }
          }
        } catch (err) {
          console.warn('Aviso ao consultar escala por semana na nuvem:', err);
        }
      }

      // 2. Se houver token na URL e ainda não encontrou, busca pelo token de compartilhamento
      if (!resolvedSchedule && token) {
        try {
          const { schedule: cloudSched, employees: cloudEmps } = await fetchPublicScheduleByToken(token);
          if (cloudSched) {
            resolvedSchedule = cloudSched;
            if (cloudEmps && cloudEmps.length > 0) {
              resolvedEmployees = cloudEmps;
            }
          }
        } catch (err) {
          console.warn('Aviso ao consultar escala por token na nuvem:', err);
        }
      }

      // 3. Se não houver parâmetros específicos ou falhar, busca a escala mais recente publicada na nuvem
      if (!resolvedSchedule) {
        try {
          const { schedule: latestCloudSched, employees: latestCloudEmps } = await fetchLatestPublishedScheduleFromSupabase();
          if (latestCloudSched) {
            resolvedSchedule = latestCloudSched;
            if (latestCloudEmps && latestCloudEmps.length > 0) {
              resolvedEmployees = latestCloudEmps;
            }
          }
        } catch (err) {
          console.warn('Aviso ao consultar última escala na nuvem:', err);
        }
      }

      // 4. Fallback para dados locais do navegador
      if (!resolvedSchedule) {
        try {
          const savedMap = localStorage.getItem('iloc_schedules_map');
          const savedSchedule = localStorage.getItem('iloc_schedule');

          if (savedMap) {
            const parsedMap: Record<string, WeekSchedule> = JSON.parse(savedMap);
            // 4a. Busca pelo weekId correspondente
            if (semanaParam && parsedMap[semanaParam] && parsedMap[semanaParam].isPublished && parsedMap[semanaParam].isPublicShareEnabled) {
              resolvedSchedule = parsedMap[semanaParam];
            }
            // 4b. Busca pelo token
            if (!resolvedSchedule && token) {
              const matched = Object.values(parsedMap).find(
                s => (s.shareToken === token || s.weekId === token) && s.isPublished && s.isPublicShareEnabled
              );
              if (matched) resolvedSchedule = matched;
            }
            // 4c. Qualquer publicada
            if (!resolvedSchedule) {
              const anyPublished = Object.values(parsedMap).find(
                s => s.isPublished && s.isPublicShareEnabled
              );
              if (anyPublished) resolvedSchedule = anyPublished;
            }
          }

          if (!resolvedSchedule && savedSchedule) {
            const parsed = JSON.parse(savedSchedule);
            if (parsed.isPublished && parsed.isPublicShareEnabled) {
              resolvedSchedule = parsed;
            }
          }
        } catch (err) {
          console.warn('Aviso ao ler armazenamento local:', err);
        }
      }

      // 5. Carrega colaboradores locais se a nuvem não tiver retornado
      if (resolvedEmployees.length === 0) {
        try {
          const savedEmployees = localStorage.getItem('iloc_employees');
          if (savedEmployees) {
            resolvedEmployees = JSON.parse(savedEmployees);
          }
        } catch {}
      }

      // 6. Finaliza estado
      if (resolvedSchedule && resolvedSchedule.isPublished && resolvedSchedule.isPublicShareEnabled) {
        setSchedule(resolvedSchedule);
        setEmployees(resolvedEmployees);
        setNotFound(false);

        // Ajusta dia selecionado para o dia de hoje se estiver dentro da semana da escala
        const schedDays = getWeekDays(resolvedSchedule.startDate, todayStr);
        const todayIdx = schedDays.findIndex(d => d.isToday);
        if (todayIdx !== -1) {
          setSelectedDayIdx(todayIdx);
        } else {
          setSelectedDayIdx(0);
        }
      } else {
        setNotFound(true);
      }

      setIsLoading(false);
    };

    loadSchedule();
  }, [token, semanaParam, todayStr]);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const selectedDay = days[selectedDayIdx] || days[0];

  // Identifica quem trabalha e quem folga no dia selecionado
  const workingEmployees: Employee[] = [];
  const offEmployees: Employee[] = [];

  activeEmployees.forEach(emp => {
    const empShifts = schedule.shifts[emp.id] || Array(7).fill('T');
    if (empShifts[selectedDayIdx] === 'T') {
      workingEmployees.push(emp);
    } else {
      offEmployees.push(emp);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm animate-pulse">
            iLoc
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Carregando escala oficial...
          </span>
        </div>
      </div>
    );
  }

  // Se o compartilhamento foi revogado ou não publicado
  if (notFound || !schedule.isPublished || !schedule.isPublicShareEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 text-center">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-base font-bold text-slate-900">
            Escala Indisponível
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            O compartilhamento público desta escala foi desativado ou aguarda publicação pelo administrador da filial.
          </p>
          <span className="text-[11px] text-slate-400 mt-2">
            Escalas iLoc • Filial Central
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased pb-12">
      {/* Topo Público de Identificação */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              iLoc
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight">
                Escalas iLoc
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Filial Central • Escala Pública</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Oficial Publicada</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 flex flex-col gap-4">
        {/* Banner do Período */}
        <section className="p-5 rounded-2xl bg-blue-600 text-white shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-blue-100">
            <span className="font-semibold uppercase tracking-wider">
              {weekHeader.monthTitle}
            </span>
            <span className="bg-blue-700/60 px-2 py-0.5 rounded-full text-[11px] font-medium">
              Horário de Brasília (GMT-3)
            </span>
          </div>

          <h2 className="text-lg font-black text-white tracking-tight">
            Escala Semanal de Trabalho
          </h2>
          <p className="text-xs text-blue-100 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-blue-200" />
            <span>{weekHeader.weekSubtitle}</span>
          </p>
        </section>

        {/* Seletor dos 7 Dias da Semana */}
        <section className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Selecione o Dia para Consultar
          </span>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, idx) => {
              const isSelected = idx === selectedDayIdx;
              const isToday = day.isToday;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-[9px] uppercase leading-none ${
                      isSelected ? 'text-blue-100' : 'text-slate-400 font-semibold'
                    }`}
                  >
                    {day.name}
                  </span>
                  <span className="text-sm font-black mt-0.5">
                    {day.dayNumber}
                  </span>
                  {isToday && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-blue-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quadro do Dia Selecionado */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDay.name === 'DOM'
                    ? 'Domingo'
                    : selectedDay.name === 'SÁB'
                    ? 'Sábado'
                    : `${selectedDay.name}-feira`}{' '}
                  ({selectedDay.formattedDate})
                </h3>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {workingEmployees.length} em atendimento
              </span>
            </div>

            {selectedDay.isHoliday && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold w-fit mt-1">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>Feriado Nacional: {selectedDay.holidayName}</span>
              </div>
            )}
          </div>

          {/* GRID RESPONSIVO: ESCALADOS vs FOLGA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Lista de Colaboradores em Expediente */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Colaboradores Escalados ({workingEmployees.length})
              </span>

              {workingEmployees.map(emp => {
                const dayHours = getEmployeeDayHours(schedule, emp, selectedDayIdx);
                return (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${emp.colorBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs`}
                      >
                        {emp.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {emp.role} {emp.team ? `• ${emp.team}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{dayHours.replace('às', '–')}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        1h intervalo • Horário de Brasília
                      </span>
                    </div>
                  </div>
                );
              })}

              {workingEmployees.length === 0 && (
                <div className="p-5 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                  Nenhum colaborador escalado para esta data.
                </div>
              )}
            </div>

            {/* Lista de Colaboradores de Folga no Dia */}
            {offEmployees.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  De Folga neste Dia ({offEmployees.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {offEmployees.map(emp => (
                    <div
                      key={emp.id}
                      className="p-3 rounded-xl bg-white border border-slate-200/70 flex items-center gap-2.5 shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {emp.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {formatNameAndSurname(emp.name)}
                        </span>
                        <span className="text-[10px] text-rose-600 font-semibold">
                          {selectedDay.isHoliday ? 'Folga Compensatória' : 'Folga Programada'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Rodapé Informativo Público */}
        <footer className="pt-4 pb-2 border-t border-slate-200 text-center flex flex-col items-center gap-1">
          <p className="text-[11px] text-slate-500 font-medium">
            Escala oficial gerada e homologada via Escalas iLoc.
          </p>
          <span className="text-[10px] text-slate-400">
            Filial Central • Atualizado em tempo real
          </span>
        </footer>
      </main>
    </div>
  );
}

export default function EscalaPublicaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm animate-pulse">
              iLoc
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Carregando escala...
            </span>
          </div>
        </div>
      }
    >
      <EscalaPublicaContent />
    </Suspense>
  );
}
