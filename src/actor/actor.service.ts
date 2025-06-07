import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Actor } from '../typeorm/entities/cinema/actor';
import { CreateActorDto } from 'src/actor/dtos/createActor.dto';
import { UpdateActorDto } from 'src/actor/dtos/updateActor.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async createActor(createActorDto: CreateActorDto): Promise<Actor> {
    const existingActor = await this.actorRepository.findOneBy({
      name: createActorDto.name,
    });
    if (existingActor) {
      throw new BadRequestException(
        `Actor with name "${createActorDto.name}" already exists`,
      );
    }
    const actor = this.actorRepository.create(createActorDto);
    return await this.actorRepository.save(actor);
  }

  async findAllActors(): Promise<Actor[]> {
    return await this.actorRepository.find({ where: { is_deleted: false } });
  }

  async findActorById(id: number): Promise<Actor> {
    const actor = await this.actorRepository.findOne({
      where: { id, is_deleted: false },
    });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    return actor;
  }

  async findActorByName(name: string): Promise<Actor[]> {
    const actors = await this.actorRepository.find({
      where: { 
        name: Like(`%${name}%`)
      },
      select: ['id', 'name'], 
    });
    if (!actors) {
      throw new NotFoundException(`Actor with Name ${name} not found`);
    }
    return actors;

  }

  async updateActor(
    id: number,
    updateActorDto: UpdateActorDto,
  ): Promise<Actor> {
    const existingActor = await this.findActorById(id);

    // Check for duplicate name
    const duplicateActor = await this.actorRepository.findOneBy({
      name: updateActorDto.name,
    });
    if (duplicateActor && duplicateActor.id !== id) {
      throw new BadRequestException(
        `Actor with name "${updateActorDto.name}" already exists`,
      );
    }

    Object.assign(existingActor, updateActorDto);
    return await this.actorRepository.save(existingActor);
  }

  async softDeleteActor(id: number): Promise<void> {
    const actor = await this.findActorById(id);
    if (actor.is_deleted) {
      throw new BadRequestException(
        `Actor with ID ${id} is already soft-deleted`,
      );
    }
    actor.is_deleted = true;
    await this.actorRepository.save(actor);
  }

  async restoreActor(id: number): Promise<void> {
    const actor = await this.actorRepository.findOne({
      where: { id, is_deleted: true },
    });
    if (!actor) {
      throw new BadRequestException(`Actor with ID ${id} is not soft-deleted`);
    }
    actor.is_deleted = false;
    await this.actorRepository.save(actor);
  }

  async removeActor(id: number): Promise<void> {
    const actor = await this.actorRepository.findOne({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    await this.actorRepository.remove(actor);
  }

 

  async getMoviesOfActor(
    actorId: number,
  ): Promise<{ id: number; name: string }[]> {
    const actor = await this.actorRepository.findOne({
      where: { id: actorId },
      relations: ['movies'],
    });

    if (!actor) {
      throw new NotFoundException(`Actor with ID ${actorId} not found`);
    }

    // Chỉ lấy `id` và `name` của các Movie
    return actor.movies.map((movie) => ({ id: movie.id, name: movie.name }));
  }

  async removeMovieFromActor(actorId: number, movieId: number): Promise<Actor> {
    const actor = await this.actorRepository.findOne({
      where: { id: actorId },
      relations: ['movies'],
    });

    if (!actor) {
      throw new NotFoundException(`Actor with ID ${actorId} not found`);
    }

    const movie = await this.movieRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    actor.movies = actor.movies.filter((m) => m.id !== movieId);
    return await this.actorRepository.save(actor);
  }
}
