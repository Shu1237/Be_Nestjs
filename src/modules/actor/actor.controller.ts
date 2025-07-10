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
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Actor } from 'src/database/entities/cinema/actor';
import { Role } from 'src/common/enums/roles.enum';
import { JWTUserType } from 'src/common/utils/type';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Actors')
@ApiBearerAuth()
@Controller('actor')
export class ActorController {
  constructor(private readonly actorService: ActorService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new actor' })
  async createActor(@Req() req, @Body() createActorDto: CreateActorDto) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create an actor.');
    return await this.actorService.createActor(createActorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all actors' })
  async findAllActors() {
    return await this.actorService.findAllActors();
  }

  @Get('search')
  @ApiOperation({ summary: 'Get actor by name' })
  async search(@Query('name') name: string) {
    return await this.actorService.findActorByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  async findActorById(@Param('id') id: string) {
    return await this.actorService.findActorById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update actor details' })
  async updateActor(
    @Req() req,
    @Param('id') id: string,
    @Body() updateActorDto: UpdateActorDto,
  ) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update an actor.');
    return await this.actorService.updateActor(+id, updateActorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete an actor (admin, employee only)' })
  async softDeleteActor(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Unauthorized: Only admin or employee can soft delete an actor.');
    return await this.actorService.softDeleteActor(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted actor (admin, employee only)' })
  async restoreActor(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    checkAdminEmployeeRole(user, 'Unauthorized: Only admin or employee can restore an actor.');
    return await this.actorService.restoreActor(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete an actor' })
  async removeActor(@Req() req, @Param('id') id: string) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin can permanently delete an actor.');
    return await this.actorService.removeActor(+id);
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
