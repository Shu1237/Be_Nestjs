import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JWTUserType } from "src/common/utils/type";
import { HistoryScore } from "src/database/entities/order/history_score";
import { Repository } from "typeorm/repository/Repository";



@Injectable()
export class HistoryScoreService {
    constructor(
        @InjectRepository(HistoryScore) private readonly historyScoreRepository: Repository<HistoryScore>
    ) { }
    async getHistoryScoreById(userData: JWTUserType) : Promise<HistoryScore[]> {
        const historyScore = await this.historyScoreRepository.find({
            where:{
                user: { id: userData.account_id }
            }
        })
        return historyScore;
    }
}