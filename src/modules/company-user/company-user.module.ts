import { Module } from '@nestjs/common';
import { CompanyUserServices } from './company-user.service';
import { CompanyUserController } from './company-user.controller';

@Module({
  controllers: [CompanyUserController],
  providers: [CompanyUserServices],
})
export class CompanyUserModule {}
