export type ShiftStatus = 'T' | 'F' | 'FERIAS' | 'AFASTADO';

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  avatarUrl?: string;
  initials: string;
  colorBg: string;
  admissionDate: string;
  preferredDaysOff: number[]; // 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sab, 6=Dom
  notes?: string;
}

export interface DayInfo {
  index: number; // 0 to 6
  name: string; // SEG, TER, QUA, QUI, SEX, SÁB, DOM
  fullDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "21/10"
  dayNumber: number; // e.g. 21
  isWeekend: boolean;
  isToday: boolean;
}

export interface WeekSchedule {
  weekId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  shifts: Record<string, ShiftStatus[]>; // employeeId -> [7 items for Mon..Sun]
}

export interface CompanySettings {
  regime: string;
  operatingDays: number;
  minStaffPerDay: number;
  weeklyRestDays: number;
  rotateShifts: boolean;
  rotateSundays: boolean;
  startDay: number;
}

export type ActiveTab = 'inicio' | 'escala' | 'equipe' | 'ajustes';
