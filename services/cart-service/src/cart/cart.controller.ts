import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import { GetCartDto } from './dto/get-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UpdateCartItemQuantityDto } from './dto/update-cart-item-quantity.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

  @Post('items')
  addItem(@Body() dto: AddCartItemDto) {
    return this.cartService.addItem(dto.userId, dto.productId, dto.quantity);
  }

  @Post('get')
  getCart(@Body() dto: GetCartDto) {
    return this.cartService.getCart(dto.userId);
  }

  @Patch('items/quantity')
  updateItemQuantity(@Body() dto: UpdateCartItemQuantityDto) {
    return this.cartService.updateItemQuantity(
      dto.userId,
      dto.productId,
      dto.quantity,
    );
  }

  @Delete('items/:userId/:productId')
  removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(+userId, +productId);
  }

  @Delete('clear/:userId')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(+userId);
  }

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }
}
