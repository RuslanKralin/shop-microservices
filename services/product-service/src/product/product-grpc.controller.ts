import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';

// ============================================
// gRPC КОНТРОЛЛЕР для Product-service
// ============================================
// Этот контроллер обрабатывает gRPC запросы от других микросервисов
// В отличие от обычного HTTP контроллера, здесь используется декоратор @GrpcMethod

@Controller()
export class ProductGrpcController {
  constructor(private readonly productService: ProductService) {}

  // ============================================
  // МЕТОД 1: Получить один товар по ID
  // ============================================
  // Вызывается когда cart-service хочет проверить товар перед добавлением в корзину
  @GrpcMethod('ProductService', 'GetProduct')
  async getProduct(data: { id: number }) {
    console.log('📥 [gRPC] Получен запрос GetProduct:', data);

    // Получаем товар из базы данных
    const product = await this.productService.findById(data.id);

    // Возвращаем данные в формате, описанном в .proto файле
    const response = {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    };

    console.log('📤 [gRPC] Отправляю ответ GetProduct:', response);
    return response;
  }

  // ============================================
  // МЕТОД 2: Получить несколько товаров по массиву ID
  // ============================================
  // Вызывается когда cart-service хочет показать корзину с актуальными ценами
  @GrpcMethod('ProductService', 'GetProductsByIds')
  async getProductsByIds(data: { ids: number[] }) {
    console.log('📥 [gRPC] Получен запрос GetProductsByIds:', data);

    // Получаем все товары из базы данных
    // TODO: Оптимизировать - сделать один запрос вместо нескольких
    const products = await Promise.all(
      data.ids.map((id) => this.productService.findById(id)),
    );

    // Формируем ответ
    const response = {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
      })),
    };

    console.log('📤 [gRPC] Отправляю ответ GetProductsByIds:', response);
    return response;
  }

  // ============================================
  // МЕТОД 3: Проверить наличие товара
  // ============================================
  // Вызывается перед добавлением товара в корзину
  // Проверяет: существует ли товар и достаточно ли его на складе
  @GrpcMethod('ProductService', 'CheckAvailability')
  async checkAvailability(data: { productId: number; quantity: number }) {
    console.log('📥 [gRPC] Получен запрос CheckAvailability:', data);

    // Используем существующий метод из ProductService
    const result = await this.productService.checkAvailability(
      data.productId,
      data.quantity,
    );

    // Формируем ответ в зависимости от результата проверки
    if (result.available && result.product) {
      const response = {
        available: true,
        message: 'Товар доступен',
        availableStock: result.product.stock,
        price: result.product.price,
      };
      console.log('📤 [gRPC] Товар доступен:', response);
      return response;
    } else {
      const response = {
        available: false,
        message: result.error || 'Товар недоступен',
        availableStock: 0,
        price: 0,
      };
      console.log('📤 [gRPC] Товар недоступен:', response);
      return response;
    }
  }
}
