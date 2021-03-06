import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './interfaces/user.interface';
import { RoleMapping } from '../role-mappings/interfaces/role-mapping.interface';
import { Role } from '../roles/interfaces/role.interface';
import { AccessToken } from '../auth/interfaces/user-access-token.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleMappingDto } from '../role-mappings/dto/create-role-mapping.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as uuidv4 from 'uuid/v4';
import { ResponseToken } from '../auth/interfaces/response-token.interface';
import { FindUserDto } from './dto/find-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('RoleMapping') private readonly roleMappingModel: Model<RoleMapping>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('AccessToken') private readonly accessTokenModel: Model<AccessToken>,
  ) { }

  async find(findUserDto: FindUserDto): Promise<User[]> {
    const users = await this.userModel.find(findUserDto);
    return users;
  }

  async findById(findUserDto: FindUserDto): Promise<User> {
    return await this.userModel.findById(findUserDto._id).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const foundUser = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });
    if (foundUser) throw new ConflictException('Email or username already in use');
    const createdUser = new this.userModel(createUserDto);
    const roleQuery = createUserDto.roles ? (createUserDto.roles.indexOf('user') > -1 ?
      createUserDto.roles.map(name => ({ name })) :
      createUserDto.roles.map(name => ({ name })).concat({ name: 'user' })) :
      [{ name: 'user' }];
    const roles = await this.roleModel.find({ $or: roleQuery }).exec();
    if (roles.length < roleQuery.length) throw new NotFoundException('Role does not exist');
    const user = await createdUser.save();
    await roles.map(async role => {
      const createRoleMappingDto = new CreateRoleMappingDto(user._id, role._id);
      const createdRoleMapping = new this.roleMappingModel(createRoleMappingDto);
      return await createdRoleMapping.save();
    });
    const { password, ...rest } = user.toJSON();
    rest.roles = createUserDto.roles;
    return rest;
  }

  async login(loginUserDto: LoginUserDto, roles?: string[]): Promise<ResponseToken> {
    const user: User = await this.userModel.findOne({
      $or: [
        { username: loginUserDto.username },
        { email: loginUserDto.email },
      ],
    }).exec();
    if (!user) throw new BadRequestException();
    if (!await bcrypt.compare(loginUserDto.password, user.password))
      throw new BadRequestException();
    const userRoles = await this.roleMappingModel.find({ userId: user._id }).populate('roleId', '-_id name').exec();
    const parsedRoles = userRoles.map(role => {
      return role.roleId.name;
    });
    const token = jwt.sign({
      _id: user._id,
      username: user.username,
      roles: parsedRoles,
    }, process.env.SECRET, { expiresIn: Number(process.env.ACCESS_TOKEN_EXP) });
    const refreshToken = jwt.sign({
      _id: user._id,
      username: user.username,
      roles: parsedRoles,
    }, process.env.REFRESH_SECRET, { expiresIn: Number(process.env.REFRESH_TOKEN_EXP) });
    const responseToken = {
      access_token: token,
      expires_in: Number(process.env.ACCESS_TOKEN_EXP),
      token_type: 'Bearer',
      refresh_token: refreshToken,
    };
    return responseToken;
  }
}
