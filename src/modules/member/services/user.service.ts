import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user/user';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

import { BadRequestException } from '@nestjs/common';

import { UserPaginationDto } from 'src/common/pagination/dto/user/userPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { userFieldMapping } from 'src/common/pagination/fillters/user-filed-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
import { Role as RoleEntity } from '../../../database/entities/user/roles';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
  ) {}

  async findAll(filters: UserPaginationDto) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    applyCommonFilters(qb, filters, userFieldMapping);

    const allowedFields = [
      'user.username',
      'user.email',
      'user.status',
      'role.name',
    ];

    applySorting(
      qb,
      filters.sortBy,
      filters.sortOrder,
      allowedFields,
      'user.username',
    );

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [users, total] = await qb.getManyAndCount();
    const counts = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `SUM(CASE WHEN user.status = true THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN user.status = false THEN 1 ELSE 0 END) AS inactiveCount`,
      ])
      .getRawOne();
    const accountActivity = Number(counts.activeCount) || 0;
    const accountInactivity = Number(counts.inactiveCount) || 0;
    return buildPaginationResponse(users, {
      total,
      page: filters.page,
      take: filters.take,
      accountActivity,
      accountInactivity,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, status: true },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found or is inactive`,
      );
    }
    return user;
  }

  async findOneForToggle(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneForToggle(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.role_id !== undefined) {
      const role = await this.roleRepository.findOneBy({
        role_id: updateUserDto.role_id,
      });
      if (!role) {
        throw new BadRequestException(
          `Role with ID ${updateUserDto.role_id} not found`,
        );
      }
      user.role = role;
    }
    Object.assign(user, { ...updateUserDto, role_id: undefined });
    return await this.userRepository.save(user);
  }

  async toggleStatus(id: string): Promise<{ msg: string; status: boolean }> {
    const user = await this.findOneForToggle(id);

    user.status = !user.status;
    await this.userRepository.save(user);

    const action = user.status ? 'activated' : 'deactivated';
    return {
      msg: `User ${action} successfully`,
      status: user.status,
    };
  }

  async toggleStatus(id: string): Promise<{ msg: string; status: boolean }> {
    const user = await this.findOneForToggle(id);

    user.status = !user.status;
    await this.userRepository.save(user);

    const action = user.status ? 'activated' : 'deactivated';
    return {
      msg: `User ${action} successfully`,
      status: user.status,
    };
  }

  // async changeStatus(id: string): Promise<User> {
  //   const user = await this.findOne(id);
  //   user.status = !user.status;
  //   return await this.userRepository.save(user);
  // }

  // async softDelete(id: string): Promise<void> {
  //   const user = await this.findOne(id);
  //   user.status = false;
  //   await this.userRepository.save(user);
  // }
  // async softDelete(id: string): Promise<void> {
  //   const user = await this.findOne(id);
  //   user.status = false;
  //   await this.userRepository.save(user);
  // }

  // async restore(id: string): Promise<{ msg: string }> {
  //   const user = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ['role'],
  //   });
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   if (!user.status) {
  //     throw new BadRequestException(`User with ID ${id} is not soft-deleted`);
  //   }
  //   user.status = true;
  //   await this.userRepository.save(user);
  //   return { msg: 'User restored successfully' };
  // }
  // async restore(id: string): Promise<{ msg: string }> {
  //   const user = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ['role'],
  //   });
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   if (!user.status) {
  //     throw new BadRequestException(`User with ID ${id} is not soft-deleted`);
  //   }
  //   user.status = true;
  //   await this.userRepository.save(user);
  //   return { msg: 'User restored successfully' };
  // }
}