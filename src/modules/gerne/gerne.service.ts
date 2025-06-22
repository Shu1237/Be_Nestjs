import { Injectable, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { Repository } from 'typeorm';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import { Movie } from 'src/database/entities/cinema/movie';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

@Injectable()
export class GerneService {
  constructor(
    @InjectRepository(Gerne)
    private readonly gerneRepository: Repository<Gerne>,

  ) { }

  async createGerne(createGerneDto: CreateGerneDto): Promise<{ msg: string }> {
    const existing = await this.gerneRepository.findOne({
      where: { genre_name: createGerneDto.genre_name },
    });

    if (existing) {
      throw new BadRequestException(
        `Movie with name "${createGerneDto.genre_name}" already exists.`,
      );
    }

    await this.gerneRepository.create(createGerneDto);
    await this.gerneRepository.save(createGerneDto);
    return { msg: 'Gerne created successfully' };
  }

  async findAllGernes(): Promise<Gerne[]> {
    return await this.gerneRepository.find();
  }

  async findGerneById(id: number): Promise<Gerne> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
    return gerne;
  }

  async updateGerne(
    id: number,
    updateGerneDto: UpdateGerneDto,
  ): Promise<{ msg: string }> {
    const gerne = await this.findGerneById(id);

    // Nếu người dùng muốn đổi tên thì kiểm tra tên mới có trùng với cái khác không
    if (
      updateGerneDto.genre_name &&
      updateGerneDto.genre_name !== gerne.genre_name
    ) {
      const existing = await this.gerneRepository.findOne({
        where: { genre_name: updateGerneDto.genre_name },
      });

      if (existing) {
        throw new Error(`Gerne "${updateGerneDto.genre_name}" already exists`);
      }
    }

    Object.assign(gerne, updateGerneDto);
    await this.gerneRepository.save(gerne);
    return { msg: 'Gerne updated successfully' };
  }

  async deleteGerne(id: number): Promise<void> {
    const result = await this.gerneRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
  }
  async softDeleteGerne(id: number): Promise<{ msg: string; gerne: Gerne }> {
    const gerne = await this.gerneRepository.findOne({ where: { id } });
    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }

    gerne.is_deleted = true; // Đánh dấu là đã xóa
    await this.gerneRepository.save(gerne);

    return { msg: 'Gerne soft-deleted successfully', gerne };
  }

  async getMoviesOfGerne(gerneId: number): Promise<Movie[]> {
    const gerne = await this.gerneRepository.findOne({
      where: { id: gerneId },
      relations: ['movies'],
    });

    if (!gerne) {
      throw new NotFoundException(`Gerne with ID ${gerneId} not found`);
    }

    return gerne.movies;
  }
}
