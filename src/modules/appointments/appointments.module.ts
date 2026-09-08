import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';
import { AppointmentAttendanceService } from './appointment-attendance.service';
@Module({
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AvailabilityService,
    AppointmentAttendanceService,
  ],
})
export class AppointmentsModule {}
