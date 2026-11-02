import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, AuthUser, WeekSchedule, CompanySettings, ShiftSwapRequest, AppNotification, WorkModel } from '../types';
import { ADMIN_EMAIL } from './scheduleEngine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('sua-url-aqui')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Autenticação de usuário (Admin ou Colaborador)
 */
export async function authenticateUser(
  email: string,
  password?: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  // Se Supabase estiver conectado na nuvem
  if (isSupabaseConfigured() && supabase && password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
        return {
          user: {
            id: data.user.id,
            email: cleanEmail,
            name: data.user.user_metadata?.name || (isAdmin ? 'Luiz Administrador' : 'Colaborador'),
            role: isAdmin ? 'admin' : 'colaborador',
          },
          error: null,
        };
      }
    } catch (err: any) {
      console.warn('Falha na autenticação via Supabase:', err);
    }
  }

  // Fallback e Modo Local determinístico
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    return {
      user: {
        id: 'admin_luiz',
        name: 'Luiz Administrador',
        email: ADMIN_EMAIL,
        role: 'admin',
      },
      error: null,
    };
  }

  // Verifica se o colaborador existe na lista salva
  let existingEmployees: Employee[] = [];
  try {
    const saved = localStorage.getItem('iloc_employees');
    if (saved) existingEmployees = JSON.parse(saved);
  } catch {}

  const match = existingEmployees.find(
    e => e.email?.toLowerCase() === cleanEmail
  );

  if (match) {
    return {
      user: {
        id: match.id,
        name: match.name,
        email: match.email || cleanEmail,
        role: 'colaborador',
        avatarUrl: match.avatarUrl || '',
      },
      error: null,
    };
  }

  return {
    user: null,
    error: 'Colaborador não encontrado. Verifique seu e-mail ou solicite o convite ao administrador.',
  };
}

/**
 * Cadastrar e convidar colaborador
 * Regra: Somente luizstaff@ilocmobile.com.br pode executar
 */
