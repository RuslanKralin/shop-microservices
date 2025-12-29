import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'Уникальное значение роли' })
  @IsString()
  readonly value: string;
  @ApiProperty({ example: 'Администратор', description: 'Описание роли' })
  @IsString()
  readonly description: string;
}
