import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { MemberService } from '../services/member.service';
import { CreateMemberDto } from '../dtos/create-member.dto';
import { UpdateMemberDto } from '../dtos/update-member.dto';
import { JwtAuthGuard } from '../../guards/auth.guard';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create member' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create member successfully',
    type: CreateMemberDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Data is not valid',
  })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  @Get('get-all')
  @ApiOperation({ summary: 'List all members (Admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List all members',
    isArray: true,
  })
  findAll() {
    return this.memberService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'List member by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List member by id',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update member' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update member successfully',
    type: UpdateMemberDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The Data is not valid',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Member is not found',
  })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(id, updateMemberDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete member' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delete member successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The Member is not found',
  })
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
}
