import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { checkAdminEmployeeRole } from 'src/common/role/admin_employee';
import { TicketPaginationDto } from 'src/common/pagination/dto/ticket/ticket-pagination.dto';

@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  // @Get('overview-ticket')
  // @ApiOperation({ summary: 'Get overview of tickets' })
  // async getOverviewTicket() {
  //   return this.ticketService.getTicketOverview();
  // }
  // GET - Lấy danh sách tickets cho user
  @Get('user')
  @ApiOperation({ summary: 'Get all tickets for users' })
  async getAllTicketsUser(@Req() req) {
    checkAdminEmployeeRole(
      req.user,
      'You do not have permission to view all tickets',
    );
    return await this.ticketService.getAllTicketsUser();
  }

  // GET - Lấy danh sách tickets cho admin (với phân trang)
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
  async getAllTickets(@Req() req, @Query() query: TicketPaginationDto) {
    checkAdminEmployeeRole(
      req.user,
      'You do not have permission to view all tickets',
    );

    const { page = 1, take = 10, ...restFilters } = query;

    return this.ticketService.getAllTickets({
      page,
      take: Math.min(take, 100),
      ...restFilters,
    });
  }

  // GET - Lấy tickets theo user ID
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
    // Trích xuất các giá trị từ query
    const { page = 1, take = 10, ...restFilters } = query;

    return this.ticketService.getTicketsByUserId({
      page,
      take: Math.min(take, 100),
      ...restFilters,
      userId: user.account_id,
    });
  }

  // GET - Lấy ticket theo ID
  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }

  // ============ PATCH ENDPOINTS ============

  // PATCH - Mark tickets as used (commented out)
  // @Patch('tickets/mark-used')
  // @ApiOperation({ summary: 'Mark tickets as used' })
  // @ApiBearerAuth()
  // @ApiBody({ type: TicketMarkUsedDto })
  // markTicketsAsUsed(@Body() body: TicketMarkUsedDto, @Req() req) {
  //   const user = req.user as JWTUserType;
  //   if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
  //     throw new ForbiddenException('Only admin or employee can mark tickets as used');
  //   }
  //   return this.ticketService.markTicketsAsUsed(body.ticketIds);
  // }
}
