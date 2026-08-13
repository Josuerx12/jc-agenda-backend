import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailOutbox } from 'src/infra/entities/email-outbox.entity';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from './email.constants';
import { getBullConfig } from './redis.config';
import { EmailDispatcher } from './email.dispatcher';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailOutbox]),
    BullModule.forRoot(getBullConfig()),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [EmailService, EmailDispatcher, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
