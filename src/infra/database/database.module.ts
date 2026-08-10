import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from '../config/config.service';
import { Address } from '../entities/address.entity';
import { City } from '../entities/city.entity';
import { CompanyAddress } from '../entities/company-address.entity';
import { CompanyUser } from '../entities/company-user.entity';
import { Company } from '../entities/company.entity';
import { State } from '../entities/state.entity';
import { User } from '../entities/user.entity';
import { Service } from '../entities/services.entity';
import { CompanyUserService } from '../entities/company-user-service.entity';
import { Product } from '../entities/product.entity';
import { ProfessionalWorkSchedule } from '../entities/professional-work-schedule.entity';
import { CompanyHoliday } from '../entities/company-holiday.entity';
import { ProfessionalTimeOff } from '../entities/professional-time-off.entity';
import { Client } from '../entities/client.entity';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentService } from '../entities/appointment-service.entity';

const entities = [
  Address,
  City,
  Company,
  CompanyAddress,
  CompanyUser,
  State,
  User,
  Service,
  CompanyUserService,
  Product,
  ProfessionalWorkSchedule,
  CompanyHoliday,
  ProfessionalTimeOff,
  Client,
  Appointment,
  AppointmentService,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
