import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppValidationPipe } from './infra/pipes/app-validation.pipe';
import { updateGlobalConfig } from 'nestjs-paginate';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerEnabled =
    process.env.MODE?.toUpperCase() === 'DEV' ||
    process.env.ENABLE_SWAGGER === 'true';
  app.use(
    helmet({ contentSecurityPolicy: swaggerEnabled ? false : undefined }),
  );

  updateGlobalConfig({
    defaultOrigin: undefined,
    defaultLimit: 10,
    defaultMaxLimit: 100,
  });

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (
    allowedOrigins.length === 0 &&
    process.env.MODE?.toUpperCase() !== 'DEV'
  ) {
    throw new Error('CORS_ORIGINS deve ser configurado em produção');
  }
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new AppValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('JC Agenda API')
    .setDescription('Documentação da API do JC Agenda')
    .setVersion('1.0')
    .addTag('JC Agenda')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();

  if (swaggerEnabled) {
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
