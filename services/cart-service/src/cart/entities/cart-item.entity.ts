import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity({ name: 'cart_items' })
@Index(['cartId', 'productId'], { unique: true })
@Check('"quantity" >= 1')
export class CartItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cart_id' })
  cartId: number;

  @ManyToOne(
    (): typeof CartEntity => CartEntity,
    (cart: CartEntity) => cart.items,
    {
      onDelete: 'CASCADE',
    },
  )
  cart: CartEntity;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'int' })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
