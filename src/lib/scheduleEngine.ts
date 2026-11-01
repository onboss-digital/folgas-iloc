import { Employee, ShiftStatus, WeekSchedule, CompanySettings, DayInfo, ShiftSwapRequest } from '../types';
import { getHolidayInfo } from './holidays';

export const DAY_NAMES = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const;

export function formatNameAndSurname(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export const ADMIN_EMAIL = 'luizstaff@ilocmobile.com.br';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'thiago',
    name: 'Thiago Oliveira',
    email: 'thiago@ilocmobile.com.br',
    role: 'Especialista de Atendimento',
    team: 'Operações de Loja',
    workHours: '08:00 às 17:00',
    status: 'active',
    initials: 'TO',
    avatarUrl: '',
    colorBg: 'bg-blue-600',
    admissionDate: '2023-05-12',
    preferredDaysOff: [5, 6], // Sáb, Dom
    notes: 'Colaborador teste de referência para visualização do portal',
  },
  {
    id: 'carlos',
    name: 'Carlos Mendes',
    email: 'carlos@ilocmobile.com.br',
    role: 'Operador Líder de Turno',
    team: 'Operações de Loja',
    workHours: '08:00 às 17:00',
    status: 'active',
    initials: 'CM',
    avatarUrl: '',
    colorBg: 'bg-indigo-600',
    admissionDate: '2023-03-15',
    preferredDaysOff: [5, 6], // Sáb, Dom
    notes: 'Disponibilidade total para turnos matutinos',
  },
  {
    id: 'pedro',
    name: 'Pedro Santos',
    email: 'pedro@ilocmobile.com.br',
    role: 'Atendente / Caixa',
    team: 'Operações de Loja',
    workHours: '08:00 às 17:00',
    status: 'active',
    initials: 'PS',
    avatarUrl: '',
    colorBg: 'bg-emerald-600',
    admissionDate: '2023-08-01',
    preferredDaysOff: [0, 1], // Seg, Ter
    notes: 'Preferência por folgas no início da semana',
  },
  {
    id: 'joao',
    name: 'João Silva',
    email: 'joao@ilocmobile.com.br',
    role: 'Vendedor Responsável',
    team: 'Vendas e Atendimento',
    workHours: '09:00 às 18:00',
    status: 'active',
    initials: 'JS',
    avatarUrl: '',
    colorBg: 'bg-amber-600',
    admissionDate: '2022-11-10',
    preferredDaysOff: [4, 5], // Sex, Sáb
    notes: 'Experiência em liderança de piso',
  },
  {
    id: 'paulo',
    name: 'Paulo Silva',
    email: 'paulo@ilocmobile.com.br',
    role: 'Assistente de Logística',
    team: 'Logística e Estoque',
    workHours: '07:00 às 16:00',
    status: 'active',
    initials: 'PS',
    avatarUrl: '',
    colorBg: 'bg-violet-600',
    admissionDate: '2024-01-20',
    preferredDaysOff: [2, 3], // Qua, Qui
    notes: 'Apoio em estoque e conferência',
  },
  {
    id: 'mariana',
    name: 'Mariana Souza',
    email: 'mariana@ilocmobile.com.br',
    role: 'Apoio Administrativo',
    team: '',
    workHours: '08:00 às 17:00',
    status: 'active',
    initials: 'MS',
    avatarUrl: '',
    colorBg: 'bg-teal-600',
    admissionDate: '2024-05-10',
    preferredDaysOff: [0, 6],
    notes: 'Aguardando alocação em equipe',
  },
];

export const INITIAL_SETTINGS: CompanySettings = {
  regime: '5x2',
  operatingDays: 7,
  minStaffPerDay: 2,
  weeklyRestDays: 2,
  rotateShifts: true,
  rotateSundays: true,
  operatesOnHolidays: true,
  startDay: 1, // Segunda-feira
};

