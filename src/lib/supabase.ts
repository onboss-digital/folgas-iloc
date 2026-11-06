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
export async function saveEmployeeToSupabase(
  employee: Employee,
  password?: string
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  // 1. Tenta salvar via API do servidor (Service Role)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee, password }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.employee) {
          return { success: true, employee: json.employee };
        }
        return { success: false, error: json.error || 'Erro na API de colaboradores.' };
      }
    } catch (apiErr: any) {
      console.warn('Aviso ao salvar via /api/employees, tentando fallback direto:', apiErr);
    }
  }

  // 2. Fallback direto ao Supabase (somente colunas existentes na tabela)
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true, employee };
  }

  try {
    const payload: any = {
      id: employee.id,
      name: employee.name,
      email: (employee.email || '').trim().toLowerCase(),
      role: employee.role || 'Colaborador',
      team: employee.team || 'Operações de Loja',
      work_hours: employee.workHours || '08:00 às 17:00',
      status: employee.status || 'active',
    };

    const { data, error } = await supabase
      .from('employees')
      .upsert(payload, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Erro ao salvar colaborador no Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      employee: data ? { ...employee, id: data.id } : employee,
    };
  } catch (err: any) {
    console.warn('Exceção ao persistir colaborador no Supabase:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteEmployeeFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return { success: true };
      }
    } catch (apiErr) {
      console.warn('Aviso ao deletar via /api/employees:', apiErr);
    }
  }

  if (!isSupabaseConfigured() || !supabase) return { success: true };

  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

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

  const saveRes = await saveEmployeeToSupabase(newEmployee, password);
  if (!saveRes.success) {
    return { employee: null, error: saveRes.error || 'Erro ao salvar colaborador no banco de dados.' };
  }

  return { employee: saveRes.employee || newEmployee, error: null };
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
  // 1. Tenta via API interna do servidor com Service Role
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.employees)) {
          return json.employees;
        }
      }
    } catch (apiErr) {
      console.warn('Aviso ao buscar /api/employees:', apiErr);
    }
  }

  // 2. Fallback direto ao Supabase
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
 * Normaliza linha bruta do banco Supabase para objeto WeekSchedule
 */
export function normalizeScheduleRow(row: any): WeekSchedule {
  const rawCustom = row.custom_hours || {};
  let workModels = row.work_models || {};

  const sanitizedCustom: Record<string, (string | undefined)[]> = {};
  for (const key of Object.keys(rawCustom)) {
    if (key === '__work_models') {
      if (!workModels || Object.keys(workModels).length === 0) {
        workModels = rawCustom.__work_models;
      }
    } else {
      sanitizedCustom[key] = rawCustom[key];
    }
  }

  return {
    weekId: row.week_id,
    weekNumber: row.week_number,
    year: row.year,
    startDate: row.start_date,
    endDate: row.end_date,
    isPublished: Boolean(row.is_published),
    isPublicShareEnabled: Boolean(row.is_public_share_enabled),
    publishedAt: row.published_at || undefined,
    shareToken: row.share_token || undefined,
    shifts: row.shifts || {},
    customHours: sanitizedCustom,
    workModels: workModels || {},
  };
}

/**
 * Buscar todas as escalas semanais cadastradas no Supabase
 */
export async function fetchAllSchedulesFromSupabase(role: string = 'admin'): Promise<WeekSchedule[]> {
  // 1. Tenta via API interna do servidor
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/schedules?role=${encodeURIComponent(role)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.schedules && Array.isArray(json.schedules)) {
          return json.schedules;
        }
      }
    } catch (apiErr) {
      console.warn('Aviso ao consultar /api/schedules:', apiErr);
    }
  }

  // 2. Fallback direto ao cliente Supabase
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    let query = supabase.from('schedules').select('*');
    if (role === 'colaborador') {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query.order('start_date', { ascending: false });

    if (error || !data) {
      console.warn('Aviso ao consultar todas as escalas no Supabase:', error?.message);
      return [];
    }

    return data.map(normalizeScheduleRow);
  } catch (err) {
    console.warn('Exceção ao consultar todas as escalas do Supabase:', err);
    return [];
  }
}

/**
 * Buscar escala semanal específica do Supabase
 */
export async function fetchScheduleFromSupabase(weekId: string): Promise<WeekSchedule | null> {
  // 1. Tenta via API interna do servidor
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/schedules?weekId=${encodeURIComponent(weekId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.schedule) {
          return json.schedule;
        }
      }
    } catch (apiErr) {
      console.warn('Aviso ao buscar escala via API:', apiErr);
    }
  }

  // 2. Fallback direto ao cliente Supabase
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_id', weekId)
      .maybeSingle();

    if (error || !data) return null;

    return normalizeScheduleRow(data);
  } catch (err) {
    console.warn('Exceção ao carregar escala do Supabase:', err);
    return null;
  }
}

/**
 * Salvar ou atualizar escala semanal no Supabase
 */
export async function saveScheduleToSupabase(schedule: WeekSchedule): Promise<{ success: boolean; error?: string }> {
  // 1. Tenta persistência via API interna do servidor com confirmação
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { success: true };
        }
        return { success: false, error: json.error || 'Erro desconhecido na API.' };
      }
    } catch (apiErr: any) {
      console.warn('Aviso ao salvar via /api/schedules, tentando fallback direto:', apiErr);
    }
  }

  // 2. Fallback direto ao cliente Supabase (empacotando __work_models com segurança)
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase não configurado.' };

  try {
    const customHoursPayload = {
      ...(schedule.customHours || {}),
      ...(schedule.workModels && Object.keys(schedule.workModels).length > 0
        ? { __work_models: schedule.workModels }
        : {}),
    };

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
      custom_hours: customHoursPayload,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Erro ao salvar escala no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Exceção ao persistir escala no Supabase:', err);
    return { success: false, error: err.message || 'Falha de conexão.' };
  }
}

/**
 * Publicar oficialmente uma escala com validação, persistência e auditoria de confirmação
 */
export async function publishScheduleViaApi(
  schedule: WeekSchedule,
  adminEmail?: string
): Promise<{ success: boolean; schedule?: WeekSchedule; error?: string }> {
  // 1. Tenta via endpoint oficial de publicação
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/schedules/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, adminEmail }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.schedule) {
        return { success: true, schedule: json.schedule };
      }
      return { success: false, error: json.error || 'Falha ao confirmar publicação no servidor.' };
    } catch (apiErr: any) {
      console.warn('Erro em /api/schedules/publish, tentando fallback:', apiErr);
    }
  }

  // 2. Fallback direto ao Supabase com is_published = true
  const nowIso = new Date().toISOString();
  const generatedToken = schedule.shareToken || `escala-semana-${schedule.weekNumber}-${Date.now().toString(36)}`;
  const publishedSchedule: WeekSchedule = {
    ...schedule,
    isPublished: true,
    isPublicShareEnabled: true,
    shareToken: generatedToken,
    publishedAt: nowIso,
  };

  const saveRes = await saveScheduleToSupabase(publishedSchedule);
  if (!saveRes.success) {
    return { success: false, error: saveRes.error || 'Erro ao persistir publicação no banco de dados.' };
  }

  return { success: true, schedule: publishedSchedule };
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

    const formattedSchedule: WeekSchedule = normalizeScheduleRow(schedData);

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
      .order('start_date', { ascending: false })
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

    const formattedSchedule: WeekSchedule = normalizeScheduleRow(schedData);

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
      timezonePreference: data.timezone_preference || 'local',
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
      timezone_preference: settings.timezonePreference || 'local',
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
