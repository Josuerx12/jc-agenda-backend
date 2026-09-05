import { CnpjValidatorConstraint, normalizeCnpj } from './cnpj.validator';

describe('CnpjValidatorConstraint', () => {
  const validator = new CnpjValidatorConstraint();

  it.each([
    '12.ABC.345/01DE-35',
    '12ABC34501DE35',
    '04.740.714/0001-97',
    '04740714000197',
    'ABCDEFGHIJKL80',
  ])('aceita o CNPJ válido %s', (cnpj) => {
    expect(validator.validate(cnpj)).toBe(true);
  });

  it.each([
    '',
    '00000000000000',
    '12.ABC.345/01DE-34',
    '12.ABC.345/01DE-3A',
    '12.ABC.345/01DE-355',
    12345678000195,
    null,
  ])('rejeita o CNPJ inválido %s', (cnpj) => {
    expect(validator.validate(cnpj)).toBe(false);
  });

  it('remove pontuação e espaços e converte letras para maiúsculas', () => {
    expect(normalizeCnpj(' 12.abc.345/01de-35 ')).toBe('12ABC34501DE35');
  });
});
