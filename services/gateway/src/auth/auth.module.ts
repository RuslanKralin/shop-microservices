import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth.guard';

//Модуль который настраивает JWT с тем же секретом что в user-service. Экспортирует Guard для использования в других модулях.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
