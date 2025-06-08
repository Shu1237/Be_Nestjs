import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { User } from 'src/typeorm/entities/user/user';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket,User])],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
