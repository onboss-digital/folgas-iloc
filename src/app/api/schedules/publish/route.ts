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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schedule, adminEmail } = body as { schedule: WeekSchedule; adminEmail?: string };

    if (!schedule || !schedule.weekId || !schedule.startDate || !schedule.endDate) {
      return NextResponse.json({ error: 'Dados incompletos para publicação da escala.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    // 1. Gera token amigável de compartilhamento se não existir
    const generatedToken =
      schedule.shareToken ||
      `escala-semana-${schedule.weekNumber}-${Date.now().toString(36)}`;

    const nowIso = new Date().toISOString();

    // 2. Empacota work_models com segurança dentro de custom_hours.__work_models
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
      is_published: true, // STATUS OFICIAL PUBLICADA
      is_public_share_enabled: true,
      published_at: nowIso,
      share_token: generatedToken,
      shifts: schedule.shifts || {},
      custom_hours: customHoursPayload,
      updated_at: nowIso,
    };

    // 3. Executa upsert definitivo no banco de dados com chave de serviço
    const { error: upsertErr } = await supabase
      .from('schedules')
      .upsert(payload, { onConflict: 'week_id' });

    if (upsertErr) {
      console.error('Erro na publicação da escala no Supabase:', upsertErr);
      return NextResponse.json({ error: `Erro no banco de dados: ${upsertErr.message}` }, { status: 500 });
    }

    // 4. Verificação estrita de persistência (re-query obrigatório)
    const { data: verified, error: verifyErr } = await supabase
      .from('schedules')
      .select('*')
      .eq('week_id', schedule.weekId)
      .single();

    if (verifyErr || !verified || !verified.is_published) {
      console.error('Falha na auditoria de persistência da escala publicada:', verifyErr);
      return NextResponse.json(
        { error: 'A escala foi enviada, mas o banco de dados não confirmou o status de publicada.' },
        { status: 500 }
      );
    }

    const normalizedPublished = normalizeScheduleFromDb(verified);

    // 5. Notificação automática para a equipe
    try {
      await supabase.from('notifications').insert({
        id: `notif_pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipient_id: 'all',
        recipient_role: 'all',
        type: 'escala_publicada',
        title: 'Escala Oficial Publicada',
        message: `A escala da Semana ${schedule.weekNumber} (${schedule.startDate} a ${schedule.endDate}) foi oficialmente homologada e publicada.`,
        related_week_id: schedule.weekId,
        read: false,
        created_at: nowIso,
      });
    } catch (notifErr) {
      console.warn('Aviso ao registrar notificação de publicação:', notifErr);
    }

    return NextResponse.json({
      success: true,
      schedule: normalizedPublished,
      message: 'Escala publicada, persistida e homologada com sucesso no banco de dados.',
    });
  } catch (err: any) {
    console.error('Exceção em /api/schedules/publish:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao publicar escala.' }, { status: 500 });
  }
}
