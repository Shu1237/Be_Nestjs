import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { HoldSeatType, JWTUserType } from 'src/utils/type';
import { SeatService } from 'src/seat/seat.service';
import { SeatStatus } from 'src/typeorm/entities/cinema/schedule_seat';




@WebSocketGateway({ cors: { origin: '*' } })
export class MyGateWay implements OnGatewayConnection, OnModuleInit {
    constructor(
        private seatService: SeatService,
    ) { }
    @WebSocketServer()
    server: Server;
    onModuleInit() {
        this.server.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
        });
    }
    async handleConnection(client: Socket) {
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            console.error('JWT secret key is not defined');
            client.disconnect(); // Đá kết nối nếu không có secret
            return;
        }
        const token = client.handshake.query.token as string;
        try {
            const payload = jwt.verify(token, jwtSecret);
            client.data.user = payload as JWTUserType;

        } catch (err) {
            console.error('Socket JWT invalid:', err.message);
            client.disconnect();
        }
    }
    OnModuleInit() {
        this.server.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
        });
    }

    @SubscribeMessage('hold_seat')
    async onHoldSeat(
        @MessageBody() data: HoldSeatType,
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user as JWTUserType;

        if (!data?.seatIds?.length || !data.schedule_id) {
            //only this client send data
            client.emit('error', { msg: 'Invalid seat data' });
            return;
        }

        try {
            await this.seatService.holdSeat(data, user);

            // send to all clients
            this.server.emit('seat_hold_update', {
                seatIds: data.seatIds,
                schedule_id: data.schedule_id,
                userId: user.account_id,
                status: SeatStatus.HELD
            });
        } catch (err) {
            client.emit('error', { msg: err.message || 'Failed to hold seat' });
        }
    }


    // @SubscribeMessage('release_seat')
    // async onReleaseSeat(
    //     @MessageBody()
    //     data: HoldSeatType,
    //     @ConnectedSocket() client: Socket,
    // ) {
    //     const user = client.data.user as JWTUserType;

    //     if (!data?.seatIds?.length || !data.schedule_id) {
    //         //only this client send data
    //         client.emit('error', { msg: 'Invalid seat data' });
    //         return;
    //     }

    //     await this.seatService.cancelHoldSeat(data, user)
    //         .then(() => {
    //             // send to all clients
    //             this.server.emit('seat_release_update', {
    //                 seatIds: data.seatIds,
    //                 schedule_id: data.schedule_id,
    //                 userId: user.account_id,
    //                 status: 'RELEASE',
    //             });
    //         })
    //         .catch(err => {
    //             client.emit('error', { msg: err.message || 'Failed to release seat' });
    //         });
    // }
}
