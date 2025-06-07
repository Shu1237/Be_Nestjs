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
  ForbiddenException,
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
import { JWTUserType } from '../utils/type'; // Import JWT User Type
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Role } from 'src/enum/roles.enum';

@ApiTags('Versions')
@ApiBearerAuth()
@Controller('versions')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new version (admin only)' })
  @ApiResponse({ status: 201, description: 'Version created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createVersionDto: CreateVersionDto, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin can create a version.',
      );
    }
    return await this.versionService.create(createVersionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all versions' })
  @ApiResponse({ status: 200, description: 'List of versions.' })
  async findAll() {
    return await this.versionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get version by ID' })
  @ApiResponse({ status: 200, description: 'Version found.' })
  @ApiResponse({ status: 404, description: 'Version not found.' })
  async findOne(@Param('id') id: number) {
    return await this.versionService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update a version by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Version updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async update(
    @Param('id') id: number,
    @Body() updateVersionDto: UpdateVersionDto,
    @Req() req,
  ) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin can update a version.',
      );
    }
    return await this.versionService.update(id, updateVersionDto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id/soft-delete')
  @ApiOperation({ summary: 'Soft delete a version (admin, employee only)' })
  @ApiResponse({
    status: 200,
    description: 'Version soft-deleted successfully.',
  })
  @ApiResponse({ status: 403, description: 'Unauthorized.' })
  async softDeleteVersion(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin or employee can soft delete a version.',
      );
    }
    return await this.versionService.softDeleteVersion(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a version by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Version deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async remove(@Param('id') id: number, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException(
        'Unauthorized: Only admin can delete a version.',
      );
    }
    return await this.versionService.remove(id);
  }
}
