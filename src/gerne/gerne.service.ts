import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { Repository } from 'typeorm';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@Injectable()
export class GerneService {
  constructor(
    @InjectRepository(Gerne)
    private readonly gerneRepository: Repository<Gerne>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async createGerne(createGerneDto: CreateGerneDto): Promise<Gerne> {
    const gerne = this.gerneRepository.create(createGerneDto);
    return await this.gerneRepository.save(gerne);
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
  ): Promise<Gerne> {
    const gerne = await this.findGerneById(id);
    Object.assign(gerne, updateGerneDto);
    return await this.gerneRepository.save(gerne);
  }

  async deleteGerne(id: number): Promise<void> {
    const result = await this.gerneRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Gerne with ID ${id} not found`);
    }
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
