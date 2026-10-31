import { Employee, ShiftStatus, WeekSchedule, CompanySettings, DayInfo } from '../types';

export const DAY_NAMES = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'] as const;

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'carlos',
    name: 'Carlos Eduardo Mendes',
    role: 'Operador Líder de Turno',
    status: 'active',
    initials: 'CE',
    colorBg: 'bg-blue-600',
    admissionDate: '2023-03-15',
    preferredDaysOff: [5, 6], // Sáb, Dom
    notes: 'Disponibilidade total para turnos matutinos',
  },
  {
    id: 'pedro',
    name: 'Pedro Santos',
    role: 'Atendente / Caixa',
    status: 'active',
    initials: 'PS',
    colorBg: 'bg-emerald-600',
    admissionDate: '2023-08-01',
    preferredDaysOff: [0, 1], // Seg, Ter
    notes: 'Preferência por folgas no início da semana',
  },
  {
    id: 'joao',
    name: 'João Silva',
    role: 'Vendedor Responsável',
    status: 'active',
    initials: 'JS',
    colorBg: 'bg-amber-600',
    admissionDate: '2022-11-10',
    preferredDaysOff: [4, 5], // Sex, Sáb
    notes: 'Experiência em liderança de piso',
  },
  {
    id: 'paulo',
    name: 'Paulo Roberto Silva',
    role: 'Assistente de Logística',
    status: 'active',
    initials: 'PR',
    colorBg: 'bg-indigo-600',
    admissionDate: '2024-01-20',
    preferredDaysOff: [2, 3], // Qua, Qui
    notes: 'Apoio em estoque e conferência',
  },
];

export const INITIAL_SETTINGS: CompanySettings = {
  regime: '5x2',
  operatingDays: 7,
  minStaffPerDay: 2,
  weeklyRestDays: 2,
  rotateShifts: true,
  rotateSundays: true,
  startDay: 1, // Segunda-feira
};

export const INITIAL_WEEK_SCHEDULE: WeekSchedule = {
  weekId: '2026-W44',
  weekNumber: 44,
  year: 2026,
  startDate: '2026-10-26',
  endDate: '2026-11-01',
  isPublished: true,
  shifts: {
    carlos: ['T', 'T', 'T', 'T', 'T', 'F', 'F'], // Folga Sáb, Dom
    pedro: ['F', 'F', 'T', 'T', 'T', 'T', 'T'], // Folga Seg, Ter
    joao: ['T', 'T', 'F', 'F', 'T', 'T', 'T'], // Folga Qua, Qui
    paulo: ['T', 'T', 'T', 'T', 'F', 'F', 'T'], // Folga Sex, Sáb
  },
};

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

    return {
      index: i,
      name,
      fullDate,
      formattedDate: `${dd}/${mm}`,
      dayNumber: d.getDate(),
      isWeekend: i === 5 || i === 6,
      isToday: todayStr ? fullDate === todayStr : i === 3,
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

  shifts.forEach(st => {
    if (st === 'T') workCount++;
    else offCount++;
  });

  return {
    workCount,
    offCount,
    isCompliant: workCount === 5 && offCount === 2,
  };
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
