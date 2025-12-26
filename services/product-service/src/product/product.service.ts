import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    return this.productRepository.find();
  }

  async create(createProductDto: CreateProductDto) {
    try {
      return await this.productRepository.save(createProductDto);
    } catch (error) {
      if (error.code === '23505') {
        // Ошибка уникальности
        throw new BadRequestException('Товар с таким именем уже существует');
      }
      if (error.code === '22P02') {
        // Ошибка приведения типов
        throw new BadRequestException('Неверный формат данных');
      }
      throw error;
    }
  }

  async update(
    id: number,
    productDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const existing = await this.productRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with id=${id} not found`);
    }

    const product = this.productRepository.merge(existing, productDto);
    return this.productRepository.save(product);
  }

  async delete(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }

  async findById(id: number): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id=${id} not found`);
    }
    return product;
  }

  async checkAvailability(
    productId: number,
    quantity: number,
  ): Promise<{ available: boolean; error?: string; product?: ProductEntity }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return { available: false, error: 'Product not found' };
    }

    if (product.stock < quantity) {
      return {
        available: false,
        error: `Not enough stock. Available: ${product.stock}, requested: ${quantity}`,
      };
    }

    return { available: true, product };
  }

  async reserveStock(productId: number, quantity: number): Promise<void> {
    const product = await this.findById(productId);

    if (product.stock < quantity) {
      throw new Error(
        `Not enough stock for product ${productId}. Available: ${product.stock}, requested: ${quantity}`,
      );
    }

    product.stock -= quantity;
    await this.productRepository.save(product);
  }

  async releaseStock(productId: number, quantity: number): Promise<void> {
    const product = await this.findById(productId);
    product.stock += quantity;
    await this.productRepository.save(product);
  }
}
