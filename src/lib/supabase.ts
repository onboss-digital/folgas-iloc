import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Employee, AuthUser, WeekSchedule, CompanySettings } from '../types';
import { ADMIN_EMAIL, INITIAL_EMPLOYEES } from './scheduleEngine';

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

  // Atalho garantido para o colaborador teste Thiago
  if (cleanEmail === 'thiago@ilocmobile.com.br') {
    const thiagoFromInit = INITIAL_EMPLOYEES.find(e => e.id === 'thiago');
    return {
      user: {
        id: 'thiago',
        name: thiagoFromInit?.name || 'Thiago Oliveira',
        email: 'thiago@ilocmobile.com.br',
        role: 'colaborador',
        avatarUrl: thiagoFromInit?.avatarUrl || '',
      },
      error: null,
    };
  }

  // Verifica se o colaborador existe na lista
  let existingEmployees: Employee[] = INITIAL_EMPLOYEES;
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
  currentAdminEmail,
}: {
  name: string;
  email: string;
  password: string;
  team?: string;
  role?: string;
  workHours?: string;
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
      .eq('share_token', token)
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
    console.warn('Exceção ao buscar escala pública via Supabase:', err);
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
