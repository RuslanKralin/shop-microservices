import { Controller, All, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Public } from '../auth/public.decorator';
import { PinoLoggerService } from 'src/common/logger/logger.service';

@Controller('api')
@UseGuards(JwtAuthGuard) // Применяем guard ко всему контроллеру
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly logger: PinoLoggerService,
  ) {}

  // ==================== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ====================

  @Public()
  @All('auth/registration')
  async proxyRegistration(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/auth/registration',
      method: req.method,
    });
    requestLogger.info('Запрос на регистрацию , ProxyController');
    // Сохраняем оригинальный URL
    const originalUrl = req.url;
    // Меняем URL на тот, который ожидает сервис пользователей
    req.url = '/api/auth/registration';

    try {
      const result = await this.proxyService.forward(req, res, 'USER_SERVICE');
      requestLogger.info('Запрос на регистрацию успешно обработан');
      return result;
    } catch (error) {
      requestLogger.error(
        { error },
        'Ошибка при обработке запроса на регистрацию',
      );
      throw error;
    } finally {
      // Восстанавливаем оригинальный URL
      req.url = originalUrl;
    }
  }

  @Public()
  @All('auth/login')
  async proxyLogin(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/auth/login',
      method: req.method,
    });
    requestLogger.info('Запрос на авторизацию , ProxyController');
    // Сохраняем оригинальный URL
    const originalUrl = req.url;
    // Меняем URL на тот, который ожидает сервис пользователей
    req.url = '/api/auth/login';

    try {
      const result = await this.proxyService.forward(req, res, 'USER_SERVICE');
      requestLogger.info('Запрос на авторизацию успешно обработан');
      return result;
    } catch (error) {
      requestLogger.error(
        { error },
        'Ошибка при обработке запроса на авторизацию',
      );
      throw error;
    } finally {
      // Восстанавливаем оригинальный URL
      req.url = originalUrl;
    }
  }

  @Public()
  @All('products')
  async proxyProductsList(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/products',
      method: req.method,
    });
    requestLogger.info('Запрос на список товаров , ProxyController');
    // Публичный доступ только для GET (просмотр товаров)
    if (req.method === 'GET') {
      return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
    }
    // Для создания/изменения товаров нужна аутентификация
    return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
  }

  @Public()
  @All('products/:id')
  async proxyProductsById(@Req() req: Request, @Res() res: Response) {
    // Публичный доступ только для GET (просмотр одного товара)
    if (req.method === 'GET') {
      return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
    }
    // Для изменения/удаления товара нужна аутентификация
    return this.proxyService.forward(req, res, 'PRODUCT_SERVICE');
  }

  // ==================== ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ ====================

  @All('users*')
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/users',
      method: req.method,
    });

    requestLogger.info('Запрос к пользователям, ProxyController');

    try {
      const result = await this.proxyService.forward(req, res, 'USER_SERVICE');
      requestLogger.info('Запрос к пользователям успешно обработан');
      return result;
    } catch (error) {
      requestLogger.error(
        { error },
        'Ошибка при обработке запроса к пользователям',
      );
      throw error;
    }
  }

  @All('cart*')
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/cart',
      method: req.method,
    });

    requestLogger.info('Запрос к корзине, ProxyController');

    try {
      const result = await this.proxyService.forward(req, res, 'CART_SERVICE');
      requestLogger.info('Запрос к корзине успешно обработан');
      return result;
    } catch (error) {
      requestLogger.error({ error }, 'Ошибка при обработке запроса к корзине');
      throw error;
    }
  }

  @All('orders*')
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    const requestLogger = this.logger.child({
      requestId: req.id,
      endpoint: '/orders',
      method: req.method,
    });

    requestLogger.info('Запрос к заказам, ProxyController');

    try {
      const result = await this.proxyService.forward(req, res, 'ORDER_SERVICE');
      requestLogger.info('Запрос к заказам успешно обработан');
      return result;
    } catch (error) {
      requestLogger.error({ error }, 'Ошибка при обработке запроса к заказам');
      throw error;
    }
  }
}
