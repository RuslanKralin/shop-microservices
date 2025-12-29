import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { AuthModule } from '../auth/auth.module';
import { PinoLoggerService } from 'src/common/logger/logger.service';

//Модуль который связывает контроллер и сервис. Импортирует HttpModule для HTTP запросов и AuthModule для проверки токенов.
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService, PinoLoggerService],
})
export class ProxyModule {}
