# Настройка gRPC коммуникации между микросервисами

## Введение

Этот документ описывает пошаговую настройку gRPC коммуникации между двумя микросервисами: **Product Service** (сервер) и **Cart Service** (клиент).

## Архитектура

```
┌─────────────────┐         gRPC          ┌──────────────────┐
│                 │  ───────────────────>  │                  │
│  Cart Service   │   CheckAvailability    │ Product Service  │
│   (Клиент)      │  <───────────────────  │    (Сервер)      │
│                 │      Response          │                  │
└─────────────────┘                        └──────────────────┘
     Port: 5002                                 Port: 5001
                                               gRPC: 50051
```

---

## Шаг 1: Создание Proto-файла

Proto-файл — это контракт между клиентом и сервером. Он описывает структуру сообщений и доступные методы.

### 1.1. Создайте файл `product.proto`

**Путь:** `services/product-service/src/proto/product.proto`

```protobuf
syntax = "proto3";

package product;

// Определяем сервис с методами
service ProductService {
  // Метод для проверки доступности товара
  rpc CheckAvailability (CheckAvailabilityRequest) returns (CheckAvailabilityResponse);
}

// Запрос: что мы отправляем
message CheckAvailabilityRequest {
  int32 productId = 1;   // ID товара
  int32 quantity = 2;    // Требуемое количество
}

// Ответ: что мы получаем
message CheckAvailabilityResponse {
  bool available = 1;         // Доступен ли товар
  double price = 2;           // Цена товара
  int32 availableStock = 3;   // Доступное количество на складе
}
```

### 1.2. Объяснение структуры

- **syntax = "proto3"** — используем третью версию Protocol Buffers
- **package product** — пространство имен для избежания конфликтов
- **service ProductService** — определяет gRPC сервис с методами
- **rpc CheckAvailability** — метод, который можно вызвать удаленно
- **message** — структура данных (аналог класса/интерфейса)
- **int32, double, bool** — типы данных
- **= 1, = 2, = 3** — номера полей (важны для сериализации)

---

## Шаг 2: Настройка серверной части (Product Service)

Product Service будет **сервером**, который обрабатывает gRPC запросы.

### 2.1. Установка зависимостей

```bash
cd services/product-service
npm install @grpc/grpc-js @grpc/proto-loader @nestjs/microservices
```

**Что устанавливаем:**

- `@grpc/grpc-js` — библиотека gRPC для Node.js
- `@grpc/proto-loader` — загрузчик proto-файлов
- `@nestjs/microservices` — поддержка микросервисов в NestJS

### 2.2. Создание gRPC контроллера

**Путь:** `services/product-service/src/product/product-grpc.controller.ts`

```typescript
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductGrpcController {
  constructor(private readonly productService: ProductService) {}

  // Декоратор @GrpcMethod указывает, что это gRPC метод
  // Первый параметр — имя сервиса, второй — имя метода
  @GrpcMethod('ProductService', 'CheckAvailability')
  async checkAvailability(data: { productId: number; quantity: number }) {
    console.log(`📥 [gRPC] Получен запрос CheckAvailability:`, data);

    // Получаем товар из базы данных
    const product = await this.productService.findOne(data.productId);

    if (!product) {
      console.log(`❌ [gRPC] Товар ${data.productId} не найден`);
      return {
        available: false,
        price: 0,
        availableStock: 0,
      };
    }

    // Проверяем наличие на складе
    const available = product.stock >= data.quantity;

    console.log(`📤 [gRPC] Товар доступен:`, {
      available,
      price: product.price,
      availableStock: product.stock,
    });

    return {
      available,
      price: product.price,
      availableStock: product.stock,
    };
  }
}
```

### 2.3. Регистрация контроллера в модуле

**Путь:** `services/product-service/src/product/product.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
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
```

### 2.4. Настройка gRPC сервера в main.ts

