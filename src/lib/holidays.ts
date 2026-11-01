/**
 * Módulo de Feriados Nacionais Oficiais do Brasil
 * Contempla feriados nacionais fixos e móveis calculados por algoritmo oficial de Páscoa (Computus).
 * Inclui o novo feriado nacional do Dia da Consciência Negra (Lei nº 14.759/2023).
 */

// Cálculo do Domingo de Páscoa (Algoritmo de Meeus/Jones/Butcher)
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

// Retorna dicionário 'YYYY-MM-DD' -> Nome do Feriado para um ano específico
export function getBrazilianHolidays(year: number): Record<string, string> {
  const holidays: Record<string, string> = {};

  const pad = (n: number) => String(n).padStart(2, '0');
  const makeDateKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

  // 1. Feriados Nacionais Fixos no Brasil
  holidays[makeDateKey(year, 1, 1)] = 'Confraternização Universal';
  holidays[makeDateKey(year, 4, 21)] = 'Tiradentes';
  holidays[makeDateKey(year, 5, 1)] = 'Dia do Trabalho';
  holidays[makeDateKey(year, 9, 7)] = 'Independência do Brasil';
  holidays[makeDateKey(year, 10, 12)] = 'Nossa Senhora Aparecida';
  holidays[makeDateKey(year, 11, 2)] = 'Finados';
  holidays[makeDateKey(year, 11, 15)] = 'Proclamação da República';
  holidays[makeDateKey(year, 11, 20)] = 'Dia da Consciência Negra'; // Lei nº 14.759/2023
  holidays[makeDateKey(year, 12, 25)] = 'Natal';

  // 2. Feriados Móveis baseados na Páscoa
  const easter = getEasterDate(year);

  // Carnaval (Terça-feira): 47 dias antes da Páscoa
  const carnaval = new Date(easter);
  carnaval.setDate(easter.getDate() - 47);
  holidays[makeDateKey(year, carnaval.getMonth() + 1, carnaval.getDate())] = 'Carnaval';

  // Sexta-feira Santa (Paixão de Cristo): 2 dias antes da Páscoa
  const sextaSanta = new Date(easter);
  sextaSanta.setDate(easter.getDate() - 2);
  holidays[makeDateKey(year, sextaSanta.getMonth() + 1, sextaSanta.getDate())] = 'Sexta-feira Santa';

  // Páscoa (Domingo)
  holidays[makeDateKey(year, easter.getMonth() + 1, easter.getDate())] = 'Páscoa';

  // Corpus Christi (Quinta-feira): 60 dias após a Páscoa
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays[makeDateKey(year, corpusChristi.getMonth() + 1, corpusChristi.getDate())] = 'Corpus Christi';

  return holidays;
}

// Cache em memória para evitar recálculo frequente
const holidayCache: Record<number, Record<string, string>> = {};

/**
 * Consulta se uma data (YYYY-MM-DD) é feriado nacional brasileiro.
 */
export function getHolidayInfo(fullDate: string): { isHoliday: boolean; holidayName?: string } {
  if (!fullDate || !fullDate.includes('-')) {
    return { isHoliday: false };
  }

  const parts = fullDate.split('-');
  const year = parseInt(parts[0], 10);
  if (isNaN(year)) {
    return { isHoliday: false };
  }

  if (!holidayCache[year]) {
    holidayCache[year] = getBrazilianHolidays(year);
  }

  const name = holidayCache[year][fullDate];
  if (name) {
    return { isHoliday: true, holidayName: name };
  }

  return { isHoliday: false };
}
