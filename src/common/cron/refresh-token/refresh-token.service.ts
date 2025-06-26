import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshToken } from "src/database/entities/user/refresh-token";
import { LessThan, Repository } from "typeorm";

@Injectable()
export class RefreshTokenService {
    private readonly logger = new Logger(RefreshTokenService.name);
    
    constructor(
        @InjectRepository(RefreshToken) 
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    @Cron('0 0 * * *', {
        name: 'clear-expired-refresh-tokens'
    })
    async handleCron() {
        this.logger.log('Starting expired refresh tokens cleanup');
        
        try {
            const currentDate = new Date();
            const expiredTokens = await this.refreshTokenRepository.find({
                where: {
                    expires_at: LessThan(currentDate),
                },
            });
            
            if (expiredTokens.length > 0) {
                await this.refreshTokenRepository.remove(expiredTokens);
                this.logger.log(`Successfully removed ${expiredTokens.length} expired tokens`);
            } else {
                this.logger.log('No expired tokens found');
            }
        } catch (error) {
            this.logger.error('Error during expired tokens cleanup:', error);
        }
    }
}
