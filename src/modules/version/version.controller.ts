import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { VersionPaginationDto } from 'src/common/pagination/dto/version/versionPagination.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';



@ApiBearerAuth()
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) { }

  // GET - Get list of versions for user
  @Get('user')
  @ApiOperation({ summary: 'Get all versions for users' })
  async getAllVersionsUser() {
    return await this.versionService.getAllVersionsUser();
  }

  // GET - Get list of versions for admin (with pagination)
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: '2D' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'version.name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiQuery({
    name: 'is_deleted',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiOperation({ summary: 'Get all versions for admin' })
  async findAll(@Query() query: VersionPaginationDto) {
    const { page = 1, take = 10, ...filters } = query;

    return this.versionService.findAll({
      page,
      take: Math.min(take, 100),
      ...filters,
    });
  }

  // GET - Get version by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  async findOne(@Param('id') id: number) {
    return await this.versionService.findOne(id);
  }

  // POST - Create new version
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Post()
  @ApiOperation({ summary: 'Create a new version (admin only)' })
  async create(@Body() createVersionDto: CreateVersionDto) {
    return await this.versionService.create(createVersionDto);
  }

  // PUT - Update version by ID
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)

  @Put(':id')
  @ApiOperation({ summary: 'Update a version by ID (admin only)' })
  async update(
    @Param('id') id: number,
    @Body() updateVersionDto: UpdateVersionDto) {
    return await this.versionService.update(id, updateVersionDto);
  }

  // PATCH - Soft delete version
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a version (admin, employee only)' })
  async softDeleteVersion(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.softDeleteVersion(id);
  }

  // PATCH - Restore soft-deleted version
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted version (admin, employee only)',
  })
  async restoreVersion(@Param('id', ParseIntPipe) id: number) {
    return await this.versionService.restoreVersion(id);
  }

  // DELETE - Delete version permanently
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a version by ID (admin only)' })
  async remove(@Param('id') id: number) {
    return await this.versionService.remove(id);
  }
}
