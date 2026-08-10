import {
  addMinutes,
  localDateTimeToUtc,
  localDayOfWeek,
  overlaps,
  utcToLocal,
} from './timezone.util';

describe('timezone utilities', () => {
  it('converte horário local da empresa para UTC e de volta', () => {
    const utc = localDateTimeToUtc('2026-08-10', '08:00', 'America/Sao_Paulo');
    expect(utc.toISOString()).toBe('2026-08-10T11:00:00.000Z');
    expect(utcToLocal(utc, 'America/Sao_Paulo')).toBe('2026-08-10T08:00');
  });

  it('calcula o dia da semana sem depender do fuso do servidor', () => {
    expect(localDayOfWeek('2026-08-10')).toBe(1);
  });

  it('considera intervalos adjacentes como não sobrepostos', () => {
    const start = new Date('2026-08-10T10:00:00Z');
    const end = addMinutes(start, 60);
    expect(overlaps(start, end, end, addMinutes(end, 60))).toBe(false);
    expect(
      overlaps(start, end, addMinutes(start, 30), addMinutes(end, 30)),
    ).toBe(true);
  });
});
