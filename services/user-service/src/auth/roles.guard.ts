import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles-auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector, // встроенный класс для получения метаданных
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) {
        // если нет ролей, то возвращаем true
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new HttpException(
          { message: 'Отсутствует заголовок Authorization' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        throw new HttpException(
          { message: 'Неверный формат токена' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      try {
        const user = this.jwtService.verify(token);
        request.user = user;
        console.log('✅ User roles:', user.roles);

        // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
        const hasRequiredRole = user.roles?.some((role) => {
          // Проверяем оба варианта: role как строка и role как объект с полем value
          const roleValue = typeof role === 'string' ? role : role.value;
          return requiredRoles.includes(roleValue);
        });

        if (!hasRequiredRole) {
          console.log(
            'Недостаточно прав. Требуемые роли:',
            requiredRoles,
            'Есть роли:',
            user.roles,
          );
          throw new Error('Недостаточно прав');
        }

        return true;
      } catch (e) {
        console.error('Ошибка при проверке токена:', e);
        throw new HttpException(
          { message: 'Неверный или истекший токен' },
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (e) {
      console.error('Ошибка в RolesGuard:', e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new HttpException(
        { message: 'Ошибка проверки прав доступа' },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
