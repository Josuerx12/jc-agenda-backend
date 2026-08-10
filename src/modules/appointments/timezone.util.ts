import { BadRequestException } from '@nestjs/common';

const formatter = (timezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

function parts(date: Date, timezone: string) {
  return Object.fromEntries(
    formatter(timezone)
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
}

export function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new BadRequestException('Data ou horário inválido');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let result = new Date(naive);
  for (let i = 0; i < 2; i++) {
    const p = parts(result, timezone);
    const represented = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    result = new Date(result.getTime() + naive - represented);
  }
  return result;
}

export function utcToLocal(date: Date, timezone: string) {
  const p = parts(date, timezone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function localDayOfWeek(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}
export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}
