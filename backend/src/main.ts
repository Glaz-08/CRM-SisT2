import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QueryFailedFilter } from './common/filters/query-failed.filter';

/** Arranca la API con validación global, Swagger y cierre ordenado de conexiones. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('CRM Backend')
    .setDescription('The CRM API description')
    .setVersion('1.0')
    .addTag('CRM')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalFilters(new QueryFailedFilter());
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  console.error('No se pudo iniciar la API', error);
  process.exit(1);
});
