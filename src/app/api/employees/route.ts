import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Employee } from '@/types';

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

function normalizeEmployeeFromDb(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || 'Colaborador',
    team: row.team || 'Operações de Loja',
    workHours: row.work_hours || '08:00 às 17:00',
    status: row.status || 'active',
    avatarUrl: row.avatar_url || '',
    initials: row.initials || (row.name ? row.name.slice(0, 2).toUpperCase() : 'CO'),
    colorBg: row.color_bg || 'bg-blue-600',
    admissionDate: row.admission_date || '',
    preferredDaysOff: row.preferred_days_off || [5, 6],
    workModel: row.work_model || 'presencial',
    notes: row.notes || '',
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao consultar employees na API:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const employees: Employee[] = (data || []).map(normalizeEmployeeFromDb);
    return NextResponse.json({ success: true, employees });
  } catch (err: any) {
    console.error('Exceção em GET /api/employees:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employee, password } = body as { employee: Employee; password?: string };

    if (!employee || !employee.name || !employee.email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    const cleanEmail = employee.email.trim().toLowerCase();
    const cleanName = employee.name.trim();
    let empId = employee.id || `emp_${Date.now()}`;

    // 1. Se fornecida senha, cria ou atualiza usuário no Supabase Auth via Service Role (sem deslogar o admin)
    if (password && password.length >= 6) {
      try {
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            name: cleanName,
            role: 'colaborador',
            team: employee.team || 'Operações de Loja',
          },
        });

        if (!authErr && authUser?.user?.id) {
          empId = authUser.user.id;
        } else if (authErr && !authErr.message.toLowerCase().includes('already')) {
          console.warn('Aviso ao criar usuário de auth via admin:', authErr.message);
        }
      } catch (authExc) {
        console.warn('Exceção ao criar usuário auth no Supabase:', authExc);
      }
    }

    // 2. Monta payload estritamente compatível com as colunas da tabela employees
    const payload: any = {
      id: empId,
      name: cleanName,
      email: cleanEmail,
      role: employee.role || 'Colaborador',
      team: employee.team || 'Operações de Loja',
      work_hours: employee.workHours || '08:00 às 17:00',
      status: employee.status || 'active',
    };

    const { data: upsertData, error: dbErr } = await supabase
      .from('employees')
      .upsert(payload, { onConflict: 'email' })
      .select()
      .single();

    if (dbErr) {
      console.error('Erro ao salvar colaborador no Supabase:', dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    const normalized = normalizeEmployeeFromDb(upsertData);
    return NextResponse.json({ success: true, employee: normalized });
  } catch (err: any) {
    console.error('Exceção em POST /api/employees:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao salvar colaborador.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do colaborador não informado.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 500 });
    }

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar colaborador no Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Exceção em DELETE /api/employees:', err);
    return NextResponse.json({ error: err.message || 'Erro interno ao excluir colaborador.' }, { status: 500 });
  }
}