**Путь:** `services/product-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 5001;

  // Создаем обычное HTTP приложение
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // ============================================
  // ПОДКЛЮЧАЕМ gRPC МИКРОСЕРВИС (Hybrid mode)
  // ============================================
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'product', // Имя пакета из proto-файла
      protoPath: join(__dirname, './proto/product.proto'), // Путь к proto-файлу
      url: '0.0.0.0:50051', // gRPC сервер слушает на порту 50051
    },
  });

  // Запускаем все микросервисы
  await app.startAllMicroservices();
  console.log('✅ [PRODUCT-SERVICE] gRPC сервер запущен на порту 50051');

  // Запускаем HTTP сервер
  await app.listen(PORT);
  console.log(`✅ [PRODUCT-SERVICE] HTTP сервер запущен на порту ${PORT}`);
}
bootstrap();
```

**Важно:**

- `Transport.GRPC` — указываем тип транспорта
- `package: 'product'` — должно совпадать с `package` в proto-файле
- `url: '0.0.0.0:50051'` — слушаем на всех интерфейсах на порту 50051
- `app.connectMicroservice()` — подключаем gRPC как дополнительный транспорт
- `app.startAllMicroservices()` — запускаем все микросервисы

---

## Шаг 3: Настройка клиентской части (Cart Service)

Cart Service будет **клиентом**, который вызывает методы Product Service через gRPC.

### 3.1. Копирование proto-файла

Proto-файл должен быть одинаковым на клиенте и сервере!

```bash
mkdir -p services/cart-service/src/proto
cp services/product-service/src/proto/product.proto services/cart-service/src/proto/
```

### 3.2. Установка зависимостей

```bash
cd services/cart-service
npm install @grpc/grpc-js @grpc/proto-loader @nestjs/microservices
```

### 3.3. Создание клиентского сервиса

**Путь:** `services/cart-service/src/grpc/product-client.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

// Интерфейс для типизации gRPC клиента
interface ProductServiceClient {
  checkAvailability(data: {
    productId: number;
    quantity: number;
  }): Observable<any>;
}

@Injectable()
export class ProductClientService implements OnModuleInit {
  // Переменная для хранения клиента
  private productService: ProductServiceClient;

  // Создаем клиент с помощью декоратора @Client
  @Client({
    transport: Transport.GRPC,
    options: {
      url: 'product-app-dev:50051', // Имя сервиса из docker-compose
      package: 'product', // Имя пакета из proto-файла
      protoPath: join(__dirname, '../proto/product.proto'), // Путь к proto-файлу
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

  // Метод для проверки доступности товара
  async checkAvailability(
    productId: number,
    quantity: number,
  ): Promise<{
    available: boolean;
    price: number;
    availableStock: number;
  }> {
    console.log(
      `[CART-SERVICE] Запрос информации о товаре ${productId} через gRPC`,
    );

    try {
      // Вызываем gRPC метод и конвертируем Observable в Promise
      const result = await this.productService
        .checkAvailability({ productId, quantity })
        .toPromise();

      console.log(`[CART-SERVICE] Получен ответ от Product Service:`, result);
      return result;
    } catch (error) {
      console.error(`[CART-SERVICE] Ошибка gRPC запроса:`, error);
      throw error;
    }
  }
}
```

**Важные моменты:**

- `@Client()` — декоратор для создания gRPC клиента
- `url: 'product-app-dev:50051'` — имя контейнера Docker + порт gRPC
- `onModuleInit()` — инициализируется при старте приложения
- `.toPromise()` — конвертируем Observable в Promise для удобства

### 3.4. Регистрация в модуле

**Путь:** `services/cart-service/src/cart/cart.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductClientService } from '../grpc/product-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartEntity, CartItemEntity])],
  controllers: [CartController],
  providers: [
    CartService,
    ProductClientService, // Регистрируем gRPC клиент
  ],
})
export class CartModule {}
```

### 3.5. Использование в сервисе

