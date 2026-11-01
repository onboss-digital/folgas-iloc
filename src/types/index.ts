export type ShiftStatus = 'T' | 'F' | 'AUSENTE' | 'FERIAS' | 'AFASTADO' | 'SEM_ESCALA';

export type UserProfile = 'funcionario' | 'administrador';

export interface Employee {
  id: string;
  name: string;
  email?: string; // E-mail institucional de login
  role: string;
  status: 'active' | 'inactive';
  team?: string; // Time ao qual pertence (ex: 'Operações e Loja', 'Vendas e Atendimento', etc.)
  workHours?: string; // Horário de expediente (ex: '08:00 às 17:00')
  avatarUrl?: string;
  initials: string;
  colorBg: string;
  admissionDate: string;
  preferredDaysOff: number[]; // 0=Seg, 1=Ter, 2=Qua, 3=Qui, 4=Sex, 5=Sab, 6=Dom
  notes?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'colaborador';
  avatarUrl?: string;
}

export interface DayInfo {
  index: number; // 0 to 6
  name: string; // SEG, TER, QUA, QUI, SEX, SÁB, DOM
  fullDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "21/10"
  dayNumber: number; // e.g. 21
  isWeekend: boolean;
  isToday: boolean;
  isHoliday?: boolean;
  holidayName?: string;
}

export interface WeekSchedule {
  weekId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  isPublicShareEnabled: boolean;
  publishedAt?: string;
  shareToken?: string;
  shifts: Record<string, ShiftStatus[]>; // employeeId -> [7 items for Mon..Sun]
  customHours?: Record<string, (string | undefined)[]>; // employeeId -> [7 items for Mon..Sun] horario personalizado (ex: '08:00 às 17:00')
}

export interface CompanySettings {
  regime: string;
  operatingDays: number;
  minStaffPerDay: number;
  weeklyRestDays: number;
  rotateShifts: boolean;
  rotateSundays: boolean;
  operatesOnHolidays?: boolean; // Se a unidade/loja opera em feriados nacionais
  startDay: number;
}

export type ActiveTab = 'inicio' | 'escala' | 'ajustes' | 'perfil';
