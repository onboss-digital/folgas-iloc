import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WeekSchedule } from '@/types';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeScheduleFromDb(row: any): WeekSchedule {
  const rawCustom = row.custom_hours || {};
  let workModels = row.work_models || {};

  // Extrai __work_models se estiver embutido no custom_hours
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekId = searchParams.get('weekId');
    const role = searchParams.get('role'); // 'admin' ou 'colaborador'

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    let query = supabase.from('schedules').select('*');

    if (weekId) {
      query = query.eq('week_id', weekId);
    }

    // Colaboradores consultam prioritariamente escalas homologadas e publicadas
    if (role === 'colaborador') {
      query = query.eq('is_published', true);
    }

    query = query.order('start_date', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao consultar schedules na API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const schedules: WeekSchedule[] = (data || []).map(normalizeScheduleFromDb);

    // Identifica a escala mais recente publicada em todo o banco
    const latestPublished = schedules.find(s => s.isPublished) || null;

    if (weekId && schedules.length > 0) {
      return NextResponse.json({
        schedule: schedules[0],
        latestPublishedSchedule: latestPublished,
        success: true,
      });
    }

    return NextResponse.json({
      schedules,
      latestPublishedSchedule: latestPublished,
      success: true,
    });
  } catch (err: any) {
    console.error('Exceção em GET /api/schedules:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const schedule: WeekSchedule = body;

    if (!schedule || !schedule.weekId || !schedule.startDate || !schedule.endDate) {
      return NextResponse.json({ error: 'Dados incompletos da escala.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    // Empacota work_models dentro de custom_hours.__work_models para compatibilidade com schema
    const customHoursPayload = {
      ...(schedule.customHours || {}),
      ...(schedule.workModels && Object.keys(schedule.workModels).length > 0
        ? { __work_models: schedule.workModels }
        : {}),
    };

    const payload: any = {
      week_id: schedule.weekId,
      week_number: schedule.weekNumber,
      year: schedule.year,
      start_date: schedule.startDate,
      end_date: schedule.endDate,
      is_published: Boolean(schedule.isPublished),
      is_public_share_enabled: Boolean(schedule.isPublicShareEnabled),
      published_at: schedule.publishedAt || (schedule.isPublished ? new Date().toISOString() : null),
      share_token: schedule.shareToken || null,
      shifts: schedule.shifts || {},
      custom_hours: customHoursPayload,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('schedules')
      .upsert(payload, { onConflict: 'week_id' });

    if (upsertError) {
      console.error('Erro ao salvar escala no Supabase:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Reconsulta imediatamente para garantir persistência real
    const { data: verified, error: verifyErr } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_id', schedule.weekId)
      .single();

    if (verifyErr || !verified) {
      return NextResponse.json({ error: 'Falha ao verificar persistência da escala.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      schedule: normalizeScheduleFromDb(verified),
    });
  } catch (err: any) {
    console.error('Exceção em POST /api/schedules:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao salvar escala.' }, { status: 500 });
  }
}
