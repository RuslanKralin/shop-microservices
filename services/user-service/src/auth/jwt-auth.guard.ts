import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const request = context.switchToHttp().getRequest(); // Получаем запрос
      const authHeader = request.headers.authorization; // Получаем заголовок авторизации
      const bearer = authHeader.split(' ')[0]; // Получаем Bearer
      const token = authHeader.split(' ')[1]; // Получаем токен
      if (bearer !== 'Bearer' || !token) {
        // Проверяем, что заголовок авторизации содержит Bearer и токен
        throw new UnauthorizedException({
          message: 'Пользователь не авторизован',
        });
      }
      const user = this.jwtService.verify(token); // Проверяем токен, если токен не валиден, выбрасываем ошибку
      request.user = user;
      return true; // Если токен валиден, возвращаем true
    } catch (e) {
      throw new UnauthorizedException({
        message: 'Пользователь не авторизован',
      });
    }
  }
}
