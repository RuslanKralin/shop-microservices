import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductGrpcController } from './product-grpc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [
    ProductController, // HTTP контроллер
    ProductGrpcController, // gRPC контроллер
  ],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