**Путь:** `services/cart-service/src/cart/cart.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';
import { ProductClientService } from '../grpc/product-client.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private cartItemRepository: Repository<CartItemEntity>,
    private productClientService: ProductClientService, // Инжектим gRPC клиент
  ) {}

  async addItem(userId: number, productId: number, quantity: number) {
    console.log(
      `🔍 [CartService] Проверяю товар productId=${productId}, quantity=${quantity}`,
    );

    // Вызываем gRPC метод для проверки товара
    const productInfo = await this.productClientService.checkAvailability(
      productId,
      quantity,
    );

    // Проверяем результат
    if (!productInfo.available) {
      throw new BadRequestException(
        `Товар с ID ${productId} недоступен или недостаточно на складе`,
      );
    }

    console.log(
      `✅ [CartService] Товар доступен: цена ${productInfo.price}, на складе ${productInfo.availableStock}`,
    );

    // Находим или создаем корзину
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId, items: [] });
      await this.cartRepository.save(cart);
    }

    // Добавляем товар в корзину
    const cartItem = this.cartItemRepository.create({
      cart,
      productId,
      quantity,
    });

    await this.cartItemRepository.save(cartItem);

    return this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items'],
    });
  }
}
```

---

## Шаг 4: Настройка Docker

### 4.1. Docker Compose конфигурация

**Путь:** `infra/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  # Product Service (gRPC сервер)
  product-app-dev:
    build:
      context: ../services/product-service
      dockerfile: Dockerfile.dev
    container_name: product-app-dev
    ports:
      - '5001:5001' # HTTP порт
      - '50051:50051' # gRPC порт (важно!)
    environment:
      - NODE_ENV=development
      - PORT=5001
    volumes:
      - ../services/product-service:/app
      - /app/node_modules
    depends_on:
      - db_product
    networks:
      - default

  # Cart Service (gRPC клиент)
  cart-app-dev:
    build:
      context: ../services/cart-service
      dockerfile: Dockerfile.dev
    container_name: cart-app-dev
    ports:
      - '5002:5002' # HTTP порт
    environment:
      - NODE_ENV=development
      - PORT=5002
    volumes:
      - ../services/cart-service:/app
      - /app/node_modules
    depends_on:
      - product-app-dev # Важно: зависимость от Product Service
    networks:
      - default

networks:
  default:
    driver: bridge
```

**Важно:**

- Оба сервиса должны быть в одной сети Docker
- `product-app-dev:50051` — имя контейнера доступно внутри сети Docker
- Порт `50051` должен быть пробросен для gRPC

---

## Шаг 5: Запуск и тестирование

### 5.1. Запуск сервисов

```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
```

### 5.2. Проверка логов

**Product Service:**

```bash
docker compose -f docker-compose.dev.yml logs -f product-app-dev
```

Ожидаемый вывод:

```
✅ [PRODUCT-SERVICE] gRPC сервер запущен на порту 50051
✅ [PRODUCT-SERVICE] HTTP сервер запущен на порту 5001
```

**Cart Service:**

```bash
docker compose -f docker-compose.dev.yml logs -f cart-app-dev
```

Ожидаемый вывод:

```
✅ [CART-SERVICE] gRPC клиент для ProductService инициализирован
```

### 5.3. Тестирование через Postman

#### Шаг 1: Создать товар

**Запрос:** `POST http://localhost:3000/api/products`

**Body:**

```json
{
  "name": "iPhone 15 Pro",
  "price": 99999,
  "stock": 50
}
```

**Ответ:**

```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "price": 99999,
  "stock": 50,
  "createdAt": "2025-12-26T...",
  "updatedAt": "2025-12-26T..."
}
```

#### Шаг 2: Добавить товар в корзину (проверка gRPC)

**Запрос:** `POST http://localhost:3000/api/cart/items`

**Body:**

```json
{
  "userId": 1,
  "productId": 1,
  "quantity": 2
}
```

**Ожидаемый ответ:**

