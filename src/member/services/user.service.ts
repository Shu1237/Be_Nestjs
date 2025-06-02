import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../typeorm/entities/user/user';
import { Role } from '../../typeorm/entities/user/roles';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { RoleType } from 'src/typeorm/entities/user/roles';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { role_id, ...userData } = createUserDto;
      const role = role_id
        ? await this.roleRepository.findOne({ where: { role_id } })
        : await this.roleRepository.findOne({
            where: { role_id: RoleType.MEMBER },
          });
      if (!role) throw new BadRequestException('Role not found');
      const user = this.userRepository.create({ ...userData, role });
      return await this.userRepository.save(user);
    } catch {
      throw new BadRequestException(
        'Unable to create user. Please check your information again.',
      );
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['role'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User with ID not found ${id}`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findOne(id);
    user.password = newPassword;
    await this.userRepository.save(user);
  }

  async changeStatus(id: string, status: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return await this.userRepository.save(user);
  }

  async changeRole(id: string, role_id: RoleType): Promise<User> {
    const user = await this.findOne(id);
    const role = await this.roleRepository.findOne({ where: { role_id } });
    if (!role) throw new BadRequestException('Role not found');
    user.role = role;
    return await this.userRepository.save(user);
  }
}