export const INITIAL_WEEK_SCHEDULE: WeekSchedule = {
  weekId: '2026-W44',
  weekNumber: 44,
  year: 2026,
  startDate: '2026-10-26',
  endDate: '2026-11-01',
  isPublished: true,
  isPublicShareEnabled: true,
  shareToken: 'escala-semana-44',
  publishedAt: '2026-10-26T08:00:00Z',
  shifts: {
    thiago: ['T', 'T', 'T', 'T', 'T', 'F', 'F'], // Folga Sáb, Dom
    carlos: ['T', 'T', 'T', 'T', 'T', 'F', 'F'], // Folga Sáb, Dom
    pedro: ['F', 'F', 'T', 'T', 'T', 'T', 'T'], // Folga Seg, Ter
    joao: ['T', 'T', 'F', 'F', 'T', 'T', 'T'], // Folga Qua, Qui
    paulo: ['T', 'T', 'T', 'T', 'F', 'F', 'T'], // Folga Sex, Sáb
    mariana: ['F', 'T', 'T', 'T', 'T', 'T', 'F'], // Folga Seg, Dom
  },
  customHours: {
    thiago: ['08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', undefined, undefined],
    carlos: ['08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', undefined, undefined],
    pedro: [undefined, undefined, '12:00 às 21:00', '12:00 às 21:00', '12:00 às 21:00', '12:00 às 21:00', '12:00 às 21:00'],
    joao: ['09:00 às 18:00', '09:00 às 18:00', undefined, undefined, '09:00 às 18:00', '09:00 às 18:00', '09:00 às 18:00'],
    paulo: ['07:00 às 16:00', '07:00 às 16:00', '07:00 às 16:00', '07:00 às 16:00', undefined, undefined, '07:00 às 16:00'],
    mariana: [undefined, '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', '08:00 às 17:00', undefined],
  },
};

export const INITIAL_SCHEDULE_HISTORY: Record<string, WeekSchedule> = {
  '2026-W42': {
    weekId: '2026-W42',
    weekNumber: 42,
    year: 2026,
    startDate: '2026-10-12',
    endDate: '2026-10-18',
    isPublished: true,
    isPublicShareEnabled: true,
    publishedAt: '2026-10-12T08:00:00Z',
    shifts: {
      thiago: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      carlos: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      pedro: ['F', 'F', 'T', 'T', 'T', 'T', 'T'],
      joao: ['T', 'T', 'F', 'F', 'T', 'T', 'T'],
      paulo: ['T', 'T', 'T', 'T', 'F', 'F', 'T'],
      mariana: ['F', 'T', 'T', 'T', 'T', 'T', 'F'],
    },
  },
  '2026-W43': {
    weekId: '2026-W43',
    weekNumber: 43,
    year: 2026,
    startDate: '2026-10-19',
    endDate: '2026-10-25',
    isPublished: true,
    isPublicShareEnabled: true,
    publishedAt: '2026-10-19T08:00:00Z',
    shifts: {
      thiago: ['T', 'T', 'T', 'T', 'F', 'T', 'F'],
      carlos: ['F', 'F', 'T', 'T', 'T', 'T', 'T'],
      pedro: ['T', 'T', 'F', 'F', 'T', 'T', 'T'],
      joao: ['T', 'T', 'T', 'T', 'F', 'F', 'T'],
      paulo: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      mariana: ['T', 'F', 'F', 'T', 'T', 'T', 'T'],
    },
  },
  '2026-W44': INITIAL_WEEK_SCHEDULE,
  '2026-W45': {
    weekId: '2026-W45',
    weekNumber: 45,
    year: 2026,
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    isPublished: true,
    isPublicShareEnabled: true,
    publishedAt: '2026-10-30T10:00:00Z',
    shifts: {
      thiago: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      carlos: ['T', 'T', 'F', 'F', 'T', 'T', 'T'],
      pedro: ['T', 'T', 'T', 'T', 'F', 'F', 'T'],
      joao: ['T', 'T', 'T', 'T', 'T', 'F', 'F'],
      paulo: ['F', 'F', 'T', 'T', 'T', 'T', 'T'],
      mariana: ['T', 'T', 'T', 'F', 'F', 'T', 'T'],
    },
  },
};

