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
import { SeatStatus } from 'src/database/entities/cinema/schedule_seat';
import { HoldSeatType, JWTUserType } from 'src/common/utils/type';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: '*' } })
export class MyGateWay implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(MyGateWay.name);

  constructor(
    private seatService: SeatService,
    private configService: ConfigService,

  ) { }

  @WebSocketServer()
  server: Server;

  // Khi server khởi động
  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.logger.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        this.logger.log(`Client disconnected: ${socket.id}`);
      });
    });
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
  @SubscribeMessage('hold_seat')
  async onHoldSeat(
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
      this.server.to(`schedule-${data.schedule_id}`).emit('seat_hold_update', {
        seatIds: data.seatIds,
        schedule_id: data.schedule_id,
        status: SeatStatus.HELD,
      });
    } catch (err) {
      client.emit('error', { msg: err.message || 'Failed to hold seat' });
    }
  }

  // Client huỷ giữ ghế
  @SubscribeMessage('cancel_hold_seat')
  async onCancelHoldSeat(
    @MessageBody() data: HoldSeatType,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as JWTUserType;

    try {
      await this.seatService.cancelHoldSeat(data, user);

      this.server.to(`schedule-${data.schedule_id}`).emit('seat_cancel_hold_update', {
        seatIds: data.seatIds,
        schedule_id: data.schedule_id,
        status: SeatStatus.NOT_YET,
      });
    } catch (err) {
      client.emit('error_message', { msg: err.message || 'Failed to cancel hold seat' });
    }
  }
  // Client đặt ghế thành công
  @SubscribeMessage('book_seat')
  async onBookSeat(
    @MessageBody() data: HoldSeatType,
  ) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.server.to(`schedule-${data.schedule_id}`).emit('error', { msg: 'Invalid seat data' });
      return;
    }

    this.server.to(`schedule-${data.schedule_id}`).emit('seat_booked_update', {
      seatIds: data.seatIds,
      schedule_id: data.schedule_id,
      status: SeatStatus.BOOKED,
    });
  }

  // Client hủy đặt ghế
  @SubscribeMessage('cancel_book_seat')
  async onCancelBookSeat(
    @MessageBody() data: HoldSeatType,
  ) {
    if (!data?.seatIds?.length || !data.schedule_id) {
      this.server.to(`schedule-${data.schedule_id}`).emit('error', { msg: 'Invalid seat data' });
      return;
    }

    this.server.to(`schedule-${data.schedule_id}`).emit('seat_cancel_book_update', {
      seatIds: data.seatIds,
      schedule_id: data.schedule_id,
      status: SeatStatus.NOT_YET,
    });
  }
}
