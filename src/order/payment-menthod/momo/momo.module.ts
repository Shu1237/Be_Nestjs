import { Module } from "@nestjs/common";
import { MomoService } from "./momo.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "src/typeorm/entities/order/transaction";
import { Order } from "src/typeorm/entities/order/order";
import { Ticket } from "src/typeorm/entities/order/ticket";
import { Seat } from "src/typeorm/entities/cinema/seat";
import { User } from "src/typeorm/entities/user/user";
import { Member } from "src/typeorm/entities/user/member";
import { MailerModule} from "@nestjs-modules/mailer";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";


@Module({
    imports: [TypeOrmModule.forFeature([Member,User,Transaction,Order,Ticket,Seat,ScheduleSeat]),MomoModule,MailerModule],
    controllers: [],
    providers: [MomoService],
    exports: [MomoService]


})
export class MomoModule {}
