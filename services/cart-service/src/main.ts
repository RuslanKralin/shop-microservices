import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const PORT = process.env.PORT || 5003;
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(PORT, () =>
    console.log(`Server CART started on port ${PORT}`),
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
