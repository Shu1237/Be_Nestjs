import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { VersionPaginationDto } from 'src/common/pagination/dto/version/versionPagination.dto';


@ApiBearerAuth()
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  // GET - Lấy danh sách versions cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all versions for users' })
  async getAllVersionsUser() {
    return await this.versionService.getAllVersionsUser();
  }

  // GET - Lấy danh sách versions cho admin (với phân trang)
  @UseGuards(JwtAuthGuard)
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
  async findAll(@Query() query: VersionPaginationDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can view all versions');
    const { page = 1, take = 10, ...filters } = query;

    return this.versionService.findAll({
      page,
      take: Math.min(take, 100),
      ...filters,
    });
  }

  // GET - Lấy version theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  async findOne(@Param('id') id: number) {
    return await this.versionService.findOne(id);
  }

  // POST - Tạo version mới
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new version (admin only)' })
  async create(@Body() createVersionDto: CreateVersionDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can create a version');
    return await this.versionService.create(createVersionDto);
  }

  // PUT - Cập nhật version theo ID
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update a version by ID (admin only)' })
  async update(
    @Param('id') id: number,
    @Body() updateVersionDto: UpdateVersionDto,
    @Req() req,
  ) {
    checkAdminEmployeeRole(req.user, 'Only admin can update a version');
    return await this.versionService.update(id, updateVersionDto);
  }

  // PATCH - Soft delete version
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a version (admin, employee only)' })
  async softDeleteVersion(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Only admin or employee can soft delete a version.',
    );
    return await this.versionService.softDeleteVersion(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a soft-deleted version (admin, employee only)',
  })
  async restoreVersion(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'Only admin or employee can restore a version.',
    );
    return await this.versionService.restoreVersion(id);
  }

  

  // DELETE - Xóa version vĩnh viễn
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a version by ID (admin only)' })
  async remove(@Param('id') id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can delete a version.');
    return await this.versionService.remove(id);
  }
}
