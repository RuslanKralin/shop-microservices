import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { USER_SERVICE_KAFKA_CLIENT } from './kafka.constants';

@Module({
  // ConfigModule уже подключён глобально в AppModule, но импорт тут не мешает:
  // он нужен, чтобы ConfigService точно был доступен в registerAsync.
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_KAFKA_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          // Для docker: KAFKA_BROKERS=kafka:9092
          // Для локального запуска: KAFKA_BROKERS=localhost:9094
          const brokers = (config.get<string>('KAFKA_BROKERS') || '')
            .split(',')
            .map((s) => s.trim());

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: config.get('KAFKA_CLIENT_ID') || 'user-service',
                brokers,
              },
              // В Nest Kafka client требует consumer.groupId даже если мы хотим только emit.
              // Это особенность NestJS transport.
              consumer: {
                groupId: config.get('KAFKA_GROUP_ID') || 'user-service',
              },
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
