import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const PORT = process.env.PORT || 5003;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Hybrid mode:
  // 1) app.listen(PORT) — поднимает HTTP API
  // 2) app.connectMicroservice(...) — добавляет Kafka consumer в тот же процесс
  // Это удобно для обучения: один сервис и HTTP запросы принимает, и Kafka события слушает.
  const brokers = (process.env.KAFKA_BROKERS || '')
    .split(',')
    .map((s) => s.trim());

  app.connectMicroservice<MicroserviceOptions>({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'cart-service',
        brokers,
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'cart-service',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT, () =>
    console.log(`Server CART started on port ${PORT}`),
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
