import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VersionService } from './version.service';
import { Version } from 'src/database/entities/cinema/version';
import { Repository } from 'typeorm';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

describe('VersionService', () => {
  let service: VersionService;
  let mockVersionRepo: Partial<Record<keyof Repository<Version>, jest.Mock>>;

  beforeEach(async () => {
    mockVersionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionService,
        { provide: getRepositoryToken(Version), useValue: mockVersionRepo },
      ],
    }).compile();

    service = module.get<VersionService>(VersionService);
  });

  describe('1.create', () => {
    it(' ✅ 1.1 should create a new version', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockVersionRepo.create as jest.Mock).mockReturnValue({ name: 'V1' });
      (mockVersionRepo.save as jest.Mock).mockResolvedValue({ name: 'V1' });
      const result = await service.create({ name: 'V1' });
      expect(result).toEqual({ message: 'Version created successfully' });
    });

    it('❌ 1.2 should throw BadRequestException if version name exists', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'V1',
      });
      await expect(service.create({ name: 'V1' })).rejects.toThrow(
        BadRequestException,
      );
    });
    it('❌ 1.3 should throw if versionRepository.save throws error', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockVersionRepo.create as jest.Mock).mockReturnValue({ name: 'V1' });
      (mockVersionRepo.save as jest.Mock).mockRejectedValue(
        new Error('DB Error'),
      );
      await expect(service.create({ name: 'V1' })).rejects.toThrow('DB Error');
    });
  });

  describe('2.findOne', () => {
    it('✅ 2.1 should return the version if found', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'V1',
      });
      expect(await service.findOne(1)).toEqual({ id: 1, name: 'V1' });
    });

    it('❌ 2.2 should throw NotFoundException if version not found', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
    it('❌ 2.3 should throw if id is null', async () => {
      await expect(service.findOne(null as any)).rejects.toThrow();
    });

    it('❌ 2.4 should throw if id is negative', async () => {
      await expect(service.findOne(-10)).rejects.toThrow();
    });
  });

  describe('3.update', () => {
    it('✅ 3.1 should update a version successfully when name is not changed', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'V1' });
      (mockVersionRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'V1',
      });
      const result = await service.update(1, { name: 'V1' });
      expect(result).toEqual({ message: 'Version updated successfully' });
    });

    it('✅ 3.2 should update a version successfully when name is changed and not duplicated', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'V1' });
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockVersionRepo.save as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'V2',
      });
      const result = await service.update(1, { name: 'V2' });
      expect(result).toEqual({ message: 'Version updated successfully' });
    });

    it('❌ 3.3 should throw BadRequestException if name is duplicated', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'V1' });
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'V2',
      });
      await expect(service.update(1, { name: 'V2' })).rejects.toThrow(
        BadRequestException,
      );
    });
    it('❌ 3.4 should throw if save fails', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'Old' });
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      (mockVersionRepo.save as jest.Mock).mockRejectedValue(
        new Error('Save error'),
      );
      await expect(service.update(1, { name: 'New' })).rejects.toThrow(
        'Save error',
      );
    });
  });

  describe('4.softDeleteVersion', () => {
    it('✅ 4.1 should soft delete a version', async () => {
      const version = { id: 1, is_deleted: false };
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(version);
      (mockVersionRepo.save as jest.Mock).mockResolvedValue({
        ...version,
        is_deleted: true,
      });
      const result = await service.softDeleteVersion(1);
      expect(result).toEqual({
        msg: 'Version soft-deleted successfully',
        version,
      });
    });

    it('❌ 4.2 should throw NotFoundException if version not found', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.softDeleteVersion(1)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('❌ 4.3 should throw if save fails during soft delete', async () => {
      const version = { id: 1, is_deleted: false };
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(version);
      (mockVersionRepo.save as jest.Mock).mockRejectedValue(
        new Error('Soft delete failed'),
      );
      await expect(service.softDeleteVersion(1)).rejects.toThrow(
        'Soft delete failed',
      );
    });
  });

  describe('5.restoreVersion', () => {
    it('✅ 5.1 should restore a soft-deleted version', async () => {
      const version = { id: 1, is_deleted: true };
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(version);
      (mockVersionRepo.save as jest.Mock).mockResolvedValue({
        ...version,
        is_deleted: false,
      });
      const result = await service.restoreVersion(1);
      expect(result).toEqual({ msg: 'Version restored successfully', version });
    });

    it('❌ 5.2 should throw NotFoundException if version not found', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service.restoreVersion(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 5.3 should throw BadRequestException if version is not soft-deleted', async () => {
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      await expect(service.restoreVersion(1)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('❌ 5.4 should throw if save fails during restore', async () => {
      const version = { id: 1, is_deleted: true };
      (mockVersionRepo.findOne as jest.Mock).mockResolvedValue(version);
      (mockVersionRepo.save as jest.Mock).mockRejectedValue(
        new Error('Restore failed'),
      );
      await expect(service.restoreVersion(1)).rejects.toThrow('Restore failed');
    });
  });

  describe('6.remove', () => {
    it('✅ 6.1 should remove a version if found', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'V1' });
      (mockVersionRepo.remove as jest.Mock).mockResolvedValue({});
      const result = await service.remove(1);
      expect(result).toEqual({ msg: 'Version deleted successfully' });
    });
    it('❌ 6.2 should throw if remove fails', async () => {
      service.findOne = jest.fn().mockResolvedValue({ id: 1, name: 'V1' });
      (mockVersionRepo.remove as jest.Mock).mockRejectedValue(
        new Error('Remove failed'),
      );
      await expect(service.remove(1)).rejects.toThrow('Remove failed');
    });
    it('❌ 6.3 should throw if remove called with string ID', async () => {
      await expect(service.remove('abc' as any)).rejects.toThrow();
    });
  });

  it('✅ 8.1 should return paginated versions', async () => {
    const mockQB: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
    };
  });
});
