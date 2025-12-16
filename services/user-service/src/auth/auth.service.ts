import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/user.model';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import {
  USER_SERVICE_KAFKA_CLIENT,
  USERS_EVENTS_TOPIC,
} from '../kafka/kafka.constants';

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    // Kafka client нужен для публикации событий.
    // Мы публикуем событие "UserCreated" после успешной регистрации.
    @Inject(USER_SERVICE_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  // NestJS Kafka client надо явно подключить.
  // Иначе emit() может не отправить сообщение (особенно при первом вызове).
  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }

  // async login(userDto: CreateUserDto) {
  //   const user = await this.validateUser(userDto);

  //   return this.generateToken(user);
  // }

  async login(userDto: CreateUserDto) {
    try {
      const user = await this.validateUser(userDto);
      const token = await this.generateToken(user);

      return token;
    } catch (error) {
      throw error;
    }
  }

  // private async validateUser(userDto: CreateUserDto) {
  //   const user = await this.usersService.getUserByEmail(userDto.email);
  //   if (!user) {
  //     throw new HttpException(
  //       'Неверный логин или пароль',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  //   const passwordEquals = await bcrypt.compare(
  //     userDto.password,
  //     user.password,
  //   );
  //   if (!passwordEquals) {
  //     throw new UnauthorizedException({ message: 'Неверный логин или пароль' });
  //   }

  //   return user;
  // }
  private async validateUser(userDto: CreateUserDto) {
    try {
      const user = await this.usersService.getUserByEmail(userDto.email);
      if (!user) {
        throw new UnauthorizedException({
          message: 'Некорректный email или пароль',
        });
      }

      const passwordEquals = await bcrypt.compare(
        userDto.password,
        user.password,
      );
      if (!passwordEquals) {
        throw new UnauthorizedException({
          message: 'Некорректный email или пароль',
        });
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // async registration(userDto: CreateUserDto) {
  //   const candidate = await this.usersService.getUserByEmail(userDto.email);
  //   if (candidate) {
  //     throw new HttpException(
  //       'Такой пользователь уже существует',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  //   const hashPassword = await bcrypt.hash(userDto.password, 10);
  //   userDto.password = hashPassword;

  //   const user = await this.usersService.createUser(userDto);
  //   if (!user) {
  //     throw new HttpException('Пользователь не создан', HttpStatus.BAD_REQUEST);
  //   }
  //   return this.generateToken(user);
  // }

  async registration(userDto: CreateUserDto) {
    try {
      // Проверка, существует ли пользователь
      const candidate = await this.usersService.getUserByEmail(userDto.email);
      if (candidate) {
        throw new HttpException(
          'Пользователь с таким email уже существует',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Создание пользователя (хэширование пароля происходит в UsersService)
      const user = await this.usersService.createUser(userDto);

      // Публикуем событие в Kafka.
      // Важно: это событие не должно ломать регистрацию.
      // Если Kafka временно недоступна, регистрацию всё равно можно считать успешной.
      // Поэтому здесь try/catch отдельно (чтобы ошибка Kafka не откатила создание пользователя).
      try {
        const event = {
          type: 'UserCreated',
          userId: user.id,
          eventId: crypto.randomUUID(),
          occurredAt: new Date().toISOString(),
        };

        // emit(topic, payload) — publish в Kafka.
        // Подписчик (cart-service) слушает 'users.events' и создаёт пустую корзину.
        this.kafkaClient.emit(USERS_EVENTS_TOPIC, event);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Kafka emit UserCreated failed:', e);
      }

      return this.generateToken(user);
    } catch (error) {
      throw error;
    }
  }
  private generateToken(user: User) {
    // Проверяем, что email существует
    if (!user.email) {
      console.error('❌ Ошибка: email пользователя отсутствует');
      throw new Error('User email is required');
    }

    const payload = {
      email: user.email,
      id: user.id,
      roles: user.roles
        ? user.roles.map((role: any) => role.value || role)
        : [],
    };

    console.log('🔑 Payload для токена:', JSON.stringify(payload, null, 2));

    try {
      const token = this.jwtService.sign(payload);
      console.log('✅ Токен успешно сгенерирован');
      return { token };
    } catch (error) {
      console.error('❌ Ошибка при генерации токена:', error);
      throw new Error('Ошибка при генерации токена');
    }
  }
}
