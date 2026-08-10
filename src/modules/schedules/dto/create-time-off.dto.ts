import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateTimeOffDto {
  @ApiProperty({ example: '2026-08-20T12:00:00-03:00' })
  @IsDateString()
  startAt: string;
  @ApiProperty({ example: '2026-08-20T18:00:00-03:00' })
  @IsDateString()
  endAt: string;
  @ApiPropertyOptional({ example: 'Consulta médica' })
  @IsOptional()
  @IsString()
  reason?: string;
}
