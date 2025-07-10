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
import { Gerne } from 'src/database/entities/cinema/gerne';
import { CreateGerneDto } from './dtos/createGerne';
import { UpdateGerneDto } from './dtos/updateGerne';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { Movie } from 'src/database/entities/cinema/movie';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Gernes')
@ApiBearerAuth()
@Controller('gernes')
export class GerneController {
  constructor(private readonly gerneService: GerneService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new genre (admin, employee only)' })
  createGerne(@Body() createGerneDto: CreateGerneDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can create a genre.');
    return this.gerneService.createGerne(createGerneDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all genres' })
  async findAllGernes(): Promise<Gerne[]> {
    return await this.gerneService.findAllGernes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get genre by ID' })
  async findGerneById(@Param('id', ParseIntPipe) id: number): Promise<Gerne> {
    return await this.gerneService.findGerneById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update genre by ID (admin, employee only)' })
  updateGerne(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGerneDto: UpdateGerneDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can update a genre.');
    return this.gerneService.updateGerne(id, updateGerneDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a genre (admin, employee only)' })
   softDeleteGerne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can soft delete a genre.');
    return  this.gerneService.softDeleteGerne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted genre (admin, employee only)' })
  async restoreGerne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin or employee can restore a genre.');
    return await this.gerneService.restoreGerne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete genre by ID (admin only)' })
  async deleteGerne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ): Promise<void> {
    checkAdminEmployeeRole(req.user, 'Unauthorized: Only admin can delete a genre.');
    return await this.gerneService.deleteGerne(id);
  }

  @Get(':gerneId/movies')
  @ApiOperation({ summary: 'Get all movies of a genre' })
  async getMoviesOfGerne(
    @Param('gerneId', ParseIntPipe) gerneId: number,
  ): Promise<Movie[]> {
    return await this.gerneService.getMoviesOfGerne(gerneId);
  }
}
