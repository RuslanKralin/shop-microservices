import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';
import { ProductClientService } from '../grpc/product-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartEntity, CartItemEntity])],
  controllers: [CartController],
  providers: [
    CartService,
    ProductClientService, // Регистрируем gRPC клиент для связи с product-service
  ],
  exports: [CartService], // Экспортируем CartService для использования в других модулях (например, KafkaModule)
})
export class CartModule {}
