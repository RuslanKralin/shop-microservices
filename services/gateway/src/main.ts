import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS для фронтенда
  app.enableCors({
    origin: [
      'http://localhost:3001', // React
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Валидация входящих данных
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log('');
  console.log('🚀 ============================================');
  console.log(`🚀 [API-GATEWAY] Запущен на порту ${PORT}`);
  console.log('🚀 ============================================');
  console.log('');
  console.log('📍 Доступные эндпоинты:');
  console.log('   POST   http://localhost:3000/api/auth/registration');
  console.log('   POST   http://localhost:3000/api/auth/login');
  console.log('   GET    http://localhost:3000/api/products');
  console.log('   GET    http://localhost:3000/api/cart');
  console.log('   GET    http://localhost:3000/api/orders');
  console.log('');
}
bootstrap();