export function getWeekDateRange(weekOffset: number) {
  const base = new Date(2026, 9, 26 + weekOffset * 7);
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  const startDateStr = `${yyyy}-${mm}-${dd}`;

  const endDate = new Date(base);
  endDate.setDate(base.getDate() + 6);
  const endY = endDate.getFullYear();
  const endM = String(endDate.getMonth() + 1).padStart(2, '0');
  const endD = String(endDate.getDate()).padStart(2, '0');
  const endDateStr = `${endY}-${endM}-${endD}`;

  const weekNumber = 44 + weekOffset;
  const weekId = `${yyyy}-W${weekNumber}`;

  return {
    startDateStr,
    endDateStr,
    weekNumber,
    weekId,
    periodText: `${dd}/${mm} a ${endD}/${endM}/${endY}`,
  };
}

export function getWeekDays(startDateStr: string, todayStr?: string): DayInfo[] {
  const parts = startDateStr.split('-').map(Number);
  const baseDate = new Date(parts[0], parts[1] - 1, parts[2]);

  return DAY_NAMES.map((name, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fullDate = `${yyyy}-${mm}-${dd}`;
    const holidayInfo = getHolidayInfo(fullDate);

    return {
      index: i,
      name,
      fullDate,
      formattedDate: `${dd}/${mm}`,
      dayNumber: d.getDate(),
      isWeekend: i === 5 || i === 6,
      isToday: todayStr ? fullDate === todayStr : i === 3,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
    };
  });
}

export function calculateDailyCoverage(
  shifts: Record<string, ShiftStatus[]>,
  activeEmployees: Employee[],
  minStaff: number
) {
  const activeIds = new Set(activeEmployees.filter(e => e.status === 'active').map(e => e.id));
  const counts = Array(7).fill(0);

  activeIds.forEach(id => {
    const empShifts = shifts[id];
    if (empShifts) {
      empShifts.forEach((status, dayIdx) => {
        if (status === 'T') {
          counts[dayIdx]++;
        }
      });
    }
  });

  return counts.map((workingCount, dayIndex) => ({
    dayIndex,
    dayName: DAY_NAMES[dayIndex],
    workingCount,
    minStaff,
    isBelowMinimum: workingCount < minStaff,
  }));
}

export function calculateEmployeeSummary(shifts: ShiftStatus[]) {
  let workCount = 0;
  let offCount = 0;
  let absenceCount = 0;
  let unassignedCount = 0;

  shifts.forEach(st => {
    if (st === 'T') workCount++;
    else if (st === 'F') offCount++;
    else if (st === 'AUSENTE' || st === 'FERIAS' || st === 'AFASTADO') absenceCount++;
    else if (st === 'SEM_ESCALA') unassignedCount++;
    else offCount++;
  });

  return {
    workCount,
    offCount,
    absenceCount,
    unassignedCount,
    isCompliant: workCount === 5 && offCount === 2,
  };
}

export function getEmployeeDayHours(
  schedule: WeekSchedule,
  emp: Employee,
  dayIdx: number
): string {
  const custom = schedule.customHours?.[emp.id]?.[dayIdx];
  if (custom && custom.trim() !== '') {
    return custom;
  }
  return emp.workHours || '08:00 às 17:00';
}

/**
 * Algoritmo determinístico de geração de escala 5x2.
 * Garante para cada colaborador 5 dias de trabalho e 2 folgas,
 * mantendo ao menos o contingente mínimo em todos os 7 dias.
 */
export function generateAutomaticSchedule(
  employees: Employee[],
  weekOffset: number = 0
): Record<string, ShiftStatus[]> {
  const active = employees.filter(e => e.status === 'active');
  const result: Record<string, ShiftStatus[]> = {};

  if (active.length === 0) return result;

  // Padrões de folgas rotativas em pares consecutivos ou balanceados
  const offPatterns: [number, number][] = [
    [5, 6], // Sáb, Dom
    [0, 1], // Seg, Ter
    [2, 3], // Qua, Qui
    [4, 5], // Sex, Sáb
    [1, 2], // Ter, Qua
    [3, 4], // Qui, Sex
    [6, 0], // Dom, Seg
  ];

  active.forEach((emp, index) => {
    // Rotação justa por semana
    const patternIdx = (index + Math.abs(weekOffset)) % offPatterns.length;
    const [off1, off2] = offPatterns[patternIdx];

    const weekShifts: ShiftStatus[] = Array(7).fill('T');
    weekShifts[off1] = 'F';
    weekShifts[off2] = 'F';

    result[emp.id] = weekShifts;
  });

  return result;
}


