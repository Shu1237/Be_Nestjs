import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { ScheduleSeat } from "src/typeorm/entities/cinema/schedule_seat";
import { Repository } from "typeorm/repository/Repository";


@Injectable()
export class ScheduleSeatService {
    constructor(
        @InjectRepository(ScheduleSeat)
        private scheduleSeatRepository: Repository<ScheduleSeat>,
    ) { }

    async findSeatByScheduleId(scheduleId: number): Promise<ScheduleSeat[]> {
        return this.scheduleSeatRepository.find({
            where: {
                schedule: {
                    id: scheduleId
                }
            },
            relations: ['schedule', 'seat','seat.seatType'],
        });
    }
}