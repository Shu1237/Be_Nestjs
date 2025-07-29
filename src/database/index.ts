import { Actor } from './entities/cinema/actor';
import { CinemaRoom } from './entities/cinema/cinema-room';
import { Gerne } from './entities/cinema/gerne';
import { Movie } from './entities/cinema/movie';
import { Schedule } from './entities/cinema/schedule';
import { ScheduleSeat } from './entities/cinema/schedule_seat';
import { Seat } from './entities/cinema/seat';
import { SeatType } from './entities/cinema/seat-type';
import { HistoryScore } from './entities/order/history_score';
import { Order } from './entities/order/order';
import { OrderDetail } from './entities/order/order-detail';
import { PaymentMethod } from './entities/order/payment-method';
import { Ticket } from './entities/order/ticket';
import { TicketType } from './entities/order/ticket-type';
import { Transaction } from './entities/order/transaction';
import { Promotion } from './entities/promotion/promotion';
import { PromotionType } from './entities/promotion/promtion_type';
import { Combo } from './entities/item/combo';
import { Drink } from './entities/item/drink';
import { Food } from './entities/item/food';
import { RefreshToken } from './entities/user/refresh-token';
import { Role } from './entities/user/roles';
import { User } from './entities/user/user';
import { Product } from './entities/item/product';
import { OrderExtra } from './entities/order/order-extra';
import { DailyTransactionSummary } from './entities/order/daily_transaction_summary';

export const allEntities = [
  User,
  Role,
  RefreshToken,
  Food,
  Drink,
  Combo,
  Promotion,
  Order,
  OrderDetail,
  OrderExtra,
  PaymentMethod,
  Transaction,
  Ticket,
  TicketType,
  Movie,
  Actor,
  CinemaRoom,
  Gerne,
  Schedule,
  Seat,
  SeatType,
  ScheduleSeat,
  PromotionType,
  HistoryScore,
  Product,
  DailyTransactionSummary,
];