```json
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 2,
      "cartId": 1
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Шаг 3: Проверить логи gRPC коммуникации

**Product Service:**

```bash
docker compose -f docker-compose.dev.yml logs product-app-dev --tail=20
```

Вы должны увидеть:

```
📥 [gRPC] Получен запрос CheckAvailability: { productId: 1, quantity: 2 }
📤 [gRPC] Товар доступен: { available: true, price: 99999, availableStock: 50 }
```

**Cart Service:**

```bash
docker compose -f docker-compose.dev.yml logs cart-app-dev --tail=20
```

Вы должны увидеть:

```
🔍 [CartService] Проверяю товар productId=1, quantity=2
[CART-SERVICE] Запрос информации о товаре 1 через gRPC
[CART-SERVICE] Получен ответ от Product Service: { available: true, price: 99999, availableStock: 50 }
✅ [CartService] Товар доступен: цена 99999, на складе 50
```

---

## Шаг 6: Обработка ошибок

### 6.1. Создание глобального фильтра исключений

**Путь:** `services/product-service/src/common/filters/http-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || message;
        errors = (response as any).errors || errors;
      } else if (typeof response === 'string') {
        message = response;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error(`[${new Date().toISOString()}] Ошибка: ${message}`, {
      path: request.url,
      method: request.method,
      exception,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errors.length > 0 ? { errors } : {}),
    });
  }
}
```

### 6.2. Подключение фильтра в main.ts

```typescript
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный фильтр исключений
  app.useGlobalFilters(new HttpExceptionFilter());

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ... остальной код
}
```

---

## Возможные проблемы и решения

### Проблема 1: "Cannot find module './proto/product.proto'"

**Причина:** Proto-файл не копируется в dist при сборке.

**Решение:** Обновите `nest-cli.json`:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": [
      {
        "include": "proto/**/*",
        "outDir": "dist",
        "watchAssets": true
      }
    ]
  }
}
```

### Проблема 2: "Connection refused" при gRPC запросе

**Причина:** Cart Service не может подключиться к Product Service.

**Решение:**

1. Проверьте, что оба сервиса в одной Docker сети
2. Используйте имя контейнера вместо localhost: `product-app-dev:50051`
3. Убедитесь, что порт 50051 открыт в docker-compose.yml

### Проблема 3: "Invalid wire type" или "Malformed response"

**Причина:** Несоответствие proto-файлов на клиенте и сервере.

**Решение:**

1. Убедитесь, что proto-файлы идентичны
2. Проверьте, что package и service names совпадают
3. Перезапустите оба сервиса

### Проблема 4: "Method not found"

**Причина:** Метод не зарегистрирован в контроллере или неправильное имя.

**Решение:**

1. Проверьте декоратор `@GrpcMethod('ProductService', 'CheckAvailability')`
2. Убедитесь, что имена совпадают с proto-файлом
3. Проверьте, что контроллер зарегистрирован в модуле

---

## Преимущества gRPC

1. **Производительность:** Использует HTTP/2 и бинарную сериализацию (Protocol Buffers)
2. **Типизация:** Строгая типизация на основе proto-файлов
3. **Поддержка стриминга:** Может передавать потоки данных
4. **Кроссплатформенность:** Работает на разных языках программирования
5. **Автогенерация кода:** Клиенты и серверы генерируются из proto-файлов

---

## Сравнение с REST API

| Характеристика       | REST API     | gRPC                        |
| -------------------- | ------------ | --------------------------- |
| Протокол             | HTTP/1.1     | HTTP/2                      |
| Формат данных        | JSON (текст) | Protocol Buffers (бинарный) |
| Производительность   | Средняя      | Высокая                     |
| Размер сообщений     | Больше       | Меньше                      |
| Типизация            | Слабая       | Строгая                     |
| Читаемость           | Высокая      | Низкая (бинарный формат)    |
| Браузерная поддержка | Отличная     | Ограниченная                |

---

## Заключение

Вы успешно настроили gRPC коммуникацию между двумя микросервисами:

1. ✅ Создали proto-файл с контрактом
2. ✅ Настроили Product Service как gRPC сервер
3. ✅ Настроили Cart Service как gRPC клиент
4. ✅ Настроили Docker для работы в одной сети
5. ✅ Добавили обработку ошибок
6. ✅ Протестировали коммуникацию

Теперь ваши микросервисы могут эффективно общаться друг с другом через gRPC!

---

## Дополнительные ресурсы

- [Официальная документация gRPC](https://grpc.io/docs/)
- [Protocol Buffers документация](https://developers.google.com/protocol-buffers)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [gRPC в Node.js](https://grpc.io/docs/languages/node/)
