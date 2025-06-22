import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "src/database/entities/user/refresh-token";
import { LessThan } from "typeorm/find-options/operator/LessThan";

import { Repository } from "typeorm/repository/Repository";


@Injectable()
export class RefreshTokenService {
    private readonly logger = new Logger(RefreshTokenService.name);
    constructor(
        @InjectRepository(RefreshToken) private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    @Cron('0 0 * * *', {
        name: 'clear-expired-refresh-tokens'
    })
    async handleCron() {
        this.logger.log('Called when the current second is 0');
        const currentDate = new Date();
        const expiredTokens = await this.refreshTokenRepository.find({
            where: {
                expires_at: LessThan(currentDate),
            },
        });
        if (expiredTokens.length > 0) {
            this.logger.log(`Found ${expiredTokens.length} expired tokens`);
            await this.refreshTokenRepository.remove(expiredTokens);
        } else {
            this.logger.log('No expired tokens found');
        }
    }

}

function LerssThan(currentDate: Date): Date | import("typeorm").FindOperator<Date> | undefined {
    throw new Error("Function not implemented.");
}
