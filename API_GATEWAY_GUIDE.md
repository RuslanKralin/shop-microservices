# API Gateway для shop-microservices

## 📖 Содержание

- [Зачем нужен API Gateway](#зачем-нужен-api-gateway)
- [Проблемы без API Gateway](#проблемы-без-api-gateway)
- [Архитектура](#архитектура)
- [Что делает API Gateway](#что-делает-api-gateway)
- [Реализация](#реализация)
- [Продвинутые фичи](#продвинутые-фичи)
- [Docker Compose](#docker-compose)
- [План внедрения](#план-внедрения)

---

## Зачем нужен API Gateway

API Gateway — это единая точка входа для всех клиентских запросов к вашим микросервисам.

### Текущая ситуация (без API Gateway)

```
Frontend → user-service (localhost:5000)
        → product-service (localhost:5001)
        → order-service (localhost:5002)
        → cart-service (localhost:5003)
```

### С API Gateway

```
Frontend → API Gateway (localhost:3000) → Микросервисы
```

---

## Проблемы без API Gateway

### ❌ Для фронтенда

```javascript
// Фронтенд должен знать все порты и адреса
const user = await fetch('http://localhost:5000/api/auth/login', {...});
const products = await fetch('http://localhost:5001/api/products', {...});
const cart = await fetch('http://localhost:5003/api/cart/user/1', {...});
const orders = await fetch('http://localhost:5002/api/orders', {...});
```

**Проблемы:**

- Фронтенд знает о внутренней структуре микросервисов
- CORS настройки нужно дублировать в каждом сервисе
- Аутентификация дублируется в каждом сервисе
- Rate limiting настраивается отдельно
- Логирование разрозненное
- При изменении портов нужно обновлять фронтенд

### ✅ С API Gateway

```javascript
// Один endpoint для всего
const user = await fetch('http://localhost:3000/api/auth/login', {...});
const products = await fetch('http://localhost:3000/api/products', {...});
const cart = await fetch('http://localhost:3000/api/cart', {...});
const orders = await fetch('http://localhost:3000/api/orders', {...});
```

**Преимущества:**

- ✅ CORS настроен один раз
- ✅ Аутентификация в одном месте
- ✅ Rate limiting централизованный
- ✅ Единое логирование
- ✅ Фронтенд не знает о внутренней структуре

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (React/Vue/Angular)                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (NestJS)                    │
│  Port: 3000                                                  │
│                                                              │
│  Функции:                                                    │
│  • Маршрутизация запросов                                   │
│  • Аутентификация и авторизация                             │
│  • Rate limiting                                             │
│  • Агрегация данных                                          │
│  • Кэширование                                               │
│  • Логирование                                               │
│  • CORS                                                      │
└────────────┬────────────┬────────────┬────────────┬─────────┘
             │            │            │            │
             ↓            ↓            ↓            ↓
    ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │   user-    │ │  product-  │ │   order-   │ │   cart-    │
    │  service   │ │  service   │ │  service   │ │  service   │
    │  :5000     │ │  :5001     │ │  :5002     │ │  :5003     │
    └────────────┘ └────────────┘ └────────────┘ └────────────┘
         │              │              │              │
         ↓              ↓              ↓              ↓
    PostgreSQL     PostgreSQL     PostgreSQL     PostgreSQL
```

---

## Что делает API Gateway

### 1. Маршрутизация запросов

```
GET  /api/auth/*     → user-service:5000
GET  /api/products/* → product-service:5001
GET  /api/orders/*   → order-service:5002
GET  /api/cart/*     → cart-service:5003
```

### 2. Аутентификация и авторизация

```typescript
// Проверяет JWT токен один раз
// Добавляет userId в заголовки для микросервисов
Request → Gateway (проверка токена) → Service (получает userId)
```

### 3. Агрегация данных (BFF - Backend for Frontend)

```typescript
// Один запрос от фронтенда → несколько запросов к сервисам
GET /api/dashboard → {
  user: user-service,
  cart: cart-service,
  recentOrders: order-service
}
```

### 4. Rate Limiting

```typescript
// Ограничение количества запросов
100 запросов в минуту на пользователя
```

### 5. Кэширование

```typescript
// Кэширование часто запрашиваемых данных
GET /api/products → кэш на 60 секунд
```

---

## Реализация

### Структура проекта

```
shop-microservices/
├── services/
│   ├── api-gateway/              # ← НОВЫЙ СЕРВИС
│   │   ├── src/
│   │   │   ├── auth/             # Аутентификация
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   └── public.decorator.ts
│   │   │   ├── proxy/            # Проксирование запросов
│   │   │   │   ├── proxy.controller.ts
│   │   │   │   ├── proxy.service.ts
│   │   │   │   └── proxy.module.ts
│   │   │   ├── aggregation/      # Агрегация данных
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   └── dashboard.service.ts
│   │   │   ├── common/           # Общие утилиты
│   │   │   │   └── logging.interceptor.ts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── .development.env
│   │   ├── package.json
│   │   └── Dockerfile.dev
│   ├── user-service/
│   ├── product-service/
│   ├── cart-service/
│   └── order-service/
```

### Создание сервиса

```bash
cd /home/INTEXSOFT/ruslan.kralin/Desktop/shop-microservices/services
nest new api-gateway
cd api-gateway
npm install @nestjs/axios @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/throttler @nestjs/cache-manager cache-manager
```

### 1. Модуль аутентификации

**Файл:** `api-gateway/src/auth/auth.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Проверяем, является ли эндпоинт публичным
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });

      // Добавляем данные пользователя в request
      request.user = payload;

      // Добавляем userId в заголовок для микросервисов
      request.headers['x-user-id'] = payload.id;
      request.headers['x-user-email'] = payload.email;
      request.headers['x-user-roles'] = JSON.stringify(payload.roles || []);

      console.log(
        `✅ [AUTH] Пользователь аутентифицирован: ${payload.email} (ID: ${payload.id})`,
      );

      return true;
    } catch (error) {
      console.error('❌ [AUTH] Ошибка валидации токена:', error.message);
      throw new UnauthorizedException('Невалидный токен');
    }
  }

  private extractToken(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**Файл:** `api-gateway/src/auth/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Файл:** `api-gateway/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth.guard';

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
```

### 2. Модуль проксирования

**Файл:** `api-gateway/src/proxy/proxy.service.ts`

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private serviceUrls: Record<string, string>;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.serviceUrls = {
      USER_SERVICE:
        this.configService.get('USER_SERVICE_URL') || 'http://localhost:5000',
      PRODUCT_SERVICE:
        this.configService.get('PRODUCT_SERVICE_URL') ||
        'http://localhost:5001',
      ORDER_SERVICE:
        this.configService.get('ORDER_SERVICE_URL') || 'http://localhost:5002',
      CART_SERVICE:
        this.configService.get('CART_SERVICE_URL') || 'http://localhost:5003',
    };

    console.log('🔧 [PROXY] Конфигурация сервисов:', this.serviceUrls);
  }

  async forward(req: Request, res: Response, serviceName: string) {
    const serviceUrl = this.serviceUrls[serviceName];

    if (!serviceUrl) {
      console.error(`❌ [PROXY] Сервис не найден: ${serviceName}`);
      throw new HttpException('Service not found', 500);
    }

    // Формируем URL для микросервиса
    const targetUrl = `${serviceUrl}${req.url}`;

    console.log(`🔀 [PROXY] ${req.method} ${req.url} → ${targetUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url: targetUrl,
          data: req.body,
          headers: {
            ...req.headers,
            host: undefined, // Убираем host header
          },
          validateStatus: () => true, // Не бросаем ошибку на любой статус
        }),
      );

      console.log(`✅ [PROXY] ${req.method} ${req.url} → ${response.status}`);

      // Пробрасываем ответ от микросервиса
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error(
        `❌ [PROXY] Ошибка проксирования ${targetUrl}:`,
        error.message,
      );
      throw new HttpException('Service unavailable', 503);
    }
  }
}
```

**Файл:** `api-gateway/src/proxy/proxy.controller.ts`

```typescript
import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard) // Применяем guard ко всему контроллеру
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  // ==================== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ====================

  @Public()
  @All('auth/registration')
  @All('auth/login')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'USER_SERVICE');
  }

  @Public()
  @All('products')
  @All('products/:id')
  async proxyProductsPublic(@Req() req: Request, @Res() res: Response) {
    // Публичный доступ только для GET запросов (просмотр товаров)
    if (req.method === 'GET') {
      return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
    }
    // Для создания/изменения товаров нужна аутентификация
    // Guard автоматически проверит токен
    return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
  }

  // ==================== ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ ====================

  @All('users')
  @All('users/*')
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'USER_SERVICE');
  }

  @All('cart')
  @All('cart/*')
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'CART_SERVICE');
  }

  @All('orders')
  @All('orders/*')
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'ORDER_SERVICE');
  }
}
```

**Файл:** `api-gateway/src/proxy/proxy.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
```

### 3. Главный модуль

**Файл:** `api-gateway/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    // Глобальная конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV
        ? `.${process.env.NODE_ENV}.env`
        : '.development.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 секунд
        limit: 100, // 100 запросов
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
```

**Файл:** `api-gateway/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS для фронтенда
  app.enableCors({
    origin: [
      'http://localhost:3001', // React
      'http://localhost:3002', // Vue
      'http://localhost:4200', // Angular
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Валидация входящих данных
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log('');
  console.log('🚀 ============================================');
  console.log(`🚀 [API-GATEWAY] Запущен на порту ${PORT}`);
  console.log('🚀 ============================================');
  console.log('');
  console.log('📍 Доступные эндпоинты:');
  console.log('   POST   http://localhost:3000/api/auth/registration');
  console.log('   POST   http://localhost:3000/api/auth/login');
  console.log('   GET    http://localhost:3000/api/products');
  console.log('   GET    http://localhost:3000/api/cart');
  console.log('   GET    http://localhost:3000/api/orders');
  console.log('');
}
bootstrap();
```

### 4. Конфигурация

**Файл:** `api-gateway/.development.env`

```env
PORT=3000

# JWT секрет (должен совпадать с user-service)
JWT_SECRET=secretKey

# URLs микросервисов (для локальной разработки)
USER_SERVICE_URL=http://localhost:5000
PRODUCT_SERVICE_URL=http://localhost:5001
ORDER_SERVICE_URL=http://localhost:5002
CART_SERVICE_URL=http://localhost:5003
```

**Файл:** `api-gateway/.docker.env`

```env
PORT=3000

# JWT секрет (должен совпадать с user-service)
JWT_SECRET=secretKey

# URLs микросервисов (для Docker)
USER_SERVICE_URL=http://app-dev:5000
PRODUCT_SERVICE_URL=http://product-app-dev:5001
ORDER_SERVICE_URL=http://order-app-dev:5002
CART_SERVICE_URL=http://cart-app-dev:5003
```

**Файл:** `api-gateway/Dockerfile.dev`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
```

---

## Продвинутые фичи

### 1. Агрегация данных (Dashboard)

**Файл:** `api-gateway/src/aggregation/dashboard.controller.ts`

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Req() req: any) {
    const userId = req.user.id;

    console.log(`📊 [DASHBOARD] Загрузка данных для пользователя ${userId}`);

    // Параллельные запросы к разным сервисам
    const [user, cart, recentOrders] = await Promise.all([
      this.dashboardService.getUser(userId),
      this.dashboardService.getCart(userId),
      this.dashboardService.getRecentOrders(userId, 5),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      cart: {
        itemsCount: cart.items?.length || 0,
        total:
          cart.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) ||
          0,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        total: order.total,
        status: order.status,
      })),
    };
  }
}
```

**Файл:** `api-gateway/src/aggregation/dashboard.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DashboardService {
  private userServiceUrl: string;
  private cartServiceUrl: string;
  private orderServiceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.userServiceUrl =
      this.configService.get('USER_SERVICE_URL') || 'http://localhost:5000';
    this.cartServiceUrl =
      this.configService.get('CART_SERVICE_URL') || 'http://localhost:5003';
    this.orderServiceUrl =
      this.configService.get('ORDER_SERVICE_URL') || 'http://localhost:5002';
  }

  async getUser(userId: number) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.userServiceUrl}/api/users/${userId}`),
    );
    return response.data;
  }

  async getCart(userId: number) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.cartServiceUrl}/api/cart/user/${userId}`),
    );
    return response.data;
  }

  async getRecentOrders(userId: number, limit: number) {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.orderServiceUrl}/api/orders/user/${userId}?limit=${limit}`,
      ),
    );
    return response.data;
  }
}
```

### 2. Логирование всех запросов

**Файл:** `api-gateway/src/common/logging.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const userId = request.user?.id || 'anonymous';
    const startTime = Date.now();

    console.log('');
    console.log(`📥 ========================================`);
    console.log(`📥 [${method}] ${url}`);
    console.log(`📥 User: ${userId}`);
    console.log(`📥 IP: ${request.ip}`);
    if (Object.keys(body || {}).length > 0) {
      console.log(`📥 Body:`, JSON.stringify(body, null, 2));
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          console.log(`📤 Response: SUCCESS | Duration: ${duration}ms`);
          console.log(`📤 ========================================`);
          console.log('');
        },
        error: error => {
          const duration = Date.now() - startTime;
          console.log(`📤 Response: ERROR | Duration: ${duration}ms`);
          console.log(`📤 Error:`, error.message);
          console.log(`📤 ========================================`);
          console.log('');
        },
      }),
    );
  }
}
```

Добавьте в `app.module.ts`:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/logging.interceptor';

@Module({
  // ...
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

### 3. Circuit Breaker (отказоустойчивость)

```bash
npm install opossum
```

**Файл:** `api-gateway/src/common/circuit-breaker.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getBreaker(serviceName: string, action: Function): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breaker = new CircuitBreaker(action, {
        timeout: 3000, // 3 секунды
        errorThresholdPercentage: 50, // 50% ошибок
        resetTimeout: 30000, // 30 секунд до попытки восстановления
      });

      breaker.on('open', () => {
        console.log(
          `🔴 [CIRCUIT-BREAKER] ${serviceName} - OPEN (сервис недоступен)`,
        );
      });

      breaker.on('halfOpen', () => {
        console.log(
          `🟡 [CIRCUIT-BREAKER] ${serviceName} - HALF-OPEN (проверка восстановления)`,
        );
      });

      breaker.on('close', () => {
        console.log(
          `🟢 [CIRCUIT-BREAKER] ${serviceName} - CLOSED (сервис восстановлен)`,
        );
      });

      this.breakers.set(serviceName, breaker);
    }

    return this.breakers.get(serviceName);
  }
}
```

---

## Docker Compose

**Файл:** `infra/docker-compose.dev.yml`

Добавьте в существующий файл:

```yaml
services:
  # ==================== API GATEWAY ====================
  api-gateway:
    build:
      context: ../services/api-gateway
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - ../services/api-gateway:/app
      - /app/node_modules
    environment:
      - NODE_ENV=docker
      - JWT_SECRET=secretKey
      - USER_SERVICE_URL=http://app-dev:5000
      - PRODUCT_SERVICE_URL=http://product-app-dev:5001
      - ORDER_SERVICE_URL=http://order-app-dev:5002
      - CART_SERVICE_URL=http://cart-app-dev:5003
    depends_on:
      - app-dev
      - product-app-dev
      - order-app-dev
      - cart-app-dev
    command: sh -c "npm install && npm run start:dev"
    restart: always

  # ... остальные сервисы остаются без изменений
```

---

## План внедрения

### Этап 1: Базовая настройка (1-2 часа)

1. **Создать проект**

   ```bash
   cd services
   nest new api-gateway
   cd api-gateway
   npm install @nestjs/axios @nestjs/jwt @nestjs/passport passport passport-jwt
   ```

2. **Скопировать файлы из этого README**

   - `src/auth/` - модуль аутентификации
   - `src/proxy/` - модуль проксирования
   - `src/app.module.ts`
   - `src/main.ts`
   - `.development.env`
   - `Dockerfile.dev`

3. **Запустить локально**

   ```bash
   npm run start:dev
   ```

4. **Протестировать**

   ```bash
   # Регистрация через gateway
   curl -X POST http://localhost:3000/api/auth/registration \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password123"}'

   # Получить товары через gateway
   curl http://localhost:3000/api/products
   ```

### Этап 2: Docker интеграция (30 минут)

5. **Добавить в docker-compose.dev.yml**
6. **Запустить всю инфраструктуру**
   ```bash
   cd infra
   docker-compose -f docker-compose.dev.yml up -d
   ```

### Этап 3: Продвинутые фичи (по желанию)

7. **Rate Limiting** - уже включен
8. **Логирование** - добавить `LoggingInterceptor`
9. **Dashboard агрегация** - добавить `DashboardController`
10. **Circuit Breaker** - для отказоустойчивости

---

## Тестирование

### 1. Публичные эндпоинты (без токена)

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/registration \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Логин
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Просмотр товаров
curl http://localhost:3000/api/products
```

### 2. Защищенные эндпоинты (с токеном)

```bash
# Сохраните токен из ответа логина
TOKEN="your_jwt_token_here"

# Получить корзину
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# Добавить товар в корзину
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'

# Получить заказы
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Проверка Rate Limiting

```bash
# Отправьте 101 запрос за минуту - последний должен вернуть 429
for i in {1..101}; do
  curl http://localhost:3000/api/products
done
```

---

## Преимущества API Gateway

### ✅ Для фронтенда

- Один URL для всех запросов
- Не нужно знать о внутренней структуре
- Упрощенная аутентификация
- Единый CORS policy

### ✅ Для микросервисов

- Централизованная аутентификация
- Микросервисы не знают о JWT
- Получают userId через заголовки
- Могут быть приватными (без внешнего доступа)

### ✅ Для DevOps

- Единая точка мониторинга
- Централизованное логирование
- Rate limiting в одном месте
- Легко добавлять новые сервисы

### ✅ Для безопасности

- Скрывает внутреннюю архитектуру
- Централизованная валидация
- DDoS защита через rate limiting
- Единая точка для SSL/TLS

---

## Когда НЕ нужен API Gateway

- ❌ Микросервисы общаются только между собой (без внешних клиентов)
- ❌ Очень простой проект с 1-2 сервисами
- ❌ Все сервисы в одной приватной сети без внешнего доступа

## Когда НУЖЕН API Gateway (ваш случай)

- ✅ Есть фронтенд приложение
- ✅ Несколько микросервисов (4+)
- ✅ Нужна централизованная аутентификация
- ✅ Нужно агрегировать данные
- ✅ Нужен единый CORS policy

---

## Полезные ссылки

- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [API Gateway Pattern](https://microservices.io/patterns/apigateway.html)
- [JWT Authentication](https://jwt.io/)
- [Rate Limiting](https://docs.nestjs.com/security/rate-limiting)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## Следующие шаги

После внедрения API Gateway можно добавить:

1. **gRPC интеграция** - для быстрой коммуникации между сервисами
2. **GraphQL Gateway** - если нужен более гибкий API
3. **WebSocket Gateway** - для real-time функций
4. **Service Mesh** (Istio/Linkerd) - для продакшена
5. **API Documentation** (Swagger) - автогенерация документации

---

**Готово!** 🚀 Теперь у вас есть полное руководство по внедрению API Gateway в ваш проект.
