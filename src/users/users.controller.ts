import { Controller, Post, UsePipes, Body, Param, HttpCode, Req, ForbiddenException, ValidationPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { HashPasswordPipe } from '../pipes/hash-password.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';
import { RoleMappingsService } from '../role-mappings/role-mappings.service';
import { RoleMapping } from '../role-mappings/interfaces/role-mapping.interface';
import { AuthService } from 'auth/auth.service';
import { Validator } from 'class-validator';
import { CreateRoleMappingDto } from 'role-mappings/dto/create-role-mapping.dto';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
const validator = new Validator();

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly roleMappingsService: RoleMappingsService,
    private readonly authService: AuthService,
  ) { }

  @Post()
  @UsePipes(new HashPasswordPipe(), new ValidationPipe({ transform: true }))
  create(@Body() createUserDto: CreateUserDto, @Req() req): Promise<User> {
    if (!this.authService.validateCreateUser(req, createUserDto))
      throw new ForbiddenException('You can not assign a role to a user');
    else
      return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() createUserDto: CreateUserDto): Promise<string> {
    return this.usersService.login(createUserDto);
  }

  @Post(':userId/roles/:roleId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  assignRole(@Param() createRoleMappingDto: CreateRoleMappingDto): Promise<RoleMapping> {
    return this.roleMappingsService.create(createRoleMappingDto);
  }
}
