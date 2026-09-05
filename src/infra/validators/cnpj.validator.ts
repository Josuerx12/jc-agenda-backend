import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

const CNPJ_PATTERN = /^[A-Z0-9]{12}[0-9]{2}$/;
const CNPJ_WITHOUT_CHECK_DIGITS_LENGTH = 12;
const ZEROED_CNPJ = '00000000000000';
const CHECK_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const ZERO_CHAR_CODE = '0'.charCodeAt(0);

export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function calculateCheckDigits(cnpjWithoutCheckDigits: string): string {
  let firstCheckDigitSum = 0;
  let secondCheckDigitSum = 0;

  for (let index = 0; index < CNPJ_WITHOUT_CHECK_DIGITS_LENGTH; index++) {
    const characterValue =
      cnpjWithoutCheckDigits.charCodeAt(index) - ZERO_CHAR_CODE;

    firstCheckDigitSum += characterValue * CHECK_DIGIT_WEIGHTS[index + 1];
    secondCheckDigitSum += characterValue * CHECK_DIGIT_WEIGHTS[index];
  }

  const firstRemainder = firstCheckDigitSum % 11;
  const firstCheckDigit = firstRemainder < 2 ? 0 : 11 - firstRemainder;

  secondCheckDigitSum +=
    firstCheckDigit * CHECK_DIGIT_WEIGHTS[CNPJ_WITHOUT_CHECK_DIGITS_LENGTH];

  const secondRemainder = secondCheckDigitSum % 11;
  const secondCheckDigit = secondRemainder < 2 ? 0 : 11 - secondRemainder;

  return `${firstCheckDigit}${secondCheckDigit}`;
}

@ValidatorConstraint({ name: 'isCnpj', async: false })
export class CnpjValidatorConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;

    const cnpj = normalizeCnpj(value);

    if (!CNPJ_PATTERN.test(cnpj) || cnpj === ZEROED_CNPJ) return false;

    const cnpjWithoutCheckDigits = cnpj.slice(
      0,
      CNPJ_WITHOUT_CHECK_DIGITS_LENGTH,
    );
    const informedCheckDigits = cnpj.slice(CNPJ_WITHOUT_CHECK_DIGITS_LENGTH);

    return informedCheckDigits === calculateCheckDigits(cnpjWithoutCheckDigits);
  }

  defaultMessage(): string {
    return 'O CNPJ deve ser válido';
  }
}
