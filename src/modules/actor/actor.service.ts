import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Actor } from '../../database/entities/cinema/actor';
import { CreateActorDto } from 'src/modules/actor/dtos/createActor.dto';
import { UpdateActorDto } from 'src/modules/actor/dtos/updateActor.dto';
import { Movie } from 'src/database/entities/cinema/movie';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async createActor(createActorDto: CreateActorDto): Promise<{ msg: string }> {
    const existingActor = await this.actorRepository.findOneBy({
      name: createActorDto.name,
    });
    if (existingActor) {
      throw new BadRequestException(
        `Actor with name "${createActorDto.name}" already exists`,
      );
    }
    await this.actorRepository.create(createActorDto);
    return {
      msg: 'Actor created successfully',
    };
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
        name: Like(`%${name}%`),
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
  ): Promise<{ msg: string }> {
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
    await this.actorRepository.save(existingActor);
    return { msg: 'Actor updated successfully' };
  }

  async softDeleteActor(id: number): Promise<{ msg: string }> {
    const actor = await this.findActorById(id);
    if (actor.is_deleted) {
      throw new BadRequestException(
        `Actor with ID ${id} is already soft-deleted`,
      );
    }
    actor.is_deleted = true;
    await this.actorRepository.save(actor);
    return { msg: 'Actor soft deleted successfully' };
  }

  async removeActor(id: number): Promise<void> {
    const actor = await this.actorRepository.findOne({ where: { id } });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    await this.actorRepository.remove(actor);
  }
}
