import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { Version } from 'src/typeorm/entities/cinema/version';

@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) {}

  async create(createVersionDto: CreateVersionDto): Promise<Version> {
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
    return await this.versionRepository.save(version);
  }
  async findAll(): Promise<Version[]> {
    return await this.versionRepository.find();
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
  ): Promise<Version> {
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
    return await this.versionRepository.save(version);
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

  async remove(id: number): Promise<void> {
    const version = await this.findOne(id);
    await this.versionRepository.remove(version);
  }
}
