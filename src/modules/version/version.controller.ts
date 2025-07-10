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
} from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JWTUserType } from '../../common/utils/type'; // Import JWT User Type
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { Role } from 'src/common/enums/roles.enum';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';

@ApiTags('Versions')
@ApiBearerAuth()
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new version (admin only)' })
  async create(@Body() createVersionDto: CreateVersionDto, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can create a version');
    return await this.versionService.create(createVersionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all versions' })
  async findAll() {
    return await this.versionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  async findOne(@Param('id') id: number) {
    return await this.versionService.findOne(id);
  }

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
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a version (admin, employee only)' })
  async softDeleteVersion(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin or employee can soft delete a version.');
    return await this.versionService.softDeleteVersion(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted version (admin, employee only)' })
  async restoreVersion(@Param('id', ParseIntPipe) id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin or employee can restore a version.');
    return await this.versionService.restoreVersion(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a version by ID (admin only)' })
  async remove(@Param('id') id: number, @Req() req) {
    checkAdminEmployeeRole(req.user, 'Only admin can delete a version.');
    return await this.versionService.remove(id);
  }
}
