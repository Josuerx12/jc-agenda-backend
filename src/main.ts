import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppValidationPipe } from './infra/pipes/app-validation.pipe';
import { updateGlobalConfig } from 'nestjs-paginate';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  updateGlobalConfig({
    defaultOrigin: undefined,
    defaultLimit: 10,
    defaultMaxLimit: 100,
  });

  app.enableCors('*');
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

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
