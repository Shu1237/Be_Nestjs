import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ActorService } from './actor.service';
import { CreateActorDto } from './dtos/createActor.dto';
import { UpdateActorDto } from './dtos/updateActor.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ActorPaginationDto } from 'src/common/pagination/dto/actor/actor-pagination.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';


@Controller('actor')
export class ActorController {
  constructor(private readonly actorService: ActorService) { }

  // GET - get list of actors for user
  @Get('user')
  @ApiOperation({ summary: 'Get all actors for users' })
  async getAllActorsUser() {
    return await this.actorService.getAllActorsUser();
  }

  // GET - get list of actors for admin (with pagination and filter)
  @Get('admin')
  @ApiOperation({ summary: 'Get all actors for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'name | stage_name | nationality',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'name | stage_name | nationality | gender | date_of_birth',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Christopher',
  })
  @ApiQuery({
    name: 'stage_name',
    required: false,
    type: String,
    example: 'Johnny',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    enum: ['male', 'female'],
    example: 'male',
  })
  @ApiQuery({
    name: 'nationality',
    required: false,
    type: String,
    example: 'American',
  })
  @ApiQuery({
    name: 'date_of_birth',
    required: false,
    type: String,
    example: '1990-01-01',
  })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  async getAllActors(@Query() query: ActorPaginationDto, @Req() req) {
    const { page = 1, take = 10, ...restFilters } = query;
    return await this.actorService.getAllActors({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - get actor by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  async findActorById(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.findActorById(id);
  }

  // POST - Create new actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new actor' })
  @ApiBearerAuth()
  async createActor(@Body() createActorDto: CreateActorDto) {
    return await this.actorService.createActor(createActorDto);
  }

  // PUT - Update actor by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update actor details' })
  async updateActor(
    @Param('id') id: string,
    @Body() updateActorDto: UpdateActorDto,
  ) {
    return await this.actorService.updateActor(+id, updateActorDto);
  }

  // PATCH - Soft delete actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an actor (admin, employee only)' })
  async softDeleteActor(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.softDeleteActor(id);
  }

  // DELETE - Restore soft-deleted actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore a soft-deleted actor (admin, employee only)',
  })
  async restoreActor(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.restoreActor(id);
  }

  // DELETE - Permanently delete actor
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete an actor' })
  async removeActor(@Param('id') id: string) {
    return await this.actorService.removeActor(+id);
  }

}
