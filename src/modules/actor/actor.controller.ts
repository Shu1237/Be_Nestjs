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

  // GET - Lấy danh sách actors cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all actors for users' })
  async getAllActorsUser() {
    return await this.actorService.getAllActorsUser();
  }

  // GET - Lấy danh sách actors cho admin (với phân trang và filter)
  // @UseGuards(JwtAuthGuard)
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

  // GET - Lấy actor theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get actor by ID' })
  async findActorById(@Param('id', ParseIntPipe) id: number) {
    return await this.actorService.findActorById(id);
  }

  // POST - Tạo actor mới
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new actor' })
  @ApiBearerAuth()
  async createActor(@Body() createActorDto: CreateActorDto) {
    return await this.actorService.createActor(createActorDto);
  }

  // PUT - Cập nhật actor theo ID
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

  // DELETE - Xóa actor vĩnh viễn
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete an actor' })
  async removeActor(@Param('id') id: string) {
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
