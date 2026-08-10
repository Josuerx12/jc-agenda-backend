import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../../infra/entities/appointment.entity';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
