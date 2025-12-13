import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 5001;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(PORT, () =>
    console.log(`Server PRODUCT started on port ${PORT}`),
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
