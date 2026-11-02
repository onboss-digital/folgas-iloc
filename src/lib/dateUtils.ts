/**
 * Utilitários de Data e Hora com Suporte a Fuso Horário de Brasília (BRT) e Horário Local
 * Permite que o administrador defina a referência da empresa mantendo consistência entre os dispositivos.
 */

import { TimezonePreference } from '../types';

export const TIMEZONE_BRASILIA = 'America/Sao_Paulo';

export interface BrasiliaDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  fullFormatted: string; // DD/MM/YYYY às HH:mm
}

/**
 * Retorna o rótulo descritivo do fuso horário configurado
 */
export function getTimezoneLabel(preference: TimezonePreference = 'brasilia'): string {
  return preference === 'local' ? 'Horário Local da Equipe' : 'Horário de Brasília (BRT)';
}

/**
 * Retorna o selo/badge curto do fuso horário configurado
 */
export function getTimezoneBadge(preference: TimezonePreference = 'brasilia'): string {
  return preference === 'local' ? 'LOCAL' : 'BRT';
}

/**
 * Decompõe uma data no fuso de Brasília
 */
export function getBrasiliaDateParts(date: Date = new Date()): BrasiliaDateParts {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE_BRASILIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr: `${year}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`,
    fullFormatted: `${dd}/${mm}/${year} às ${hh}:${min}`,
  };
}

/**
 * Retorna a data atual (YYYY-MM-DD) respeitando a preferência de fuso horário
 */
export function getTodayStr(preference: TimezonePreference = 'brasilia'): string {
  if (preference === 'local') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return getBrasiliaDateParts().dateStr;
}

/**
 * Retorna a data de hoje no fuso horário de Brasília (YYYY-MM-DD) - alias retrocompatível
 */
export function getTodayStrBrasilia(): string {
  return getBrasiliaDateParts().dateStr;
}

/**
 * Retorna ISO timestamp respeitando a preferência de fuso horário
 */
export function getNowIso(preference: TimezonePreference = 'brasilia'): string {
  if (preference === 'local') {
    return new Date().toISOString();
  }
  return getNowIsoBrasilia();
}

/**
 * Retorna ISO timestamp com o offset de Brasília (-03:00)
 */
export function getNowIsoBrasilia(): string {
  const p = getBrasiliaDateParts();
  const ss = String(p.second).padStart(2, '0');
  return `${p.dateStr}T${p.timeStr}:${ss}-03:00`;
}

/**
 * Formata data e hora legível no fuso configurado
 */
export function formatDateTime(
  dateOrIso: string | Date | undefined,
  preference: TimezonePreference = 'brasilia'
): string {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return String(dateOrIso);

  if (preference === 'local') {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} às ${hh}:${min} (Local)`;
  }

  const p = getBrasiliaDateParts(d);
  return `${p.fullFormatted} (BRT)`;
}

/**
 * Formata data e hora legível no Horário de Brasília (BRT) - alias retrocompatível
 */
export function formatDateTimeBrasilia(dateOrIso: string | Date | undefined): string {
  return formatDateTime(dateOrIso, 'brasilia');
}

/**
 * Formata apenas a hora respeitando o fuso configurado
 */
export function formatTime(
  dateOrIso: string | Date | undefined,
  preference: TimezonePreference = 'brasilia'
): string {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  if (preference === 'local') {
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min} (Local)`;
  }

  const p = getBrasiliaDateParts(d);
  return `${p.timeStr} (BRT)`;
}

/**
 * Formata apenas a hora no Horário de Brasília (BRT) - alias retrocompatível
 */
export function formatTimeBrasilia(dateOrIso: string | Date | undefined): string {
  return formatTime(dateOrIso, 'brasilia');
}

/**
 * Formata data simples DD/MM a partir de string YYYY-MM-DD
 */
export function formatDateSimpleBrasilia(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}
