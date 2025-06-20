import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from 'src/typeorm/entities/order/order';
import { OrderDetail } from 'src/typeorm/entities/order/order-detail';
import { Transaction } from 'src/typeorm/entities/order/transaction';
import { OrderExtra } from 'src/typeorm/entities/order/order-extra';
import { PaymentMethod } from 'src/typeorm/entities/order/payment-method';
import { MomoModule } from './payment-menthod/momo/momo.module';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { User } from 'src/typeorm/entities/user/user';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { TicketType } from 'src/typeorm/entities/order/ticket-type';
import { Ticket } from 'src/typeorm/entities/order/ticket';
import { Promotion } from 'src/typeorm/entities/promotion/promotion';
import { PayPalModule } from './payment-menthod/paypal/paypal.module';
import { VisaModule } from './payment-menthod/visa/visa.module';
import { VnpayModule } from './payment-menthod/vnpay/vnpay.module';
import { ZalopayModule } from './payment-menthod/zalopay/zalopay.module';
import { ScheduleSeat } from 'src/typeorm/entities/cinema/schedule_seat';
import { SeatModule } from 'src/seat/seat.module';
import { RedisModule } from 'src/redis/redis.module';
import { Food } from 'src/typeorm/entities/item/food';
import { Combo } from 'src/typeorm/entities/item/combo';
import { Drink } from 'src/typeorm/entities/item/drink';
import { MyGateWayModule } from 'src/gateways/seat.gateway.module';
import { Product } from 'src/typeorm/entities/item/product';




@Module({
  imports: [
    TypeOrmModule.forFeature([
    
      Promotion,
      Ticket,
      TicketType,
      Schedule,
      User,
      SeatType,
      Order,
      OrderDetail,
      Transaction,
      PaymentMethod,
      ScheduleSeat,
      Product,
      Food,
      Drink,
      Combo,
      OrderExtra

    ]
  ),
    MomoModule,
    PayPalModule,
    VisaModule,
    VnpayModule,
    ZalopayModule,
    SeatModule,
    RedisModule,
    MyGateWayModule

  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
