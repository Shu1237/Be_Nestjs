import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryScore } from 'src/database/entities/order/history_score';
import { HistoryScoreService } from './historyScore.service';

describe('HistoryScoreService', () => {
  let service: HistoryScoreService;
  let mockHistoryScoreRepo: any;

  beforeEach(async () => {
    mockHistoryScoreRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      }),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryScoreService,
        { provide: getRepositoryToken(HistoryScore), useValue: mockHistoryScoreRepo },
      ],
    }).compile();

    service = module.get<HistoryScoreService>(HistoryScoreService);
  });

  describe('getAllHistoryScore', () => {
    it('should return paginated history scores', async () => {
      const filters = {
        page: 1,
        take: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };

      const fakeHistoryScores = [{ id: 1 }, { id: 2 }];
      mockHistoryScoreRepo.createQueryBuilder().getManyAndCount.mockResolvedValue([fakeHistoryScores, 2]);

      const result = await service.getAllHistoryScore(filters as any);

      expect(mockHistoryScoreRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result.data).toEqual(fakeHistoryScores);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(filters.page);
      expect(result.meta.pageSize).toBe(filters.take);
    });
  });

  describe('getHistoryScoreByUserId', () => {
    it('should return paginated history scores filtered by userId', async () => {
      const filters = {
        page: 2,
        take: 5,
        sortBy: 'created_at',
        sortOrder: 'ASC',
        userId: 'user-123',
      };

      const fakeHistoryScores = [{ id: 3 }, { id: 4 }];
      const qbMock = mockHistoryScoreRepo.createQueryBuilder();
      qbMock.getManyAndCount.mockResolvedValue([fakeHistoryScores, 2]);

      const result = await service.getHistoryScoreByUserId(filters as any);

      expect(mockHistoryScoreRepo.createQueryBuilder).toHaveBeenCalled();
      expect(qbMock.where).toHaveBeenCalledWith('user.id = :userId', { userId: filters.userId });
      expect(result.data).toEqual(fakeHistoryScores);
      expect(result.meta.page).toBe(filters.page);
      expect(result.meta.pageSize).toBe(filters.take);
    });
  });

  describe('getHistoryScoreById', () => {
    it('should return a history score if found', async () => {
      const fakeHistoryScore = { id: 10, score_change: 50 };
      mockHistoryScoreRepo.findOne.mockResolvedValue(fakeHistoryScore);

      const result = await service.getHistoryScoreById(10);
      expect(mockHistoryScoreRepo.findOne).toHaveBeenCalledWith({
        where: { id: 10 },
        relations: ['user', 'order', 'order.promotion'],
      });
      expect(result).toEqual(fakeHistoryScore);
    });

    it('should throw error if history score not found', async () => {
      mockHistoryScoreRepo.findOne.mockResolvedValue(undefined);
      await expect(service.getHistoryScoreById(999)).rejects.toThrowError('History score with ID 999 not found');
    });
  });
  
});
