import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TicketPaginationDto } from 'src/common/pagination/dto/ticket/ticket-pagination.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }


  // GET - Get list of tickets for user
  @Get('user')
  @ApiOperation({ summary: 'Get all tickets for users' })
  @ApiBearerAuth()
  async getAllTicketsUser() {
    return await this.ticketService.getAllTicketsUser();
  }

  // GET - Get list of tickets for admin (with pagination)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @Get('admin')
  @ApiOperation({ summary: 'Get all tickets for admin' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Avengers',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-07-03',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'schedule.id | ticketType | ticket.is_used | ticket.status',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  async getAllTickets(@Query() query: TicketPaginationDto) {
    const { page = 1, take = 10, ...restFilters } = query;
    return this.ticketService.getAllTickets({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Get tickets by user ID
  @Get('tickets-by-user-id')
  @ApiOperation({
    summary: 'Get tickets by user ID with filters, search, sort',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Avengers',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-07-03',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'schedule.id | ticketType',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @ApiBearerAuth()
  async getTicketsByUserId(@Req() req, @Query() query: TicketPaginationDto) {
    const user = req.user as JWTUserType;
    const { page = 1, take = 10, ...restFilters } = query;

    return this.ticketService.getTicketsByUserId({
      page,
      take: Math.min(take, 100),
      ...restFilters,
      userId: user.account_id,
    });
  }

  // GET - Get ticket by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }
}
