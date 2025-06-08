
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Cache } from 'cache-manager';
import { Seat } from "src/typeorm/entities/cinema/seat";
import { HoldSeatType, JWTUserType } from 'src/utils/type';
import { In, Repository } from "typeorm";



@Injectable()
export class SeatService {
    constructor(
        @InjectRepository(Seat) private seatRepository: Repository<Seat>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    async holdSeat(data: HoldSeatType, req: any) {
        const { seatIds, cinema_id } = data;
        const user = req.user as JWTUserType;

        if (seatIds.length === 0) {
            return { msg: 'No seats selected' };
        }
        const foundSeats = await this.seatRepository.find({
            where: {
                id: In(seatIds),
            },
            relations: ['cinemaRoom'],
        });


        if (foundSeats.length !== seatIds.length) {
            throw new BadRequestException('Some seats do not exist');
        }
        const notMatching = foundSeats.some(seat => seat.cinemaRoom.id !== cinema_id);
        if (notMatching) {
            throw new BadRequestException('All seats must belong to the same cinema room');
        }

        for (const seat of foundSeats) {
            if (!seat.status) {
                throw new BadRequestException(`Seat with ID ${seat.id} was already booked`);
            }
        }

        for (const seat of foundSeats) {
            seat.is_hold = true;
        }
        await this.seatRepository.save(foundSeats);


        await this.cacheManager.set(`seat-${user.account_id}`, {seatIds:seatIds,cinemaRoom_id:cinema_id}, { ttl: 600 } as any);

        return {
            msg: 'Seats held successfully',
        };
    }

    async cancelHoldSeat(data: HoldSeatType, req: any) {
        const user = req.user as JWTUserType;
        const { seatIds, cinema_id } = data;
        if (seatIds.length === 0) {
            return { msg: 'No seats selected' };
        }


        const foundSeats = await this.seatRepository.find({
            where: {
                id: In(seatIds),
            },
            relations: ['cinemaRoom'],
        });

        if (foundSeats.length !== seatIds.length) {
            throw new BadRequestException('Some seats do not exist');
        }
        const notMatching = foundSeats.some(seat => seat.cinemaRoom.id !== cinema_id);
        if (notMatching) {
            throw new BadRequestException('All seats must belong to the same cinema room');
        }

        for (const seat of foundSeats) {
            if (!seat.is_hold) {
                throw new BadRequestException(`Seat with ID ${seat.id} was not held`);
            }
        }


        for (const seat of foundSeats) {
            seat.is_hold = false;
        }
        await this.seatRepository.save(foundSeats);


        await this.cacheManager.del(`seat-${user.account_id}`);

        return {
            msg: 'Seats un-held successfully',
            released: seatIds,
        };
    }

}