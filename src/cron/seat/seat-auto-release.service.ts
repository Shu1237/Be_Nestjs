import { Injectable, Logger, Inject } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import Redis from "ioredis";
import { StatusSeat } from "src/enum/status_seat.enum";
import { MyGateWay } from "src/gateways/seat.gateway";
import { ScheduleSeat, SeatStatus } from "src/typeorm/entities/cinema/schedule_seat";
import { HoldSeatType } from "src/utils/type";
import { In, Repository } from "typeorm";

@Injectable()
export class SeatAutoReleaseService {
    private readonly logger = new Logger(SeatAutoReleaseService.name);

    constructor(
        @InjectRepository(ScheduleSeat)
        private readonly scheduleSeatRepository: Repository<ScheduleSeat>,
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly gateway: MyGateWay,

    ) { }

   @Cron('*/10 * * * *') // mỗi 10 phút
    async handleClearExpiredSeats() {
        const keys = await this.redisClient.keys('seat-hold-*');
        const currentTime = Date.now();
        for (const key of keys) {
            this.logger.log(`Processing key: ${key}`);
            try {
                const redisRaw = await this.redisClient.get(key);
                if (!redisRaw) continue;

                const holdData: HoldSeatType = JSON.parse(redisRaw);

                if (typeof holdData.expiresAt === 'number' && holdData.expiresAt > currentTime) {
                    continue;
                }

                const { seatIds, schedule_id } = holdData;

                // tìm và cập nhật ghế
                const foundSeats = await this.scheduleSeatRepository.find({
                    where: {
                        schedule: { id: schedule_id },
                        seat: { id: In(seatIds) },
                    },
                    relations: ['seat', 'schedule'],
                });

                if (foundSeats.length === 0) continue;

                for (const seat of foundSeats) {
                    if (seat.status === StatusSeat.HELD) {
                        seat.status = StatusSeat.NOT_YET;
                    }
                }

                await this.scheduleSeatRepository.save(foundSeats);

                // xóa Redis key
                await this.redisClient.del(key);

                // socket thông báo cho tất cả client
                try {
                    this.gateway.server.emit('seat_release_update', {
                        seatIds: holdData.seatIds,
                        schedule_id: holdData.schedule_id,
                        userId: key.split('seat-hold-')[1],
                        status: SeatStatus.NOT_YET,
                    });
                } catch (emitErr) {
                    this.logger.warn('Emit socket error:', emitErr);
                }


            } catch (error) {
                this.logger.error(' Error in handleClearExpiredSeats:', error);
            }
        }
    }

}
