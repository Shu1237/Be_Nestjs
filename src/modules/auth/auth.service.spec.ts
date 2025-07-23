import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QrCodeService } from 'src/common/qrcode/qrcode.service';
import { User } from 'src/database/entities/user/user';
import { RefreshToken } from 'src/database/entities/user/refresh-token';
import { Role } from 'src/database/entities/user/roles';
import { Repository } from 'typeorm';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';


describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
        {
          provide: QrCodeService,
          useValue: {
            generateQrCode: jest.fn().mockResolvedValue('fake-qr-code'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    roleRepo = module.get(getRepositoryToken(Role));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get(JwtService);
  });

  describe('1.validateRefreshToken', () => {
    it('✅ 1.1 should return JWTUserType if token is valid', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        role: { role_id: 2 },
      };
      const mockToken = {
        refresh_token: 'token',
        revoked: false,
        expires_at: new Date(Date.now() + 10000),
        user: mockUser,
      };
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue(mockToken as any);
      jest.spyOn(refreshTokenRepo, 'save').mockResolvedValue({
        refresh_token: 'token',
        revoked: false,
        expires_at: new Date(Date.now() + 10000),
        user: { id: '1', username: 'testuser', role: { role_id: 2 } },
      } as any);

      const result = await service.validateRefreshToken('token');
      expect(result).toEqual({
        account_id: '1',
        username: 'testuser',
        role_id: 2,
      });
    });
     it('❌ 1.2 should return null if token not found', async () => {
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue(null);
      const result = await service.validateRefreshToken('invalid-token');
      expect(result).toBeNull();
    });

    it('❌ 1.3 should return null if token is expired', async () => {
      const expiredToken = {
        refresh_token: 'token',
        revoked: false,
        expires_at: new Date(Date.now() - 1000),
        user: { id: '1', username: 'testuser', role: { role_id: 2 } },
      };
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue(expiredToken as any);
      const result = await service.validateRefreshToken('token');
      expect(result).toBeNull();
    });

  });

  describe('2.generateToken', () => {
    it('✅ 2.1 should return token object if user found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue({
        id: '1',
        username: 'mockuser',
        sub: 'mocksub',
        email: 'mock@email.com',
        score: 0,
        password: 'mockpassword',
        created_at: new Date(),
        updated_at: new Date(),
        role: { role_id: 1 },
        refresh_tokens: [],
        is_active: true,
      } as any);
      jest.spyOn(refreshTokenRepo, 'save').mockResolvedValue({
        refresh_token: 'mock-refresh-token',
        revoked: false,
        expires_at: new Date(Date.now() + 10000),
        user: {
          id: '1',
          username: 'mockuser',
          role: { role_id: 1 },
        },
      } as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('access-token');

      const result = await service.generateToken({
        account_id: '1',
        username: 'u',
        role_id: 1,
      });

      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: expect.any(String),
      });
    });
    it('❌ 2.2 should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.generateToken({ account_id: '1', username: 'u', role_id: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3.logout', () => {
    it('✅ 3.1 should revoke token successfully', async () => {
      const mockToken = {
        user: { id: '1' },
        revoked: false,
      };
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue(mockToken as any);
      jest.spyOn(refreshTokenRepo, 'save').mockResolvedValue({
        refresh_token: '123',
        revoked: true,
        expires_at: new Date(),
        user: { id: '1' }
      } as any);

      const result = await service.logout(
        { refresh_token: '123' },
        { account_id: '1', username: 'u', role_id: 1 },
      );
      expect(result).toEqual({ msg: 'Logout successful' });
    });
  });
      it('❌ 3.2 should throw NotFoundException if refresh token not found', async () => {
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.logout(
          { refresh_token: '123' },
          { account_id: '1', username: 'u', role_id: 1 },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('❌ 3.3 should throw ForbiddenException if user mismatch', async () => {
      jest.spyOn(refreshTokenRepo, 'findOne').mockResolvedValue({
        user: {
          id: '2',
          username: 'testuser2',
          sub: 'sub2',
          email: 'test2@email.com',
          score: 0,
          password: 'password2',
          created_at: new Date(),
          updated_at: new Date(),
          role: { role_id: 1 },
          refresh_tokens: [],
          is_active: true,
        },
      } as any);

      await expect(
        service.logout(
          { refresh_token: '123' },
          { account_id: '1', username: 'u', role_id: 1 },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
});
