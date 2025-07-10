import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { Version } from 'src/database/entities/cinema/version';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { VersionPaginationDto } from 'src/common/pagination/dto/version/versionPagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { versionFieldMapping } from 'src/common/pagination/fillters/versionFieldMapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';

@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) { }
  async getAllVersionsUser(): Promise<Version[]> {
    return await this.versionRepository.find({
      where: { is_deleted: false },
    });
  }
  async create(
    createVersionDto: CreateVersionDto,
  ): Promise<{ message: string }> {
    // Kiểm tra nếu `name` đã tồn tại
    const existingVersion = await this.versionRepository.findOne({
      where: { name: createVersionDto.name },
    });
    if (existingVersion) {
      throw new BadRequestException(
        `Version with name "${createVersionDto.name}" already exists.`,
      );
    }

    const version = this.versionRepository.create(createVersionDto);
    await this.versionRepository.save(version);
    return { message: 'Version created successfully' };
  }
  async findAll(fillters: VersionPaginationDto) {
    const qb = this.versionRepository.createQueryBuilder('version');

    applyCommonFilters(qb, fillters, versionFieldMapping);
    const allowedFields = [
      'version.name',
      'version.is_deleted',
    ];
    applySorting(qb, fillters.sortBy, fillters.sortOrder, allowedFields, 'version.name');
    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take,
    })
    const [versions, total] = await qb.getManyAndCount();
    const counts = await this.versionRepository
      .createQueryBuilder('version')
      .select([
        `SUM(CASE WHEN version.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN version.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne();
      const activeCount = parseInt(counts.activeCount, 10) || 0;
      const deletedCount = parseInt(counts.deletedCount, 10) || 0;
      return buildPaginationResponse(versions, {
        total,
        page: fillters.page,
        take: fillters.take,
        activeCount,
        deletedCount,
      });

  }

  async findOne(id: number): Promise<Version> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    return version;

  }

  async update(
    id: number,
    updateVersionDto: UpdateVersionDto,
  ): Promise<{ message: string }> {
    const version = await this.findOne(id);

    // Kiểm tra nếu `name` đã tồn tại (trừ chính bản ghi hiện tại)
    if (updateVersionDto.name) {
      const existingVersion = await this.versionRepository.findOne({
        where: { name: updateVersionDto.name },
      });
      if (existingVersion && existingVersion.id !== id) {
        throw new BadRequestException(
          `Version with name "${updateVersionDto.name}" already exists.`,
        );
      }
    }

    Object.assign(version, updateVersionDto);
    await this.versionRepository.save(version);
    return { message: 'Version updated successfully' };
  }
  async softDeleteVersion(
    id: number,
  ): Promise<{ msg: string; version: Version }> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }

    version.is_deleted = true; // Đánh dấu là đã xóa
    await this.versionRepository.save(version);

    return { msg: 'Version soft-deleted successfully', version };
  }

  async restoreVersion(
    id: number,
  ): Promise<{ msg: string; version: Version }> {
    const version = await this.versionRepository.findOne({ where: { id } });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id} not found`);
    }
    if (!version.is_deleted) {
      throw new BadRequestException(
        `Version with ID ${id} is not soft-deleted`,
      );
    }
    version.is_deleted = false;
    await this.versionRepository.save(version);
    return { msg: 'Version restored successfully', version };
  }

  async remove(id: number): Promise<{ msg: string }> {
    const version = await this.findOne(id);
    await this.versionRepository.remove(version);
    return { msg: 'Version deleted successfully' };
  }
}
