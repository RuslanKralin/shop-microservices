import { Injectable } from '@nestjs/common';
import { Role } from './roles.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role) private roleRepo: typeof Role) {} // связь с таблицей Role
  async createRole(dto: CreateRoleDto) {
    try {
      const role = await this.roleRepo.create(dto);
      return role;
    } catch (error) {
      throw error;
    }
  }

  async getRoleByValue(value: string) {
    try {
      const role = await this.roleRepo.findOne({ where: { value } });
      return role;
    } catch (error) {
      throw error;
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.roleRepo.findAll();
      return roles;
    } catch (error) {
      throw error;
    }
  }
}
