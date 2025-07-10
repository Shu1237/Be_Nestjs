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


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async findAll(filters: UserPaginationDto) {
    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.is_deleted = :isDeleted', { isDeleted: false });

    applyCommonFilters(qb, filters, userFieldMapping);

    const allowedFields = [
      'user.username',
      'user.email',
      'user.status',
      'role.name',
    ];

    applySorting(qb, filters.sortBy, filters.sortOrder, allowedFields, 'user.username');

    applyPagination(qb, {
      page: filters.page,
      take: filters.take,
    });

    const [users, total] = await qb.getManyAndCount();

    return buildPaginationResponse(users, {
      total,
      page: filters.page,
      take: filters.take,
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  // async changeStatus(id: string): Promise<User> {
  //   const user = await this.findOne(id);
  //   user.status = !user.status;
  //   return await this.userRepository.save(user);
  // }

  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.is_deleted = true;
    await this.userRepository.save(user);
  }

  async restore(id: string): Promise<{ msg: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (!user.is_deleted) {
      throw new BadRequestException(
        `User with ID ${id} is not soft-deleted`,
      );
    }
    user.is_deleted = false;
    await this.userRepository.save(user);
    return { msg: 'User restored successfully' };
  }
}
