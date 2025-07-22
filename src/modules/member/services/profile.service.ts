import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user/user';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { Role } from 'src/common/enums/roles.enum';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Jwt } from 'jsonwebtoken';
import { JWTUserType } from 'src/common/utils/type';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async getProfile(userId: string, userRole: Role): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: true },
      relations: userRole === Role.USER ? [] : ['role'],
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        qr_code:true,
        ...(userRole === Role.USER
          ? {
            score: true,
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
      where: { id: userId, status: true },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }


  async getQrCode(userId: string): Promise<JWTUserType> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: true },
      relations: ['role'],
    })
    // type 
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const payload: JWTUserType = {
      account_id: user.id,
      role_id: user.role.role_id,
      username: user.username,
    }
    return payload;

  }
}
