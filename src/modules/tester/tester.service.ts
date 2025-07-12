import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StatusSeat } from "src/common/enums/status_seat.enum";
import { Schedule } from "src/database/entities/cinema/schedule";
import { ScheduleSeat } from "src/database/entities/cinema/schedule_seat";
import { Promotion } from "src/database/entities/promotion/promotion";
import { In, Repository } from "typeorm";


@Injectable()
export class TesterService {
    constructor(@InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
        @InjectRepository(Schedule)
        private scheduleRepository: Repository<Schedule>,
        @InjectRepository(ScheduleSeat)
        private scheduleSeatRepository: Repository<ScheduleSeat>) { }

    async getSchedulesExpired() {
        const scheduleEXP = await this.scheduleRepository.find({
            where: { is_deleted: true }
        });

        if (!scheduleEXP || scheduleEXP.length === 0) {
            return { message: "No expired schedules found." };
        }

        let seatsToRemove: ScheduleSeat[] = [];
        const getFullSeats: any[] = [];

        for (const eachSchedule of scheduleEXP) {
            const fullSeats = await this.scheduleSeatRepository.find({
                where: { schedule: { id: eachSchedule.id }, status: StatusSeat.NOT_YET }
            });

            if (fullSeats.length > 0) {
                getFullSeats.push({
                    scheduleId: eachSchedule.id,
                    fullSeats: fullSeats
                });

                // gom lại các seat để xoá
                seatsToRemove.push(...fullSeats);
            }
        }

        if (seatsToRemove.length > 0) {
            await this.scheduleSeatRepository.remove(seatsToRemove);
        }

        return {
            getFullSeats,
            scheduleEXP
        };
    }

}