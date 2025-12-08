import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles') // базовый путь для всех методов контроллера
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Get(':value')
  getRoleByValue(@Param('value') value: string) {
    return this.rolesService.getRoleByValue(value);
  }

  @Get()
  getAllRoles() {
    return this.rolesService.getAllRoles();
  }
}