export async function inviteAndRegisterCollaborator({
  name,
  email,
  password,
  team = 'Operações de Loja',
  role = 'Colaborador',
  workHours = '08:00 às 17:00',
  workModel = 'presencial',
  currentAdminEmail,
}: {
  name: string;
  email: string;
  password: string;
  team?: string;
  role?: string;
  workHours?: string;
  workModel?: WorkModel;
  currentAdminEmail: string;
}): Promise<{ employee: Employee | null; error: string | null }> {
  const cleanAdmin = currentAdminEmail.trim().toLowerCase();
  if (cleanAdmin !== ADMIN_EMAIL.toLowerCase()) {
    return {
      employee: null,
      error: `Permissão negada. Somente o administrador ${ADMIN_EMAIL} pode cadastrar novos colaboradores.`,
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const newEmployee: Employee = {
    id: `emp_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role,
    team,
    workHours,
    workModel,
    status: 'active',
    initials: cleanName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    colorBg: 'bg-blue-600',
    admissionDate: new Date().toISOString().split('T')[0],
    preferredDaysOff: [5, 6],
  };

  // Se o Supabase estiver ativo
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Cria usuário de auth no Supabase
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            role: 'colaborador',
            team,
          },
        },
      });

      if (authErr) {
        return { employee: null, error: authErr.message };
      }

      if (authData.user) {
        newEmployee.id = authData.user.id;
      }

      // 2. Salva na tabela public.employees
      const { error: dbErr } = await supabase.from('employees').upsert({
        id: newEmployee.id,
        name: newEmployee.name,
        email: cleanEmail,
        role: newEmployee.role,
        team: newEmployee.team,
        work_hours: newEmployee.workHours,
        work_model: newEmployee.workModel || 'presencial',
        status: newEmployee.status,
      });

      if (dbErr) {
        console.warn('Erro ao salvar no banco Supabase:', dbErr.message);
      }
    } catch (err: any) {
      console.warn('Exceção ao persistir no Supabase:', err);
    }
  }

  return { employee: newEmployee, error: null };
}

/**
 * Atualizar perfil do próprio colaborador
 * Regras: Apenas o próprio usuário logado pode atualizar seus dados
 */
export async function updateUserProfile({
  userId,
  name,
  email,
  avatarUrl,
  newPassword,
}: {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  newPassword?: string;
}): Promise<{ error: string | null }> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    return { error: 'O nome não pode estar em branco.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { error: 'Informe um endereço de e-mail válido.' };
  }

  if (newPassword && newPassword.length < 6) {
    return { error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
  }

  // Se Supabase estiver conectado na nuvem
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Atualiza dados na tabela public.employees
      const { error: dbErr } = await supabase
        .from('employees')
        .update({
          name: cleanName,
          email: cleanEmail,
        })
        .eq('id', userId);

      if (dbErr) {
        console.warn('Erro ao atualizar tabela employees no Supabase:', dbErr.message);
      }

      // 2. Se houver nova senha ou novo e-mail, atualiza no Supabase Auth
      const updateData: { email?: string; password?: string; data?: any } = {
        data: { name: cleanName, avatar_url: avatarUrl },
      };
      if (cleanEmail) updateData.email = cleanEmail;
      if (newPassword) updateData.password = newPassword;

      const { error: authErr } = await supabase.auth.updateUser(updateData);
      if (authErr) {
        return { error: authErr.message };
      }
    } catch (err: any) {
      console.warn('Erro ao atualizar perfil no Supabase:', err);
      return { error: 'Falha ao sincronizar com o banco de dados remoto.' };
    }
  }

  return { error: null };
}

/**
 * Buscar todos os colaboradores cadastrados no Supabase
 */
export async function fetchEmployeesFromSupabase(): Promise<Employee[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('Aviso ao consultar employees no Supabase:', error?.message);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || 'Colaborador',
      team: row.team || 'Operações de Loja',
      workHours: row.work_hours || '08:00 às 17:00',
      status: row.status || 'active',
      avatarUrl: row.avatar_url || '',
      initials: row.initials || row.name.slice(0, 2).toUpperCase(),
      colorBg: row.color_bg || 'bg-blue-600',
      admissionDate: row.admission_date || '',
      preferredDaysOff: row.preferred_days_off || [5, 6],
      workModel: row.work_model || 'presencial',
      notes: row.notes || '',
    }));
  } catch (err) {
    console.warn('Exceção ao carregar colaboradores do Supabase:', err);
    return null;
  }
}

/**
 * Buscar escala semanal específica do Supabase
 */
export async function fetchScheduleFromSupabase(weekId: string): Promise<WeekSchedule | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_id', weekId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      weekId: data.week_id,
      weekNumber: data.week_number,
      year: data.year,
      startDate: data.start_date,
      endDate: data.end_date,
      isPublished: data.is_published,
      isPublicShareEnabled: data.is_public_share_enabled,
      publishedAt: data.published_at,
      shareToken: data.share_token,
      shifts: data.shifts || {},
      customHours: data.custom_hours || {},
      workModels: data.work_models || {},
    };
  } catch (err) {
    console.warn('Exceção ao carregar escala do Supabase:', err);
    return null;
  }
}

/**
 * Salvar ou atualizar escala semanal no Supabase
 */
export async function saveScheduleToSupabase(schedule: WeekSchedule): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase.from('schedules').upsert({
      week_id: schedule.weekId,
      week_number: schedule.weekNumber,
      year: schedule.year,
      start_date: schedule.startDate,
      end_date: schedule.endDate,
      is_published: schedule.isPublished,
      is_public_share_enabled: schedule.isPublicShareEnabled,
      published_at: schedule.publishedAt || (schedule.isPublished ? new Date().toISOString() : null),
      share_token: schedule.shareToken || null,
      shifts: schedule.shifts,
      custom_hours: schedule.customHours || {},
      work_models: schedule.workModels || {},
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Erro ao salvar escala no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao persistir escala no Supabase:', err);
    return false;
  }
}

/**
 * Buscar escala pública oficial por token de compartilhamento
 */
export async function fetchPublicScheduleByToken(token: string): Promise<{
  schedule: WeekSchedule | null;
  employees: Employee[] | null;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { schedule: null, employees: null };
  }

  try {
    const { data: schedData, error: schedErr } = await supabase
      .from('schedules')
      .select('*')
      .or(`share_token.eq.${token},week_id.eq.${token}`)
      .eq('is_published', true)
      .eq('is_public_share_enabled', true)
      .maybeSingle();

    if (schedErr || !schedData) {
      return { schedule: null, employees: null };
    }

    const { data: empsData } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    const formattedEmps: Employee[] = (empsData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || 'Colaborador',
      team: row.team || 'Operações de Loja',
      workHours: row.work_hours || '08:00 às 17:00',
      status: row.status || 'active',
      avatarUrl: row.avatar_url || '',
      initials: row.initials || row.name.slice(0, 2).toUpperCase(),
      colorBg: row.color_bg || 'bg-blue-600',
      admissionDate: row.admission_date || '',
      preferredDaysOff: row.preferred_days_off || [5, 6],
    }));

    const formattedSchedule: WeekSchedule = {
      weekId: schedData.week_id,
      weekNumber: schedData.week_number,
      year: schedData.year,
      startDate: schedData.start_date,
      endDate: schedData.end_date,
      isPublished: schedData.is_published,
      isPublicShareEnabled: schedData.is_public_share_enabled,
      publishedAt: schedData.published_at,
      shareToken: schedData.share_token,
      shifts: schedData.shifts || {},
      customHours: schedData.custom_hours || {},
      workModels: schedData.work_models || {},
    };

    return { schedule: formattedSchedule, employees: formattedEmps };
  } catch (err) {
    console.warn('Exceção ao buscar escala pública via Supabase:', err);
    return { schedule: null, employees: null };
  }
}

/**
 * Buscar a última escala semanal publicada e ativa no Supabase (para acesso direto sem token)
 */
export async function fetchLatestPublishedScheduleFromSupabase(): Promise<{
  schedule: WeekSchedule | null;
  employees: Employee[] | null;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { schedule: null, employees: null };
  }

  try {
    const { data: schedData, error: schedErr } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_published', true)
      .eq('is_public_share_enabled', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (schedErr || !schedData) {
      return { schedule: null, employees: null };
    }

    const { data: empsData } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    const formattedEmps: Employee[] = (empsData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || 'Colaborador',
      team: row.team || 'Operações de Loja',
      workHours: row.work_hours || '08:00 às 17:00',
      status: row.status || 'active',
      avatarUrl: row.avatar_url || '',
      initials: row.initials || row.name.slice(0, 2).toUpperCase(),
      colorBg: row.color_bg || 'bg-blue-600',
      admissionDate: row.admission_date || '',
      preferredDaysOff: row.preferred_days_off || [5, 6],
    }));

    const formattedSchedule: WeekSchedule = {
      weekId: schedData.week_id,
      weekNumber: schedData.week_number,
      year: schedData.year,
      startDate: schedData.start_date,
      endDate: schedData.end_date,
      isPublished: schedData.is_published,
      isPublicShareEnabled: schedData.is_public_share_enabled,
      publishedAt: schedData.published_at,
      shareToken: schedData.share_token,
      shifts: schedData.shifts || {},
      customHours: schedData.custom_hours || {},
    };

    return { schedule: formattedSchedule, employees: formattedEmps };
  } catch (err) {
    console.warn('Exceção ao buscar última escala pública no Supabase:', err);
    return { schedule: null, employees: null };
  }
}


/**
 * Buscar configurações da empresa do Supabase
 */
export async function fetchSettingsFromSupabase(): Promise<CompanySettings | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 'default_settings')
      .maybeSingle();

    if (error || !data) return null;

    return {
      regime: data.regime,
      operatingDays: data.operating_days,
      minStaffPerDay: data.min_staff_per_day,
      weeklyRestDays: data.weekly_rest_days,
      rotateShifts: data.rotate_shifts,
      rotateSundays: data.rotate_sundays,
      operatesOnHolidays: data.operates_on_holidays,
      startDay: data.start_day,
      timezonePreference: data.timezone_preference || 'brasilia',
    };
  } catch (err) {
    console.warn('Exceção ao carregar configurações do Supabase:', err);
    return null;
  }
}

/**
 * Salvar configurações da empresa no Supabase
 */
export async function saveSettingsToSupabase(settings: CompanySettings): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase.from('company_settings').upsert({
      id: 'default_settings',
      regime: settings.regime,
      operating_days: settings.operatingDays,
      min_staff_per_day: settings.minStaffPerDay,
      weekly_rest_days: settings.weeklyRestDays,
      rotate_shifts: settings.rotateShifts,
      rotate_sundays: settings.rotateSundays,
      operates_on_holidays: settings.operatesOnHolidays ?? true,
      start_day: settings.startDay,
      timezone_preference: settings.timezonePreference || 'brasilia',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Erro ao salvar settings no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao persistir settings no Supabase:', err);
    return false;
  }
}


/**
 * Consultar solicitações de troca de escala no Supabase
 */
export async function fetchShiftSwapsFromSupabase(weekId?: string): Promise<ShiftSwapRequest[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    let query = supabase
      .from('shift_swaps')
      .select('*')
      .order('created_at', { ascending: false });

    if (weekId) {
      query = query.eq('week_id', weekId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Aviso ao consultar shift_swaps no Supabase:', error?.message);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      weekId: row.week_id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      requesterTeam: row.requester_team,
      targetId: row.target_id,
      targetName: row.target_name,
      targetTeam: row.target_team,
      requesterDayIndex: row.requester_day_index,
      requesterDayDate: row.requester_day_date,
      requesterOriginalShift: row.requester_original_shift,
      requesterOriginalHours: row.requester_original_hours || undefined,
      targetDayIndex: row.target_day_index,
      targetDayDate: row.target_day_date,
      targetOriginalShift: row.target_original_shift,
      targetOriginalHours: row.target_original_hours || undefined,
      reason: row.reason || undefined,
      rejectionReason: row.rejection_reason || undefined,
      status: row.status,
      createdAt: row.created_at,
      colleagueRespondedAt: row.colleague_responded_at || undefined,
      adminDecidedAt: row.admin_decided_at || undefined,
      adminId: row.admin_id || undefined,
    }));
  } catch (err) {
    console.warn('Exceção ao consultar shift_swaps:', err);
    return [];
  }
}

/**
 * Salvar ou atualizar solicitação de troca de escala no Supabase
 */
export async function saveShiftSwapToSupabase(swap: ShiftSwapRequest): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) return { error: null };

  try {
    const { error } = await supabase.from('shift_swaps').upsert({
      id: swap.id,
      week_id: swap.weekId,
      requester_id: swap.requesterId,
      requester_name: swap.requesterName,
      requester_team: swap.requesterTeam,
      target_id: swap.targetId,
      target_name: swap.targetName,
      target_team: swap.targetTeam,
      requester_day_index: swap.requesterDayIndex,
      requester_day_date: swap.requesterDayDate,
      requester_original_shift: swap.requesterOriginalShift,
      requester_original_hours: swap.requesterOriginalHours || null,
      target_day_index: swap.targetDayIndex,
      target_day_date: swap.targetDayDate,
      target_original_shift: swap.targetOriginalShift,
      target_original_hours: swap.targetOriginalHours || null,
      reason: swap.reason || null,
      rejection_reason: swap.rejectionReason || null,
      status: swap.status,
      created_at: swap.createdAt,
      colleague_responded_at: swap.colleagueRespondedAt || null,
      admin_decided_at: swap.adminDecidedAt || null,
      admin_id: swap.adminId || null,
    });

    if (error) {
      console.warn('Erro ao salvar shift_swap no Supabase:', error.message);
      return { error: error.message };
    }

    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Falha ao salvar no banco de dados.' };
  }
}

/**
 * Buscar escala pública oficial pela identificação da semana (week_id)
 */
export async function fetchPublicScheduleByWeekId(weekId: string): Promise<{
  schedule: WeekSchedule | null;
  employees: Employee[] | null;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return { schedule: null, employees: null };
  }

  try {
    const { data: schedData, error: schedErr } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_id', weekId)
      .eq('is_published', true)
      .eq('is_public_share_enabled', true)
      .maybeSingle();

    if (schedErr || !schedData) {
      return { schedule: null, employees: null };
    }

    const { data: empsData } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active');

    const formattedEmps: Employee[] = (empsData || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || 'Colaborador',
      team: row.team || 'Operações de Loja',
      workHours: row.work_hours || '08:00 às 17:00',
      status: row.status || 'active',
      avatarUrl: row.avatar_url || '',
      initials: row.initials || row.name.slice(0, 2).toUpperCase(),
      colorBg: row.color_bg || 'bg-blue-600',
      admissionDate: row.admission_date || '',
      preferredDaysOff: row.preferred_days_off || [5, 6],
    }));

    const formattedSchedule: WeekSchedule = {
      weekId: schedData.week_id,
      weekNumber: schedData.week_number,
      year: schedData.year,
      startDate: schedData.start_date,
      endDate: schedData.end_date,
      isPublished: schedData.is_published,
      isPublicShareEnabled: schedData.is_public_share_enabled,
      publishedAt: schedData.published_at,
      shareToken: schedData.share_token,
      shifts: schedData.shifts || {},
      customHours: schedData.custom_hours || {},
    };

    return { schedule: formattedSchedule, employees: formattedEmps };
  } catch (err) {
    console.warn('Exceção ao buscar escala pública por weekId no Supabase:', err);
    return { schedule: null, employees: null };
  }
}

/**
 * Consultar notificações direcionadas ao usuário logado ou à administração
 */
export async function fetchNotificationsFromSupabase(
  recipientId: string,
  isAdmin: boolean = false
): Promise<AppNotification[]> {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (isAdmin) {
      query = query.or(`recipient_id.eq.${recipientId},recipient_id.eq.admin,recipient_role.eq.admin,recipient_role.eq.all`);
    } else {
      query = query.or(`recipient_id.eq.${recipientId},recipient_role.eq.all`);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Aviso ao consultar notificações no Supabase:', error?.message);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      recipientId: row.recipient_id,
      recipientRole: row.recipient_role || 'colaborador',
      type: row.type,
      title: row.title,
      message: row.message,
      relatedSwapId: row.related_swap_id || undefined,
      relatedWeekId: row.related_week_id || undefined,
      read: Boolean(row.read),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Exceção ao consultar notificações:', err);
    return [];
  }
}

/**
 * Salvar ou disparar nova notificação no Supabase
 */
export async function saveNotificationToSupabase(
  notif: AppNotification
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured() || !supabase) return { error: null };

  try {
    const { error } = await supabase.from('notifications').upsert({
      id: notif.id,
      recipient_id: notif.recipientId,
      recipient_role: notif.recipientRole || 'colaborador',
      type: notif.type,
      title: notif.title,
      message: notif.message,
      related_swap_id: notif.relatedSwapId || null,
      related_week_id: notif.relatedWeekId || null,
      read: notif.read,
      created_at: notif.createdAt,
    });

    if (error) {
      console.warn('Erro ao salvar notificação no Supabase:', error.message);
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Falha ao salvar notificação.' };
  }
}

/**
 * Marcar notificação individual como lida
 */
export async function markNotificationAsReadInSupabase(notificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return true;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Marcar todas as notificações do usuário como lidas
 */
export async function markAllNotificationsAsReadInSupabase(
  recipientId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return true;

  try {
    let query = supabase.from('notifications').update({ read: true });
    if (isAdmin) {
      query = query.or(`recipient_id.eq.${recipientId},recipient_id.eq.admin,recipient_role.eq.admin`);
    } else {
      query = query.eq('recipient_id', recipientId);
    }
    const { error } = await query;
    return !error;
  } catch {
    return false;
  }
}
