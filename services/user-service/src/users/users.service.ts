import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user-dto';
import { RolesService } from '../roles/roles.service';
import { Role } from '../roles/roles.model';
import { AddRoleDto } from './dto/add-role.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { RedisService } from 'src/redis/redis.service';
import * as bcrypt from 'bcryptjs';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepo: typeof User,
    private rolesService: RolesService,
    private redisService: RedisService,
  ) {}

  async createUser(dto: CreateUserDto) {
    // Всегда создаём пользователя с ролью User при регистрации
    const roleValue = 'User';

    const role = await this.rolesService.getRoleByValue(roleValue);
    if (!role) {
      throw new BadRequestException(`Роль ${roleValue} не найдена`);
    }

    const candidate = await User.findOne({
      where: { email: dto.email },
    });

    if (candidate) {
      console.log('Пользователь с таким email уже существует:', dto.email);
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    // Хэшируем пароль перед сохранением пользователя
    const hashPassword = await bcrypt.hash(dto.password, 5);
    dto.password = hashPassword;

    const user = await this.userRepo.create(dto);

    const userPlain = user.get({ plain: true });

    await user.$set('roles', role.id);
    user.roles = [role];

    const userWithRoles = await this.userRepo.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'value', 'description'],
        },
      ],
    });

    if (!userWithRoles) {
      throw new BadRequestException('Ошибка при создании пользователя');
    }

    // Получаем чистый объект с ролями
    const result = userWithRoles.get({ plain: true });

    return result;
  }

  async getAllUsers() {
    const cachedUsers = await this.redisService.get('users');
    if (cachedUsers) {
      console.log('✅✅✅ Получение данных из кэша');
      return cachedUsers;
    }

    const users = await this.userRepo.findAll({
      include: { all: true },
    });
    await this.redisService.set('users', users);
    return users;
  }

  async getUserByEmail(email: string) {
    console.log('🔍 Поиск пользователя по email:', email);

    const user = await this.userRepo.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] }, // Убираем лишние поля из связи
          attributes: ['id', 'value', 'description'],
        },
      ],
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      return null;
    }

    // Преобразуем в простой объект
    const userPlain = user.get({ plain: true });

    console.log('✅ Найден пользователь:', {
      id: userPlain.id,
      email: userPlain.email,
      roles: userPlain.roles || [],
    });

    return userPlain;
  }

  async addRole(dto: AddRoleDto) {
    const user = await this.userRepo.findByPk(dto.userId);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    const role = await this.rolesService.getRoleByValue(dto.value);
    if (!role) {
      throw new BadRequestException('Роль не найдена');
    }
    await user.$add('role', role.id);
    return user;
  }

  async ban(dto: BanUserDto) {
    const user = await this.userRepo.findByPk(dto.userId);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    user.banned = true;
    user.banReason = dto.reason;
    await user.save();
    await user.reload();
    console.log('✅ Пользователь забанен:', {
      id: user.id,
      email: user.email,
      banned: user.banned,
      banReason: user.banReason,
    });
    return user;
  }
}
