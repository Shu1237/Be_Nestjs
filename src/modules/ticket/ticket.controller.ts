import { Controller, Get, Body, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';

@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }


  @Get()
  @ApiOperation({ summary: 'Get all tickets with pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: true ,default: false})
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true ,default: true})

  @ApiResponse({ status: 200, description: 'List of all tickets' })
 async getAllTickets(
  @Req() req,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
 @Query('is_used') is_used: boolean = false, 
  @Query('active') active: boolean = true
) {
  const user = req.user as JWTUserType;
  if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
    throw new ForbiddenException('Only admin or employee can view all tickets');
  }

  const take = Math.max(1, Math.min(limit, 100));
  const skip = (Math.max(1, page) - 1) * take;

  return this.ticketService.getAllTickets({ skip, take, page, is_used, active });
}

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get tickets by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'is_used', required: false, type: Boolean, example: true, default: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean, example: true, default: true })
  @ApiBearerAuth()
  getTicketsByUserId(
    @Param('id') id: string,  
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('is_used') is_used: boolean = false, 
    @Query('active') active: boolean = true
  ) {
    //check if the user is authorized to view tickets
    const user = req.user as JWTUserType;


    if (user.role_id === Role.USER && user.account_id !== id.toString()) {
      throw new ForbiddenException('You can only view your own orders');
    }
    const take = Math.max(1, Math.min(limit, 100));
    const skip = (Math.max(1, page) - 1) * take;

    return this.ticketService.getTicketsByUserId(id, { skip, take, page, is_used, active });
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
