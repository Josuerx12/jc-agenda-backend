import { config } from 'dotenv';

import { BullRootModuleOptions } from '@nestjs/bullmq';

config();

export function getBullConfig(): BullRootModuleOptions {
  const production = process.env.MODE?.toUpperCase() !== 'DEV';
  const password = process.env.REDIS_PASSWORD;

  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error('REDIS_HOST e REDIS_PORT devem ser configurados');
  }
  if (production && !password) {
    throw new Error('REDIS_PASSWORD deve ser configurado em produção');
  }

  return {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: password || undefined,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    },
    prefix: process.env.REDIS_QUEUE_PREFIX ?? 'jc-agenda',
  };
}
