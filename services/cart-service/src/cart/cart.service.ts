import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from './entities/cart.entity';
import { CartItemEntity } from './entities/cart-item.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepository: Repository<CartItemEntity>,
  ) {}

  create(createCartDto: CreateCartDto) {
    return createCartDto;
  }

  async findAll(): Promise<CartEntity[]> {
    return this.cartRepository.find({ relations: { items: true } });
  }

  async findOne(id: number): Promise<CartEntity> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!cart) {
      throw new NotFoundException(`Cart with id=${id} not found`);
    }
    return cart;
  }

  update(id: number, updateCartDto: UpdateCartDto) {
    return { id, ...updateCartDto };
  }

  async remove(id: number): Promise<void> {
    await this.cartRepository.delete(id);
  }

  private async findOrCreateCart(userId: number): Promise<CartEntity> {
    const existing = await this.cartRepository.findOne({ where: { userId } });
    if (existing) return existing;

    const cart = this.cartRepository.create({ userId });
    return this.cartRepository.save(cart);
  }

  // ensureCart — идемпотентный метод: можно вызывать сколько угодно раз.
  // Удобен для Kafka-событий (потому что Kafka гарантирует доставку "как минимум один раз",
  // то есть событие может прийти повторно).
  async ensureCart(userId: number): Promise<CartEntity> {
    console.log('🔍 [CartService] Проверяю корзину для userId:', userId);
    const cart = await this.findOrCreateCart(userId);
    console.log('✅ [CartService] Корзина готова:', { id: cart.id, userId: cart.userId });
    return cart;
  }

  async getCart(userId: number): Promise<CartEntity> {
    const cart = await this.findOrCreateCart(userId);
    return this.cartRepository.findOneOrFail({
      where: { id: cart.id },
      relations: { items: true },
    });
  }

  async addItem(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartEntity> {
    if (quantity < 1) {
      throw new BadRequestException('quantity must be >= 1');
    }

    const cart = await this.findOrCreateCart(userId);

    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const item = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
      });
      await this.cartItemRepository.save(item);
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartEntity> {
    if (quantity < 1) {
      throw new BadRequestException('quantity must be >= 1');
    }

    const cart = await this.findOrCreateCart(userId);
    const item = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });
    if (!item) {
      throw new NotFoundException(
        `Cart item not found for userId=${userId}, productId=${productId}`,
      );
    }

    item.quantity = quantity;
    await this.cartItemRepository.save(item);
    return this.getCart(userId);
  }

  async removeItem(userId: number, productId: number): Promise<CartEntity> {
    const cart = await this.findOrCreateCart(userId);
    const item = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });
    if (!item) {
      return this.getCart(userId);
    }

    await this.cartItemRepository.delete({ id: item.id });
    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<CartEntity> {
    const cart = await this.findOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
    return this.getCart(userId);
  }
}
