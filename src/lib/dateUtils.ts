/**
 * Utilitários de Data e Hora com Suporte a Horário Local Oficial
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
export function getTimezoneLabel(preference: TimezonePreference = 'local'): string {
  return 'Horário Local';
}

/**
 * Retorna o selo/badge curto do fuso horário configurado
 */
export function getTimezoneBadge(preference: TimezonePreference = 'local'): string {
  return 'LOCAL';
}

/**
 * Decompõe uma data no fuso local
 */
export function getBrasiliaDateParts(date: Date = new Date()): BrasiliaDateParts {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

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
 * Retorna a data atual (YYYY-MM-DD) em Horário Local
 */
export function getTodayStr(preference: TimezonePreference = 'local'): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retorna a data de hoje (YYYY-MM-DD)
 */
export function getTodayStrBrasilia(): string {
  return getTodayStr('local');
}

/**
 * Retorna ISO timestamp respeitando a preferência de fuso horário
 */
export function getNowIso(preference: TimezonePreference = 'local'): string {
  return new Date().toISOString();
}

/**
 * Retorna ISO timestamp
 */
export function getNowIsoBrasilia(): string {
  return new Date().toISOString();
}

/**
 * Formata data e hora legível em Horário Local
 */
export function formatDateTime(
  dateOrIso: string | Date | undefined,
  preference: TimezonePreference = 'local'
): string {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return String(dateOrIso);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} às ${hh}:${min}`;
}

/**
 * Formata data e hora legível
 */
export function formatDateTimeBrasilia(dateOrIso: string | Date | undefined): string {
  return formatDateTime(dateOrIso, 'local');
}

/**
 * Formata apenas a hora em Horário Local
 */
export function formatTime(
  dateOrIso: string | Date | undefined,
  preference: TimezonePreference = 'local'
): string {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';

  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Formata apenas a hora
 */
export function formatTimeBrasilia(dateOrIso: string | Date | undefined): string {
  return formatTime(dateOrIso, 'local');
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
