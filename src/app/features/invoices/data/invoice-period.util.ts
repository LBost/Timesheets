export function formatInvoicePeriodLabel(periodStart: string, periodEnd: string): string {
  const start = parseIsoDate(periodStart);
  const end = parseIsoDate(periodEnd);
  if (!start || !end) {
    return fallbackLabel(periodStart, periodEnd);
  }

  if (isYearPeriod(start, end)) {
    return String(start.getFullYear());
  }

  if (isMonthPeriod(start, end)) {
    const monthName = start.toLocaleString('en-US', { month: 'long' });
    return `${monthName} ${start.getFullYear()}`;
  }

  if (isWeekPeriod(start, end)) {
    const { year, week } = getIsoWeek(start);
    return `WK${String(week).padStart(2, '0')} ${year}`;
  }

  return fallbackLabel(periodStart, periodEnd);
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function isYearPeriod(start: Date, end: Date): boolean {
  return (
    start.getMonth() === 0 &&
    start.getDate() === 1 &&
    end.getMonth() === 0 &&
    end.getDate() === 1 &&
    end.getFullYear() === start.getFullYear() + 1
  );
}

function isMonthPeriod(start: Date, end: Date): boolean {
  if (start.getDate() !== 1 || end.getDate() !== 1) {
    return false;
  }
  return monthDiff(start, end) === 1;
}

function isWeekPeriod(start: Date, end: Date): boolean {
  const dayMs = 86_400_000;
  const span = Math.round((end.getTime() - start.getTime()) / dayMs);
  return span === 7;
}

function monthDiff(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: utc.getUTCFullYear(), week };
}

function fallbackLabel(periodStart: string, periodEnd: string): string {
  return `${periodStart} - ${periodEnd}`;
}
