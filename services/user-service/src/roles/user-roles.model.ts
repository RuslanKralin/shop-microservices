import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Role } from './roles.model';
import { User } from 'src/users/user.model';

@Table({
  tableName: 'user-roles',
  createdAt: false,
  updatedAt: false,
})
export class UserRoles extends Model<UserRoles> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;
  @ForeignKey(() => Role) // связь с таблицей Role
  @Column({
    type: DataType.INTEGER,
  })
  roleId: number;

  @ForeignKey(() => User) // связь с таблицей User
  @Column({
    type: DataType.INTEGER,
  })
  userId: number;
}
