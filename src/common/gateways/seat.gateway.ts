import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  WebSocketServer,
} from '@nestjs/websockets';
import { OnModuleInit, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { SeatService } from 'src/modules/seat/seat.service';
import { HoldSeatType, JWTUserType } from 'src/common/utils/type';
import { ConfigService } from '@nestjs/config';
import { StatusSeat } from '../enums/status_seat.enum';

@WebSocketGateway({ cors: { origin: '*' } })
export class MyGateWay implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(MyGateWay.name);

  constructor(
    private seatService: SeatService,
    private configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  // Khi server khởi động
  onModuleInit() {
    if (this.server) {
      this.server.on('connection', (socket) => {
        this.logger.log(`Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
          this.logger.log(`Client disconnected: ${socket.id}`);
        });
      });
    }
  }

  // Khi client connect lần đầu
  async handleConnection(client: Socket) {
    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      this.logger.error('JWT secret key is not defined');
      client.disconnect();
      return;
    }

    const token = client.handshake.query.token as string;
    try {
      const payload = jwt.verify(token, jwtSecret);
      client.data.user = payload as JWTUserType;
    } catch (err) {
      this.logger.warn(` Socket JWT invalid: ${err.message}`);
      client.disconnect();
    }
  }

  // Client tham gia vào lịch chiếu
  @SubscribeMessage('join_schedule')
  handleJoinSchedule(
    @MessageBody() data: { schedule_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `schedule-${data.schedule_id}`;
    client.join(room);
    client.emit('joined_room', { room });
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  // Client giữ ghế
  @SubscribeMessage('client_hold_seat')
  async onClientHoldSeat(
    @MessageBody() data: HoldSeatType,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as JWTUserType;

    if (!data?.seatIds?.length || !data.schedule_id) {
      client.emit('error', { msg: 'Invalid seat data' });
      return;
    }

    try {
      await this.seatService.holdSeat(data, user);

      // Gửi đến room cụ thể
      if (this.server) {
        this.server
          .to(`schedule-${data.schedule_id}`)
          .emit('seat_hold_update', {
            seatIds: data.seatIds,
            schedule_id: data.schedule_id,
            status: StatusSeat.HELD,
          });
      }
    } catch (err) {
      client.emit('error', { msg: err.message || 'Failed to hold seat' });
    }
  }

  // Client huỷ giữ ghế
  @SubscribeMessage('client_cancel_hold_seat')
  async onClientCancelHoldSeat(
    @MessageBody() data: HoldSeatType,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as JWTUserType;

    try {
      await this.seatService.cancelHoldSeat(data, user);

      if (this.server) {
        this.server
          .to(`schedule-${data.schedule_id}`)
          .emit('seat_cancel_hold_update', {
            seatIds: data.seatIds,
            schedule_id: data.schedule_id,
            status: StatusSeat.NOT_YET,
          });
      }
    } catch (err) {
      client.emit('error_message', {
        msg: err.message || 'Failed to cancel hold seat',
      });
    }
  }

  // Method để xử lý order expired từ cron job
  // Thông báo huỷ đặt ghế khi order hết hạn cho tất cả client đang join schedule đó
  onOrderExpired(data: HoldSeatType) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.logger.warn('Invalid order expired data');
      return;
    }

    if (this.server) {
      this.server
        .to(`schedule-${data.schedule_id}`)
        .emit('seat_cancel_book_update_cron', {
          seatIds: data.seatIds,
          schedule_id: data.schedule_id,
          status: StatusSeat.NOT_YET,
        });
    }

    this.logger.log(
      `Order expired notification sent for schedule ${data.schedule_id}: ${data.seatIds.length} seats released`,
    );
  }

  // Public method để emit hold seat từ service khác
  public emitHoldSeat(data: HoldSeatType) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.logger.warn('Invalid hold seat data');
      return;
    }

    if (this.server) {
      this.server.to(`schedule-${data.schedule_id}`).emit('seat_hold_update', {
        seatIds: data.seatIds,
        schedule_id: data.schedule_id,
        status: StatusSeat.HELD,
      });
    }
  }

  // Public method để emit book seat từ service khác
  public emitBookSeat(data: HoldSeatType) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.logger.warn('Invalid book seat data');
      return;
    }

    if (this.server) {
      this.server
        .to(`schedule-${data.schedule_id}`)
        .emit('seat_booked_update', {
          seatIds: data.seatIds,
          schedule_id: data.schedule_id,
          status: StatusSeat.BOOKED,
        });
    }
  }

  // Public method để emit cancel book seat từ service khác
  public emitCancelBookSeat(data: HoldSeatType) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.logger.warn('Invalid cancel book seat data');
      return;
    }

    if (this.server) {
      this.server
        .to(`schedule-${data.schedule_id}`)
        .emit('seat_cancel_book_update', {
          seatIds: data.seatIds,
          schedule_id: data.schedule_id,
          status: StatusSeat.NOT_YET,
        });
    }
  }
}
