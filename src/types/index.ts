export type ShiftStatus = 'T' | 'F' | 'AUSENTE' | 'FERIAS' | 'AFASTADO' | 'SEM_ESCALA';

export type UserProfile = 'funcionario' | 'administrador';

export type WorkModel = 'presencial' | 'home_office' | 'hibrido';

export type TimezonePreference = 'local' | 'brasilia';

export interface Employee {
  id: string;
  name: string;
  email?: string; // E-mail institucional de login
  role: string;
  status: 'active' | 'inactive';
  team?: string; // Time ao qual pertence (ex: 'Operações de Loja', 'Vendas e Atendimento', etc.)
  workHours?: string; // Horário de expediente (ex: '08:00 às 17:00')
  workModel?: WorkModel; // Modalidade padrão (presencial, home office ou híbrido)
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
  workModels?: Record<string, (WorkModel | undefined)[]>; // employeeId -> [7 items for Mon..Sun] modalidade por dia
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
  timezonePreference?: TimezonePreference; // Horário Local Oficial
}

export type ActiveTab = 'inicio' | 'escala' | 'ajustes' | 'perfil';

export type ShiftSwapStatus =
  | 'pendente_colega'
  | 'recusada_colega'
  | 'pendente_admin'
  | 'aprovada'
  | 'recusada_admin'
  | 'cancelada';

export interface ShiftSwapRequest {
  id: string;
  weekId: string;
  requesterId: string;
  requesterName: string;
  requesterTeam: string;
  targetId: string;
  targetName: string;
  targetTeam: string;
  requesterDayIndex: number;
  requesterDayDate: string;
  requesterOriginalShift: ShiftStatus;
  requesterOriginalHours?: string;
  targetDayIndex: number;
  targetDayDate: string;
  targetOriginalShift: ShiftStatus;
  targetOriginalHours?: string;
  reason?: string;
  rejectionReason?: string;
  status: ShiftSwapStatus;
  createdAt: string;
  colleagueRespondedAt?: string;
  adminDecidedAt?: string;
  adminId?: string;
}

export type NotificationType =
  | 'swap_requested'
  | 'swap_accepted'
  | 'swap_rejected'
  | 'swap_admin_review'
  | 'swap_approved'
  | 'swap_admin_rejected'
  | 'schedule_published';

export interface AppNotification {
  id: string;
  recipientId: string; // ID do colaborador específico ou 'admin'
  recipientRole?: 'admin' | 'colaborador' | 'all';
  type: NotificationType;
  title: string;
  message: string;
  relatedSwapId?: string;
  relatedWeekId?: string;
  read: boolean;
  createdAt: string;
}
