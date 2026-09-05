import { Module } from '@nestjs/common';
import { CompanyUserServices } from './company-user.service';
import { CompanyUserController } from './company-user.controller';
import { EmailModule } from '../email/email.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [EmailModule, MediaModule],
  controllers: [CompanyUserController],
  providers: [CompanyUserServices],
})
export class CompanyUserModule {}
