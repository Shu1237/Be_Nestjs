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
import { ActorPaginationDto } from 'src/common/pagination/dto/actor/actor-pagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { actorFieldMapping } from 'src/common/pagination/fillters/actor-field-mapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) { }

  async createActor(createActorDto: CreateActorDto): Promise<{ msg: string }> {
    const existingActor = await this.actorRepository.findOneBy({
      name: createActorDto.name,
    });
    if (existingActor) {
      throw new BadRequestException(
        `Actor with name "${createActorDto.name}" already exists`,
      );
    }

    const actor = this.actorRepository.create(createActorDto);
    await this.actorRepository.save(actor);
    return {
      msg: 'Actor created successfully',
    };
  }

  async getAllActors(filters: ActorPaginationDto) {
    const qb = this.actorRepository.createQueryBuilder('actor')
    applyCommonFilters(qb, filters, actorFieldMapping);
    const allowedSortFields = [
      'actor.name',
      'actor.stage_name',
      'actor.nationality',
      'actor.date_of_birth',
      'actor.gender',
    ];
    applySorting(qb, filters.sortBy, filters.sortOrder, allowedSortFields, 'actor.name');

    // Apply pagination
    applyPagination(qb, {
      page: filters.page,
      take: filters.take
    });
    const [actors, total] = await qb.getManyAndCount();

    // Get total male / female
    const genderStats = await this.actorRepository
      .createQueryBuilder('actor')
      .select('actor.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .groupBy('actor.gender')
      .getRawMany();

    const genderCount = Object.fromEntries(
      genderStats.map((item) => [item.gender, parseInt(item.count, 10)])
    );

    const totalMale = genderCount['male'] || 0;
    const totalFemale = genderCount['female'] || 0;

    return buildPaginationResponse(actors, {
      total,
      page: filters.page,
      take: filters.take,
      totalMale,
      totalFemale,
    });
  }

  async findActorById(id: number): Promise<Actor> {
    const actor = await this.actorRepository.findOne({
      where: { id },
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
