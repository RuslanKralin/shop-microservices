import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function start() {
  const PORT = process.env.PORT || 5000;

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  //ыреализлвать защиту маршрутов только для авторизованных пользователей
  // app.useGlobalGuards(new JwtAuthGuard());

  const config = new DocumentBuilder()
    .setTitle('Продвинутый бэкенд')
    .setDescription('Документация REST API')
    .setVersion('1.0.0')
    .addTag('RUSLAN-BACKEND')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

start();
