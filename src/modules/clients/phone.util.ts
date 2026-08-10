import { BadRequestException } from '@nestjs/common';
export function normalizePhone(phone: string) {
  if (typeof phone !== 'string') {
    throw new BadRequestException('Telefone deve ser informado');
  }
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 10 || normalized.length > 13)
    throw new BadRequestException('Telefone inválido');
  return normalized;
}
