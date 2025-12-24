import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

//Guard (охранник) - проверяет JWT токен перед каждым запросом. Если токен валидный - добавляет x-user-id в заголовки для микросервисов.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

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
