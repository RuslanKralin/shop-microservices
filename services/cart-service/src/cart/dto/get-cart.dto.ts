import { IsInt } from 'class-validator';

export class GetCartDto {
  @IsInt()
  userId: number;
}
