import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class AvailabilityQueryDto {
  @ApiProperty({
    example: '2026-08-15',
    description: 'Data local no fuso da empresa',
  })
  @IsDateString()
  date: string;
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  professionalId: string;
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'IDs separados por vírgula ou parâmetros repetidos',
  })
  @Transform(({ value }: { value: string | string[] }) =>
    Array.isArray(value) ? value : value?.split(','),
  )
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds: string[];
}
