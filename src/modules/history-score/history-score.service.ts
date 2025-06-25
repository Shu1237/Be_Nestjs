import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

@Injectable()
export class HistoryScoreService {
  constructor(
    @InjectRepository(HistoryScore)
    private readonly historyScoreRepository: Repository<HistoryScore>,
  ) {}

  async getHistoryById(id: number): Promise<HistoryScore> {
    const history = await this.historyScoreRepository.findOne({
      where: { id },
      relations: ['user', 'order'],
    });
    if (!history) {
      throw new NotFoundException(`HistoryScore with ID ${id} not found`);
    }
    return history;
  }
}