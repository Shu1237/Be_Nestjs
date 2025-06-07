import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { GerneService } from './gerne.service';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { JWTUserType } from 'src/utils/type';
import { Role } from 'src/enum/roles.enum';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@ApiTags('Gernes')
@ApiBearerAuth()
@Controller('gernes')
export class GerneController {
  constructor(private readonly gerneService: GerneService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  @ApiResponse({
    status: 201,
    description: 'Genre created successfully.',
    type: Gerne,
  })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  async createGerne(
    @Body() createGerneDto: CreateGerneDto,
    @Req() req,
  ): Promise<Gerne> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a genre.',
      );
    }
    return await this.gerneService.createGerne(createGerneDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ status: 200, description: 'List of genres.', type: [Gerne] })
  async findAllGernes(): Promise<Gerne[]> {
    return await this.gerneService.findAllGernes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  @ApiResponse({ status: 200, description: 'Genre found.', type: Gerne })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async findGerneById(@Param('id', ParseIntPipe) id: number): Promise<Gerne> {
    return await this.gerneService.findGerneById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'Genre updated successfully.',
    type: Gerne,
  })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async updateGerne(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGerneDto: UpdateGerneDto,
    @Req() req,
  ): Promise<Gerne> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can create a genre.',
      );
    }
    return await this.gerneService.updateGerne(id, updateGerneDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
  @ApiResponse({ status: 200, description: 'Genre soft-deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  async softDeleteGerne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can soft delete a genre.',
      );
    }
    return await this.gerneService.softDeleteGerne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Genre deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Genre not found.' })
  async deleteGerne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin can delete a genre.',
      );
    }
    return await this.gerneService.deleteGerne(id);
  }

  @Get(':gerneId/movies')
  @ApiOperation({ summary: 'Get all movies of a genre' })
  @ApiResponse({ status: 200, description: 'List of movies.', type: [Movie] })
  async getMoviesOfGerne(
    @Param('gerneId', ParseIntPipe) gerneId: number,
  ): Promise<Movie[]> {
    return await this.gerneService.getMoviesOfGerne(gerneId);
  }
}
