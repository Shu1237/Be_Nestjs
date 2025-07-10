import { MailerService } from "@nestjs-modules/mailer";
import { NotFoundException } from "@nestjs/common/exceptions/not-found.exception";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "src/common/enums/roles.enum";
import { StatusOrder } from "src/common/enums/status-order.enum";
import { MyGateWay } from "src/common/gateways/seat.gateway";
import { QrCodeService } from "src/common/qrcode/qrcode.service";
import { ScheduleSeat, SeatStatus } from "src/database/entities/cinema/schedule_seat";
import { HistoryScore } from "src/database/entities/order/history_score";
import { Order } from "src/database/entities/order/order";
import { OrderExtra } from "src/database/entities/order/order-extra";
import { Ticket } from "src/database/entities/order/ticket";
import { Transaction } from "src/database/entities/order/transaction";
import { User } from "src/database/entities/user/user";
import { In, Repository } from "typeorm";



export abstract class AbstractPaymentService {

    constructor(
        protected readonly transactionRepository: Repository<Transaction>,
        protected readonly orderRepository: Repository<Order>,
        protected readonly ticketRepository: Repository<Ticket>,
        protected readonly scheduleSeatRepository: Repository<ScheduleSeat>,
        protected readonly historyScoreRepository: Repository<HistoryScore>,
        protected readonly userRepository: Repository<User>,
        protected readonly orderExtraRepository: Repository<OrderExtra>,
        protected readonly mailerService: MailerService,
        protected readonly gateway: MyGateWay,
        protected readonly qrCodeService: QrCodeService,
        protected readonly configService: ConfigService,
        protected readonly jwtService: JwtService,
    ) { }
    async getTransactionByOrderId(orderId: string) {
        const transaction = await this.transactionRepository.findOne({
            where: { transaction_code: orderId },
            relations: [
                'paymentMethod',
                'order',
                'order.user',
                'order.user.role',
                'order.promotion',
                'order.orderExtras',
                'order.orderExtras.product',
                'order.orderDetails',
                'order.orderDetails.schedule',
                'order.orderDetails.ticket',
                'order.orderDetails.ticket.ticketType',
                'order.orderDetails.ticket.seat',
                'order.orderDetails.ticket.schedule',
                'order.orderDetails.ticket.schedule.movie',
                'order.orderDetails.ticket.schedule.cinemaRoom',
            ],
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }
        return transaction;
    }

    async changeStatusScheduleSeat(seatIds: string[], scheduleId: number): Promise<void> {
        if (!seatIds || seatIds.length === 0) {
            throw new NotFoundException('Seat IDs are required');
        }

        const foundSeats = await this.scheduleSeatRepository.find({
            where: {
                schedule: { id: scheduleId },
                seat: { id: In(seatIds) },
            },
            relations: ['seat', 'schedule'],
        });

        if (!foundSeats || foundSeats.length === 0) {
            throw new NotFoundException('Seats not found for the given schedule');
        }

        for (const seat of foundSeats) {
            seat.status = SeatStatus.NOT_YET;
            await this.scheduleSeatRepository.save(seat);
        }
    }

    async handleReturnSuccess(transaction: Transaction): Promise<string> {
        const order = transaction.order;
        transaction.status = StatusOrder.SUCCESS;
        order.status = StatusOrder.SUCCESS;

        await this.transactionRepository.save(transaction);

        const endScheduleTime = order.orderDetails[0].ticket.schedule.end_movie_time;
        const endTime = new Date(endScheduleTime).getTime();
        const now = Date.now();
        const expiresInSeconds = Math.floor((endTime - now) / 1000);
        const validExpiresIn = expiresInSeconds > 0 ? expiresInSeconds : 60 * 60;

        const jwtOrderID = this.jwtService.sign(
            { orderId: order.id },
            {
                secret: this.configService.get<string>('jwt.qrSecret'),
                expiresIn: validExpiresIn,
            }
        );

        const qrCode = await this.qrCodeService.generateQrCode(jwtOrderID,'QR');
        order.qr_code = qrCode;
        const savedOrder = await this.orderRepository.save(order);

        let scoreTargetUser: User | null = null;

        if (order.customer_id && order.customer_id.trim() !== '') {
            const customer = await this.userRepository.findOne({
                where: { id: order.customer_id },
                relations: ['role'],
            });
            if (customer && customer.role.role_id === Role.USER) {
                scoreTargetUser = customer;
            }
        } else if (order.user?.role.role_id === Role.USER) {
            scoreTargetUser = order.user;
        }

        if (scoreTargetUser) {
            const orderScore = Math.floor(Number(order.total_prices) / 1000);
            const addScore = orderScore - (order.promotion?.exchange ?? 0);
            scoreTargetUser.score += addScore;
            await this.userRepository.save(scoreTargetUser);
            await this.historyScoreRepository.save({
                score_change: addScore,
                user: scoreTargetUser,
                order: savedOrder,
                created_at: new Date(),
            });
        }

        for (const detail of order.orderDetails) {
            const ticket = detail.ticket;
            if (ticket) {
                ticket.status = true;
                await this.ticketRepository.save(ticket);
            }
        }

        if (order.orderExtras && order.orderExtras.length > 0) {
            for (const extra of order.orderExtras) {
                extra.status = StatusOrder.SUCCESS;
                await this.orderExtraRepository.save(extra);
            }
        }

        try {
            await this.sendOrderConfirmationEmail(order, transaction);
        } catch (error) {
            console.error('Mailer error:', error);
            throw new NotFoundException('Failed to send confirmation email');
        }

        this.gateway.onBookSeat({
            schedule_id: order.orderDetails[0].ticket.schedule.id,
            seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
        });

        return `${this.configService.get<string>('redirectUrls.successUrl')}?orderId=${savedOrder.id}&total=${savedOrder.total_prices}&paymentMethod=${transaction.paymentMethod.name}`;
    }
    async handleReturnFailed(transaction: Transaction): Promise<string> {
        const order = transaction.order;
        for (const detail of order.orderDetails) {
            const ticket = detail.ticket;
            if (ticket?.seat && ticket.schedule) {
                await this.changeStatusScheduleSeat([ticket.seat.id], ticket.schedule.id);
            }
        }
        if (order.orderExtras && order.orderExtras.length > 0) {
            for (const extra of order.orderExtras) {
                extra.status = StatusOrder.FAILED;
                await this.orderExtraRepository.save(extra);
            }
        }
        this.gateway.onCancelBookSeat({
            schedule_id: order.orderDetails[0].ticket.schedule.id,
            seatIds: order.orderDetails.map(detail => detail.ticket.seat.id),
        });

        return `${this.configService.get<string>('redirectUrls.failureUrl')}`;
    }

    async sendOrderConfirmationEmail(order: Order, transaction: Transaction) {
        const firstTicket = order.orderDetails[0]?.ticket;
        await this.mailerService.sendMail({
            to: order.user.email,
            subject: 'Your Order Successful',
            template: 'order-confirmation',
            context: {
                user: order.user.username,
                transactionCode: transaction.transaction_code,
                order_date: order.order_date,
                total: Number(order.total_prices).toLocaleString('vi-VN'),
                paymentMethod: transaction.paymentMethod.name,
                year: new Date().getFullYear(),
                movieName: firstTicket?.schedule.movie.name,
                roomName: firstTicket?.schedule.cinemaRoom.cinema_room_name,
                start_movie_time: firstTicket?.schedule.start_movie_time ?? '',
                end_movie_time: firstTicket?.schedule.end_movie_time ?? '',
                seats: order.orderDetails.map(detail => ({
                    row: detail.ticket.seat.seat_row,
                    column: detail.ticket.seat.seat_column,
                    ticketType: detail.ticket.ticketType.ticket_name,
                    price: Number(detail.total_each_ticket).toLocaleString('vi-VN'),
                })),
                orderExtras: order.orderExtras?.map(extra => ({
                    name: extra.product.name,
                    quantity: extra.quantity,
                    price: Number(extra.unit_price).toLocaleString('vi-VN'),
                    total: (extra.quantity * Number(extra.unit_price)).toLocaleString('vi-VN'),
                })) || [],
            },
        });
    }

}