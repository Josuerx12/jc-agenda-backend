import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyService } from './modules/company/company.service';
import { CompanyModule } from './modules/company/company.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { DatabaseModule } from './infra/database/database.module';
import { ServicesModule } from './modules/services/services.module';
import { CompanyUserModule } from './modules/company-user/company-user.module';
import { ProductsModule } from './modules/products/products.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { EmailModule } from './modules/email/email.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    DatabaseModule,
    CompanyModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    ServicesModule,
    CompanyUserModule,
    ProductsModule,
    SchedulesModule,
    ClientsModule,
    AppointmentsModule,
    EmailModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, CompanyService],
})
export class AppModule {}
