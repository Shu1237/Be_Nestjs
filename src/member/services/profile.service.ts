import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../typeorm/entities/user/user';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Role } from 'src/enum/roles.enum';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string, userRole: Role): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
      relations: userRole === Role.USER ? ['member'] : ['role'],
      select: {
        id: true,
        username: true,
        email: true,
        address: true,
        date_of_birth: true,
        gender: true,
        identity_card: true,
        image: true,
        phone_number: true,
        ...(userRole === Role.USER
          ? {
              member: {
                score: true,
              },
            }
          : {
              role: {
                role_id: true,
                role_name: true,
              },
            }),
      },
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_deleted: false },
      relations: ['role', 'member'],
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, ...personalInfo } = updateUserDto;
    Object.assign(user, personalInfo);

    return await this.userRepository.save(user);
  }
}
