import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsUUID, Matches } from 'class-validator';
export class CreateAppointmentDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Cliente previamente cadastrado na empresa',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professionalId: string;
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds: string[];
  @ApiProperty({
    example: '2026-08-15T09:00:00-03:00',
    description: 'Horário retornado pela disponibilidade',
  })
  @IsDateString()
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, {
    message: 'startAt deve conter o fuso horário',
  })
  startAt: string;
}
