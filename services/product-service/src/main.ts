import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppModule } from './app.module';
import { BadRequestException } from './common/exceptions/bad-request.exception';

async function bootstrap() {
  const PORT = process.env.PORT || 5001;
  // Создаем обычное HTTP приложение
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorMessages = errors.map((error) => ({
          field: error.property,
          errors: error.constraints
            ? Object.values(error.constraints)
            : ['Ошибка валидации'],
        }));
        return new BadRequestException('Ошибка валидации', errorMessages);
      },
    }),
  );

  // ============================================
  // ПОДКЛЮЧАЕМ gRPC МИКРОСЕРВИС
  // ============================================
  // Hybrid mode: одно приложение работает и как HTTP сервер, и как gRPC сервер
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      // Имя пакета из .proto файла
      package: 'product',

      // Путь к .proto файлу
      // join(__dirname, ...) - правильный путь после компиляции TypeScript
      protoPath: join(__dirname, 'proto/product.proto'),

      // URL на котором будет слушать gRPC сервер
      // 0.0.0.0 - слушать на всех сетевых интерфейсах
      // 50051 - стандартный порт для gRPC
      url: '0.0.0.0:50051',
    },
  });

  // Запускаем gRPC микросервис
  await app.startAllMicroservices();
  console.log('✅ [PRODUCT-SERVICE] gRPC сервер запущен на порту 50051');

  // Запускаем HTTP сервер
  await app.listen(PORT);
  console.log(`✅ [PRODUCT-SERVICE] HTTP сервер запущен на порту ${PORT}`);
}

bootstrap();
