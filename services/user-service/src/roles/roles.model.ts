import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Model,
  Column,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from 'src/users/user.model';
import { UserRoles } from './user-roles.model';

interface RoleCreationProps {
  value: string;
  description: string;
}

@Table({
  tableName: 'roles',
})
export class Role extends Model<Role, RoleCreationProps> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ApiProperty({ example: 'ADMIN', description: 'Уникальное значение роли' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  value: string;

  @ApiProperty({ example: 'Администратор', description: 'Описание роли' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @BelongsToMany(() => User, () => UserRoles)
  users: User[];
}
