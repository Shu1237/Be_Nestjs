import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from 'src/database/entities/order/order';
import { OrderDetail } from 'src/database/entities/order/order-detail';
import { Transaction } from 'src/database/entities/order/transaction';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { PaymentMethod } from 'src/database/entities/order/payment-method';
import { MomoModule } from './payment-menthod/momo/momo.module';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { User } from 'src/database/entities/user/user';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { Ticket } from 'src/database/entities/order/ticket';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { PayPalModule } from './payment-menthod/paypal/paypal.module';
import { VisaModule } from './payment-menthod/visa/visa.module';
import { VnpayModule } from './payment-menthod/vnpay/vnpay.module';
import { ZalopayModule } from './payment-menthod/zalopay/zalopay.module';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { SeatModule } from 'src/modules/seat/seat.module';
import { RedisModule } from 'src/common/redis/redis.module';
import { Food } from 'src/database/entities/item/food';
import { Combo } from 'src/database/entities/item/combo';
import { Drink } from 'src/database/entities/item/drink';
import { MyGateWayModule } from 'src/common/gateways/seat.gateway.module';
import { Product } from 'src/database/entities/item/product';





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
    MyGateWayModule,


  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
