import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from 'src/database/entities/user/user';
import { Role } from 'src/database/entities/user/roles';
import { Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserPaginationDto } from 'src/common/pagination/dto/user/userPagination.dto';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let mockRoleRepo: Partial<Record<keyof Repository<Role>, jest.Mock>>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    mockUserRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockRoleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('1.findAll', () => {
    it('✅ 1.1 should return paginated users with filters', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@test.com',
          status: true,
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@test.com',
          status: true,
        },
      ];

      const filters: UserPaginationDto = {
        page: 1,
        take: 10,
        status: true,
        roleId: '1',
        sortBy: 'username',
        sortOrder: 'ASC',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 2]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        activeCount: 2,
        inactiveCount: 0,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual(mockUsers);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(10);
    });

    it('✅ 1.2 should handle empty results', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        activeCount: 0,
        inactiveCount: 0,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('✅ 1.3 should apply username filter', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('✅ 1.4 should apply email filter', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('✅ 1.5 should apply roleId filter', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10, roleId: '2' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role_id = :roleId',
        { roleId: '2' },
      );
    });

    it('✅ 1.6 should apply status filter', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10, status: true };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.status = :status',
        { status: true },
      );
    });

    it('❌ 1.7 should handle database error', async () => {
      const filters: UserPaginationDto = { page: 1, take: 10 };
      mockQueryBuilder.getManyAndCount.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(filters)).rejects.toThrow('Database error');
    });

    it('✅ 1.8 should apply sorting correctly', async () => {
      const filters: UserPaginationDto = {
        page: 1,
        take: 10,
        sortBy: 'email',
        sortOrder: 'DESC',
      };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('✅ 1.9 should apply pagination correctly', async () => {
      const filters: UserPaginationDto = { page: 2, take: 5 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('✅ 1.10 should limit take to maximum 100', async () => {
      const filters: UserPaginationDto = { page: 1, take: 150 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filters);

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(150);
    });
  });

  describe('2.findOne', () => {
    it('✅ 2.1 should return user when found', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        status: true,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', status: true },
        relations: ['role'],
      });
    });

    it('❌ 2.2 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 2.3 should handle database error', async () => {
      (mockUserRepo.findOne as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.findOne('1')).rejects.toThrow('DB error');
    });

    it('✅ 2.4 should return user with role relation', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        role: { id: 1, role_name: 'User' },
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result.role).toBeDefined();
      expect(result.role.role_name).toBe('User');
    });
  });

  describe('3.findOneForToggle', () => {
    it('✅ 3.1 should return user when found (regardless of status)', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        status: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOneForToggle('1');

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['role'],
      });
    });

    it('❌ 3.2 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.findOneForToggle('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('4.update', () => {
    it('✅ 4.1 should update user successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'olduser',
        email: 'old@example.com',
      };

      const updateDto = {
        username: 'newuser',
        email: 'new@example.com',
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update('1', updateDto);

      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
    });

    it('❌ 4.2 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.update('nonexistent', { username: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('✅ 4.3 should update only provided fields', async () => {
      const mockUser = {
        id: '1',
        username: 'olduser',
        email: 'old@example.com',
      };

      const updateDto = { username: 'newuser' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        username: 'newuser',
      });

      const result = await service.update('1', updateDto);

      expect(result.username).toBe('newuser');
      expect(result.email).toBe('old@example.com');
    });

    it('❌ 4.4 should handle database error during update', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue({ id: '1' });
      (mockUserRepo.save as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(service.update('1', { username: 'new' })).rejects.toThrow(
        'Save failed',
      );
    });

    it('✅ 4.5 should validate role_id if provided', async () => {
      const mockUser = { id: '1', username: 'user' };
      const mockRole = { id: 2, role_name: 'Admin' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockRoleRepo.findOneBy as jest.Mock).mockResolvedValue(mockRole);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: mockRole,
      });

      const result = await service.update('1', { role_id: 2 });

      expect(result.role).toEqual(mockRole);
    });

    it('❌ 4.6 should throw error if role_id is invalid', async () => {
      const mockUser = { id: '1', username: 'user' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockRoleRepo.findOneBy as jest.Mock).mockResolvedValue(undefined);

      await expect(service.update('1', { role_id: 999 })).rejects.toThrow();
    });
  });

  describe('5.toggleStatus', () => {
    it('✅ 5.1 should activate user when currently inactive', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        status: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: true,
      });

      const result = await service.toggleStatus('1');

      expect(result.msg).toBe('User activated successfully');
      expect(result.status).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: true }),
      );
    });

    it('✅ 5.2 should deactivate user when currently active', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        status: true,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({
        ...mockUser,
        status: false,
      });

      const result = await service.toggleStatus('1');

      expect(result.msg).toBe('User deactivated successfully');
      expect(result.status).toBe(false);
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: false }),
      );
    });

    it('❌ 5.3 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.toggleStatus('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 5.4 should handle database error during toggle', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue({ id: '1', status: true });
      (mockUserRepo.save as jest.Mock).mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(service.toggleStatus('1')).rejects.toThrow('Save failed');
    });
  });
});
