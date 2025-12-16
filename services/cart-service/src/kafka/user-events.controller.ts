/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CartService } from '../cart/cart.service';
import { Buffer } from 'buffer';

type UserCreatedEvent = {
  type: 'UserCreated';
  userId: number;
  eventId?: string;
  occurredAt?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseKafkaValue(value: unknown): unknown {
  // В NestJS Kafka transport payload.value иногда приходит как Buffer или string.
  // Поэтому делаем универсальный парсер.
  if (value instanceof Buffer) {
    const text = value.toString('utf-8');
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return value;
}

// Это "Kafka consumer-controller".
// В NestJS микросервисные хендлеры часто тоже называют "controller",
// потому что по сути это "контроллер входящих сообщений" (как HTTP controller).
//
// Задача: слушать событие UserCreated и создавать пустую корзину пользователю.
@Controller()
export class UserEventsController {
  constructor(private readonly cartService: CartService) {}

  // В качестве pattern мы используем имя топика.
  // Когда user-service опубликует событие в topic 'users.events',
  // этот метод будет вызван автоматически.
  @EventPattern('users.events')
  async handleUserEvents(@Payload() message: unknown) {
    // В Kafka сообщения могут приходить в разных формах.
    // Если producer отправляет { key, value }, то полезные данные будут в value.
    // Если producer отправляет просто объект, то он может быть прямо в message.
    const rawValue =
      isRecord(message) && 'value' in message ? message.value : message;
    const payload = parseKafkaValue(rawValue);

    if (!isRecord(payload) || payload.type !== 'UserCreated') {
      // В этом топике могут жить и другие типы событий.
      // Пока обрабатываем только UserCreated.
      return;
    }

    // userId — внешний идентификатор пользователя (reference id) из user-service.
    const event = payload as unknown as UserCreatedEvent;
    const userId = Number(event.userId);
    if (!userId) return;

    // Идемпотентная операция: если корзина уже есть — просто вернёт существующую.
    await this.cartService.ensureCart(userId);
  }
}
