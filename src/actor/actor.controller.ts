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
  ForbiddenException,
} from '@nestjs/common';
import { ActorService } from './actor.service';
import { CreateActorDto } from './dtos/createActor.dto';
import { UpdateActorDto } from './dtos/updateActor.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Actor } from 'src/typeorm/entities/cinema/actor';
import { Role } from 'src/enum/roles.enum';
import { JWTUserType } from 'src/utils/type';

@ApiTags('Actors')
@ApiBearerAuth()
@Controller('actor')
export class ActorController {
  constructor(private readonly actorService: ActorService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new actor' })
  @ApiResponse({
    status: 201,
    description: 'Actor created successfully.',
    type: Actor,
  })
  async createActor(@Req() req, @Body() createActorDto: CreateActorDto) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can create an actor.',
      };
    }
    return await this.actorService.createActor(createActorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
  @ApiResponse({ status: 200, description: 'List of Actors.', type: [Actor] })
  async findAllActors() {
    return await this.actorService.findAllActors();
  }

  @Get('search')
  @ApiOperation({ summary: 'Get actor by name' })
  @ApiResponse({ status: 200, description: 'Actor found.', type: Actor })
  @ApiResponse({ status: 404, description: 'Actor not found.' })
  async search(@Query('name') name: string) {
    return await this.actorService.findActorByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  @ApiResponse({ status: 200, description: 'Actor found.', type: Actor })
  @ApiResponse({ status: 404, description: 'Actor not found.' })
  async findActorById(@Param('id') id: string) {
    return await this.actorService.findActorById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update actor details' })
  @ApiResponse({
    status: 200,
    description: 'Actor updated successfully.',
    type: Actor,
  })
  async updateActor(
    @Req() req,
    @Param('id') id: string,
    @Body() updateActorDto: UpdateActorDto,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return {
        statusCode: 403,
        message: 'Unauthorized: Only admin or employee can update an actor.',
      };
    }
    return await this.actorService.updateActor(+id, updateActorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete an actor (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Actor soft-deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  async softDeleteActor(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can soft delete an actor.',
      );
    }
    return await this.actorService.softDeleteActor(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete an actor' })
  @ApiResponse({ status: 200, description: 'Actor permanently deleted.' })
  async removeActor(@Req() req, @Param('id') id: string) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      return {
        statusCode: 403,
        message: 'Unauthorized: Only admin can permanently delete an actor.',
      };
    }
    return await this.actorService.removeActor(+id);
  }

  @Get(':actorId/movies')
  @ApiOperation({ summary: 'Get all movies of an actor' })
  async getMoviesOfActor(@Param('actorId', ParseIntPipe) actorId: number) {
    return await this.actorService.getMoviesOfActor(actorId);
  }

  // @UseGuards(JwtAuthGuard)
  // @Patch(':actorId/remove-movie/:movieId')
  // @ApiOperation({ summary: 'Remove a movie from an actor' })
  // async removeMovieFromActor(
  //   @Param('actorId', ParseIntPipe) actorId: number,
  //   @Param('movieId', ParseIntPipe) movieId: number,
  //   @Req() req,
  // ) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
  //     return {
  //       statusCode: 403,
  //       message:
  //         'Unauthorized: Only admin or employee can remove a movie from an actor.',
  //     };
  //   }
  //   return this.actorService.removeMovieFromActor(actorId, movieId);
  // }
}
