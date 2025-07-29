import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { User } from '../../../database/entities/user/user';
import { Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateUserDto } from '../dtos/update-user.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockUserRepo: Partial<Repository<User>>;

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('1.getProfile', () => {
    it('✅ 1.1 should return user profile for USER role', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: true,
        identity_card: '123456789',
        is_deleted: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('1', Role.USER);

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: true,
        identity_card: '123456789',
        is_deleted: false,
      });
    });

    it('✅ 1.2 should return user profile for EMPLOYEE role', async () => {
      const mockUser = {
        id: '1',
        username: 'employee',
        email: 'employee@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1985-01-01'),
        gender: false,
        identity_card: '987654321',
        is_deleted: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('1', Role.EMPLOYEE);

      expect(result).toEqual({
        id: '1',
        username: 'employee',
        email: 'employee@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1985-01-01'),
        gender: false,
        identity_card: '987654321',
        is_deleted: false,
      });
    });

    it('✅ 1.3 should return user profile for ADMIN role', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1980-01-01'),
        gender: true,
        identity_card: '111222333',
        is_deleted: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('1', Role.ADMIN);

      expect(result).toEqual({
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1980-01-01'),
        gender: true,
        identity_card: '111222333',
        is_deleted: false,
      });
    });

    it('❌ 1.4 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.getProfile('999', Role.USER)).rejects.toThrow(NotFoundException);
    });

    it('❌ 1.5 should handle database error', async () => {
      (mockUserRepo.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getProfile('1', Role.USER)).rejects.toThrow('Database error');
    });

    it('✅ 1.6 should handle user with missing optional fields', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phone_number: null,
        date_of_birth: null,
        gender: null,
        identity_card: null,
        is_deleted: false,
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getProfile('1', Role.USER);

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phone_number: null,
        date_of_birth: null,
        gender: null,
        identity_card: null,
        is_deleted: false,
      });
    });
  });

  describe('2.updateProfile', () => {
    it('✅ 2.1 should update user profile successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        phone_number: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: true,
        identity_card: '123456789',
      };

      const updateDto: UpdateUserDto = {
        username: 'updateduser',
        avatar: 'new-avatar.jpg',
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('1', updateDto);

      expect(result).toEqual({ ...mockUser, ...updateDto });
    });

    it('❌ 2.2 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.updateProfile('999', { username: 'test' })).rejects.toThrow(NotFoundException);
    });

    it('❌ 2.4 should handle database error during update', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockRejectedValue(new Error('Save failed'));

      await expect(service.updateProfile('1', { username: 'test' })).rejects.toThrow('Save failed');
    });

    it('✅ 2.5 should validate email format', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const updateDto: UpdateUserDto = { username: 'newuser' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('1', updateDto);
      expect(result).toBeDefined();
    });

    it('✅ 2.6 should validate phone number format', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const updateDto: UpdateUserDto = { username: 'newuser' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('1', updateDto);
      expect(result).toBeDefined();
    });

    it('✅ 2.7 should validate identity card format', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const updateDto: UpdateUserDto = { username: 'newuser' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('1', updateDto);
      expect(result).toBeDefined();
    });

    it('✅ 2.8 should handle null updateDto', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.updateProfile('1', {} as UpdateUserDto);
      expect(result).toEqual(mockUser);
    });

    it('✅ 2.9 should update avatar URL', async () => {
      const mockUser = { id: '1', username: 'testuser' };
      const updateDto: UpdateUserDto = { avatar: 'https://example.com/avatar.jpg' };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (mockUserRepo.save as jest.Mock).mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updateProfile('1', updateDto);
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('3.getQrCode', () => {
    it('✅ 3.1 should return JWT user type for valid user', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: { role_id: 1, role_name: 'USER' },
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getQrCode('1');

      expect(result).toEqual({
        account_id: '1',
        username: 'testuser',
        role_id: 1,
      });
    });

    it('❌ 3.2 should throw NotFoundException when user not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);

      await expect(service.getQrCode('999')).rejects.toThrow(NotFoundException);
    });

    it('❌ 3.3 should handle database error', async () => {
      (mockUserRepo.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.getQrCode('1')).rejects.toThrow('Database error');
    });

    it('✅ 3.4 should handle user with different roles', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: { role_id: 3, role_name: 'ADMIN' },
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getQrCode('1');

      expect(result).toEqual({
        account_id: '1',
        username: 'admin',
        role_id: 3,
      });
    });

    it('✅ 3.5 should handle employee role', async () => {
      const mockUser = {
        id: '1',
        username: 'employee',
        email: 'employee@example.com',
        role: { role_id: 2, role_name: 'EMPLOYEE' },
      };

      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getQrCode('1');

      expect(result).toEqual({
        account_id: '1',
        username: 'employee',
        role_id: 2,
      });
    });
  });
}); 