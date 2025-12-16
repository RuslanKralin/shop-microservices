import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { UserEventsController } from './user-events.controller';

@Module({
  // Нам нужен CartService (лежит в CartModule), чтобы по событию UserCreated
  // создавать корзину пользователю.
  imports: [CartModule],
  // Контроллер микросервисных событий (Kafka consumer handlers)
  controllers: [UserEventsController],
})
export class KafkaModule {}
