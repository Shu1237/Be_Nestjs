import { Controller, Get, Body, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';
import { GetAllTicketsDto } from './dto/get-all-tickets.dto';

@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }


  @Get()
  @ApiOperation({ summary: 'Get all tickets with pagination, search, filter, sort' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Avengers' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiBearerAuth()
  async getAllTickets(@Req() req, @Query() query: GetAllTicketsDto) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only admin or employee can view all tickets');
    }

    const { page = 1, limit = 10, ...filters } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    return this.ticketService.getAllTickets({
      skip,
      take,
      page,
      ...filters,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get tickets by user ID with filters, search, sort' })
  @ApiOperation({ summary: 'Get all tickets with pagination, search, filter, sort' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Avengers' })
  @ApiQuery({ name: 'startDate', required: false, type: String, example: '2025-07-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, example: '2025-07-03' })
  @ApiBearerAuth()
  async getTicketsByUserId(
    @Param('id') id: string,
    @Req() req,
    @Query() query: GetAllTicketsDto,
  ) {
    const user = req.user as JWTUserType;


    if (user.role_id === Role.USER && user.account_id !== id.toString()) {
      throw new ForbiddenException('You can only view your own orders');
    }

    const { page = 1, limit = 10, ...filters } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    return this.ticketService.getTicketsByUserId(id, {
      skip,
      take,
      page,
      ...filters,
    });
  }

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