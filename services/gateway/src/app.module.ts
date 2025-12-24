import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    // Глобальная конфигурация .env файлов
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.${process.env.NODE_ENV}.env`
        : '.development.env',
    }),

    // Rate Limiting (защита от спама)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 секунд
        limit: 100, // 100 запросов за 60 секунд
      },
    ]),

    // Кэширование
    CacheModule.register({
      isGlobal: true,
      ttl: 60, // 60 секунд
      max: 100, // максимум 100 записей
    }),

    AuthModule,
    ProxyModule,
  ],
  providers: [
    // Глобальный Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
