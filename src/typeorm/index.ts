import { Actor } from './entities/cinema/actor';
// import { ActorMovie } from './entities/cinema/actor-movie';
import { CinemaRoom } from './entities/cinema/cinema-room';
import { Gerne } from './entities/cinema/gerne';
// import { MovieGenre } from './entities/cinema/gerne-movie';

import { Movie } from './entities/cinema/movie';
import { Schedule } from './entities/cinema/schedule';
import { Seat } from './entities/cinema/seat';
import { SeatType } from './entities/cinema/seat-type';
import { Order } from './entities/order/order';
import { OrderDetail } from './entities/order/order-detail';
import { OrderProduct } from './entities/order/order-product';
import { PaymentMethod } from './entities/order/payment-method';
import { Ticket } from './entities/order/ticket';
import { TicketType } from './entities/order/ticket-type';
import { Transaction } from './entities/order/transaction';
import { Promotion } from './entities/promotion/promotion';
import { Combo } from './entities/snack/combo';
import { ComboDetail } from './entities/snack/combo-detail';
import { Drink } from './entities/snack/drink';
import { Food } from './entities/snack/food';
import { MailOTP } from './entities/user/mail-otp';
import { Member } from './entities/user/member';
import { RefreshToken } from './entities/user/refresh-token';
import { Role } from './entities/user/roles';
import { User } from './entities/user/user';

export const allEntities = [
  User,
  Role,
  MailOTP,
  RefreshToken,
  Member,

  Food,
  Drink,
  Combo,
  ComboDetail,

  Promotion,

  Order,
  OrderDetail,
  OrderProduct,
  PaymentMethod,
  Transaction,
  Ticket,
  TicketType,

  Movie,
  Actor,
  // ActorMovie,
  CinemaRoom,
  Gerne,
  // MovieGenre,
  Schedule,
  Seat,
  SeatType,
];