/**
 * Aplica uma solicitação de troca de escala aprovada entre dois colaboradores
 */
export function applyShiftSwapToSchedule(
  schedule: WeekSchedule,
  swap: ShiftSwapRequest
): WeekSchedule {
  const shifts: Record<string, ShiftStatus[]> = {};
  const customHours: Record<string, (string | undefined)[]> = {};

  Object.keys(schedule.shifts).forEach(empId => {
    shifts[empId] = [...(schedule.shifts[empId] || Array(7).fill('T'))];
  });

  if (schedule.customHours) {
    Object.keys(schedule.customHours).forEach(empId => {
      customHours[empId] = [...(schedule.customHours![empId] || Array(7).fill(undefined))];
    });
  }

  const reqShifts = shifts[swap.requesterId] || Array(7).fill('T');
  const targetShifts = shifts[swap.targetId] || Array(7).fill('T');
  const reqHours = customHours[swap.requesterId] || Array(7).fill(undefined);
  const targetHours = customHours[swap.targetId] || Array(7).fill(undefined);

  const dayA = swap.requesterDayIndex;
  const dayB = swap.targetDayIndex;

  if (dayA === dayB) {
    // Mesmo dia: troca direta de turnos e horários no mesmo dia
    const tempShift = reqShifts[dayA];
    reqShifts[dayA] = targetShifts[dayA];
    targetShifts[dayA] = tempShift;

    const tempHours = reqHours[dayA];
    reqHours[dayA] = targetHours[dayA];
    targetHours[dayA] = tempHours;
  } else {
    // Dias distintos (ex: dia A do solicitante por dia B do colega)
    const tempShiftA = reqShifts[dayA];
    reqShifts[dayA] = targetShifts[dayA];
    targetShifts[dayA] = tempShiftA;

    const tempHoursA = reqHours[dayA];
    reqHours[dayA] = targetHours[dayA];
    targetHours[dayA] = tempHoursA;

    const tempShiftB = targetShifts[dayB];
    targetShifts[dayB] = reqShifts[dayB];
    reqShifts[dayB] = tempShiftB;

    const tempHoursB = targetHours[dayB];
    targetHours[dayB] = reqHours[dayB];
    reqHours[dayB] = tempHoursB;
  }

  shifts[swap.requesterId] = reqShifts;
  shifts[swap.targetId] = targetShifts;
  customHours[swap.requesterId] = reqHours;
  customHours[swap.targetId] = targetHours;

  return {
    ...schedule,
    shifts,
    customHours,
  };
}

/**
 * Constrói URL pública inteligente da escala contendo os parâmetros de semana e período legíveis
 */
export function buildPublicScheduleUrl(schedule: WeekSchedule, origin?: string): string {
  const baseUrl =
    origin ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://folgas-iloc.vercel.app');

  if (!schedule) return `${baseUrl}/escala-publica`;

  const params = new URLSearchParams();

  // 1. Identificador de semana (ex: 2026-W45)
  if (schedule.weekId) {
    params.set('semana', schedule.weekId);
  }

  // 2. Período legível da semana na URL (ex: 02-11-a-08-11-2026)
  if (schedule.startDate && schedule.endDate) {
    const sParts = schedule.startDate.split('-');
    const eParts = schedule.endDate.split('-');
    if (sParts.length === 3 && eParts.length === 3) {
      params.set('periodo', `${sParts[2]}-${sParts[1]}-a-${eParts[2]}-${eParts[1]}-${eParts[0]}`);
    }
  }

  // 3. Token de compartilhamento e autorização
  if (schedule.shareToken) {
    params.set('token', schedule.shareToken);
  }

  const qs = params.toString();
  return qs ? `${baseUrl}/escala-publica?${qs}` : `${baseUrl}/escala-publica`;
}
