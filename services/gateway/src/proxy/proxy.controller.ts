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
  async proxyRegistration(@Req() req: Request, @Res() res: Response) {
    // Сохраняем оригинальный URL
    const originalUrl = req.url;
    // Меняем URL на тот, который ожидает сервис пользователей
    req.url = '/api/auth/registration';

    try {
      const result = await this.proxyService.forward(req, res, 'USER_SERVICE');
      return result;
    } finally {
      // Восстанавливаем оригинальный URL
      req.url = originalUrl;
    }
  }

  @Public()
  @All('auth/login')
  async proxyLogin(@Req() req: Request, @Res() res: Response) {
    // Сохраняем оригинальный URL
    const originalUrl = req.url;
    // Меняем URL на тот, который ожидает сервис пользователей
    req.url = '/api/auth/login';

    try {
      const result = await this.proxyService.forward(req, res, 'USER_SERVICE');
      return result;
    } finally {
      // Восстанавливаем оригинальный URL
      req.url = originalUrl;
    }
  }

  @Public()
  @All('products')
  async proxyProductsList(@Req() req: Request, @Res() res: Response) {
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

  @All('users')
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'USER_SERVICE');
  }

  @All('users/*')
  async proxyUsersWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'USER_SERVICE');
  }

  @All('cart')
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'CART_SERVICE');
  }

  @All('cart/*')
  async proxyCartWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'CART_SERVICE');
  }

  @All('orders')
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'ORDER_SERVICE');
  }

  @All('orders/*')
  async proxyOrdersWildcard(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'ORDER_SERVICE');
  }
}
