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
    // Читаем URL микросервисов из .env
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
    // 1. Находим URL микросервиса по имени
    const serviceUrl = this.serviceUrls[serviceName]; // например, 'http://localhost:5001'

    // 2. Если микросервис не найден - ошибка
    if (!serviceUrl) {
      console.error(`❌ [PROXY] Сервис не найден: ${serviceName}`);
      throw new HttpException('Service not found', 500);
    }

    // 3. Формируем полный URL для запроса
    // Например: "http://localhost:5001/api/products/123"
    const targetUrl = `${serviceUrl}${req.url}`;

    console.log(`🔀 [PROXY] ${req.method} ${req.url} → ${targetUrl}`);

    try {
      // Подготавливаем заголовки
      const headers = { ...req.headers };
      delete headers['host'];
      delete headers['content-length']; // Удаляем content-length, axios сам его установит

      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method,
          url: targetUrl,
          data: req.body,
          headers: headers,
          timeout: 30000, // Увеличиваем таймаут до 30 секунд
          validateStatus: () => true, // Не бросаем ошибку на любой статус
          maxRedirects: 5,
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
