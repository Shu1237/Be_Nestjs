import { Controller, Get,  Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { JWTUserType } from 'src/common/utils/type';
import { Role } from 'src/common/enums/roles.enum';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { TicketMarkUsedDto } from './dto/ticket-mark-used.dto';
import { ForbiddenException } from 'src/common/exceptions/forbidden.exception';

@UseGuards(JwtAuthGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }


  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  @ApiBearerAuth()
  getAllTickets(@Req() req) {
    const user = req.user as JWTUserType
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only admin or employee can view all tickets');

    }
    return this.ticketService.getAllTickets();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiBearerAuth()
  getTicketById(@Param('id') id: string) {
    return this.ticketService.getTicketById(id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get tickets by user ID' })
  @ApiBearerAuth()
  getTicketsByUserId(@Param('id') id: string) {
    return this.ticketService.getTicketsByUserId(id);
  }

  @Patch('tickets/mark-used')
  @ApiOperation({ summary: 'Mark tickets as used' })
  @ApiBearerAuth()
  @ApiBody({ type: TicketMarkUsedDto })
  markTicketsAsUsed(@Body() body: TicketMarkUsedDto, @Req() req) {
    const user = req.user as JWTUserType;
    if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
      throw new ForbiddenException('Only admin or employee can mark tickets as used');
    }
    return this.ticketService.markTicketsAsUsed(body.ticketIds);
  }
}
