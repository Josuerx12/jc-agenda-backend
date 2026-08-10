import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../../../infra/entities/appointment.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ListAppointmentsQueryDto {
  @ApiProperty({ example: '2026-08-01T00:00:00-03:00' })
  @IsDateString()
  from: string;
  @ApiProperty({ example: '2026-08-31T23:59:59-03:00' })
  @IsDateString()
  to: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
