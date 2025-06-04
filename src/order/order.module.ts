import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from 'src/typeorm/entities/order/order';
import { OrderDetail } from 'src/typeorm/entities/order/order-detail';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { OrderProduct } from 'src/typeorm/entities/order/order-product';
import { PaymentMethod } from 'src/typeorm/entities/order/payment-method';
import { MomoModule } from './payment-menthod/momo/momo.module';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { User } from 'src/typeorm/entities/user/user';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';


@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion,Ticket,TicketType,Schedule,User,SeatType,Seat,Order, OrderDetail, Transaction, OrderProduct, PaymentMethod]),
    MomoModule, 
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
