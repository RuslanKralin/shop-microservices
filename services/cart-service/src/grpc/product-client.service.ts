import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, Transport } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

// Интерфейс для gRPC сервиса (должен соответствовать .proto файлу)
interface ProductServiceClient {
  getProduct(data: { id: number }): Observable<any>;
  checkAvailability(data: {
    productId: number;
    quantity: number;
  }): Observable<any>;
}

@Injectable()
export class ProductClientService implements OnModuleInit {
  // Переменная для хранения клиента
  private productService: ProductServiceClient;

  // Создаем клиент
  @Client({
    transport: Transport.GRPC,
    options: {
      url: 'product-app-dev:50051', // Имя сервиса из docker-compose
      package: 'product',
      protoPath: join(__dirname, '../proto/product.proto'),
    },
  })
  private client: ClientGrpc;

  // Инициализация клиента при старте приложения
  onModuleInit() {
    this.productService =
      this.client.getService<ProductServiceClient>('ProductService');
    console.log(
      '✅ [CART-SERVICE] gRPC клиент для ProductService инициализирован',
    );
  }

  // Метод для получения информации о товаре
  async getProduct(productId: number) {
    try {
      console.log(
        `[CART-SERVICE] Запрос информации о товаре ${productId} через gRPC`,
      );
      return await this.productService
        .getProduct({ id: productId })
        .toPromise();
    } catch (error) {
      console.error('Ошибка при вызове getProduct через gRPC:', error);
      throw error;
    }
  }

  // Метод для проверки наличия товара
  async checkAvailability(productId: number, quantity: number) {
    try {
      console.log(
        `[CART-SERVICE] Проверка наличия товара ${productId} (${quantity} шт.) через gRPC`,
      );
      return await this.productService
        .checkAvailability({ productId, quantity })
        .toPromise();
    } catch (error) {
      console.error('Ошибка при вызове checkAvailability через gRPC:', error);
      throw error;
    }
  }
}
