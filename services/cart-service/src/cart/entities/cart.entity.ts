import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItemEntity } from './cart-item.entity';

@Entity({ name: 'carts' })
@Index(['userId'], { unique: true })
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  //это не “FK на таблицу users”, а внешний идентификатор (reference id), то есть просто число, которое равно id пользователя в user-service. обычно получаю из Gateway
  //   Клиент делает запрос в Gateway с токеном.
  // Gateway/Guard валидирует токен и прокидывает в cart-service userId (например, в req.user или в заголовке).
  // Тогда POST /cart/items не должен принимать userId в body, чтобы нельзя было “подложить” чужой id.

  @Column({ name: 'user_id' })
  userId: number;

  @OneToMany((): typeof CartItemEntity => CartItemEntity, (item) => item.cart, {
    cascade: true,
  })
  items: CartItemEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// Откуда cart-service должен брать userId
// Есть 2 стандартных варианта:

// Вариант A (правильнее): userId берётся из JWT/сессии (не из тела запроса)
// Клиент делает запрос в Gateway с токеном.
// Gateway/Guard валидирует токен и прокидывает в cart-service userId (например, в req.user или в заголовке).
// Тогда POST /cart/items не должен принимать userId в body, чтобы нельзя было “подложить” чужой id.
// Сейчас у нас DTO принимает userId в body — это упрощение для старта, но для реальной безопасности лучше переделать.

// Вариант B: cart-service сам синхронно проверяет пользователя через user-service
// Например, перед созданием корзины:

// cart-service делает HTTP/gRPC запрос в user-service: “есть ли такой userId?”
// Минусы:
// лишняя зависимость и задержка,
// потенциальные падения из-за недоступности user-service,
// всё равно это не FK, а проверка на уровне приложения.
// На практике часто не делают такую проверку на каждый add-to-cart, а доверяют auth-слою.

// Нужно ли вообще проверять, что пользователь существует?
// Часто нет (или “лениво”), потому что:

// если запрос дошёл до cart-service с валидным токеном, значит пользователь уже существует,
// а если пользователь удалён — это решают событиями (см. ниже).
// Как жить с удалением пользователя / консистентностью
// Типовые подходы:

// Event-driven: user-service публикует событие UserDeleted, cart-service слушает и удаляет корзину пользователя.
// Compensation: если userId “невалиден”, корзина просто становится “мусорной” и чистится джобой.
// Синхронная валидация (вариант B) — реже.
