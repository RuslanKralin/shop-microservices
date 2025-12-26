import { IsString, IsNumber, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3, { message: 'Название должно быть не короче 3 символов' })
  name: string;

  @IsNumber()
  @Min(0.01, { message: 'Цена должна быть больше 0' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Количество не может быть отрицательным' })
  stock: number;
}
