import { Test, TestingModule } from '@nestjs/testing';
import { OverviewService } from './overview.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { Order } from 'src/database/entities/order/order';
import { Movie } from 'src/database/entities/cinema/movie';
import { Ticket } from 'src/database/entities/order/ticket';
import { User } from 'src/database/entities/user/user';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { DailyTransactionSummary } from 'src/database/entities/order/daily_transaction_summary';

const mockRepo = () => ({
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue({ totalRevenue: '1000.00' }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(5),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
});

describe('OverviewService', () => {
  let service: OverviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverviewService,
        { provide: getRepositoryToken(Order), useFactory: mockRepo },
        { provide: getRepositoryToken(Movie), useFactory: mockRepo },
        { provide: getRepositoryToken(Ticket), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(TicketType), useFactory: mockRepo },
        { provide: getRepositoryToken(OrderExtra), useFactory: mockRepo },
        { provide: getRepositoryToken(Schedule), useFactory: mockRepo },
        { provide: getRepositoryToken(DailyTransactionSummary), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<OverviewService>(OverviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue as number', async () => {
      const result = await service['getTotalRevenue']();
      expect(result).toBe(1000.00);
    });
  });

  describe('getTicketsSold', () => {
    it('should return total ticket count', async () => {
      const result = await service['getTicketsSold']();
      expect(typeof result).toBe('number');
    });
  });

  describe('getTotalCustomers', () => {
    it('should return customer count', async () => {
      const result = await service['getTotalCustomers']();
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getActiveMovies', () => {
    it('should return active movie count', async () => {
      const result = await service['getActiveMovies']();
      expect(typeof result).toBe('number');
    });
  });

  describe('getOverview', () => {
    it('should return full overview response', async () => {
      jest.spyOn(service as any, 'getTotalRevenue').mockResolvedValue(1000);
      jest.spyOn(service as any, 'getTicketsSold').mockResolvedValue(200);
      jest.spyOn(service as any, 'getTotalCustomers').mockResolvedValue(100);
      jest.spyOn(service as any, 'getActiveMovies').mockResolvedValue(10);
      jest.spyOn(service as any, 'getTicketTypeSalesReport').mockResolvedValue([]);
      jest.spyOn(service as any, 'getBestSellingCombo').mockResolvedValue([]);
      jest.spyOn(service as any, 'getTimeSlotReport').mockResolvedValue([]);
      jest.spyOn(service as any, 'getRevenueByPeakHours').mockResolvedValue([]);
      jest.spyOn(service as any, 'getTopMoviesByRevenue').mockResolvedValue([]);
      jest.spyOn(service as any, 'getTopCustomersByBookings').mockResolvedValue([]);

      const overview = await service.getOverview();
      expect(overview.summary.totalRevenue).toBe(1000);
      expect(overview.summary.ticketsSold).toBe(200);
    });
  });

  describe('getTopMoviesByRevenue', () => {
    it('should return empty array if no data', async () => {
      const result = await service['getTopMoviesByRevenue']();
      expect(result).toEqual([]);
    });
  
    
  });
  
  describe('getTimeSlotReport', () => {
    it('should return 24-hour report with empty input', async () => {
      const result = await service['getTimeSlotReport']();
      expect(result.length).toBe(24);
      expect(result[0]).toHaveProperty('hour');
      expect(result[0]).toHaveProperty('ticketsSold');
    });
  });
  
  describe('getNowShowing', () => {
    it('should return list of now-showing movies', async () => {
      const result = await service['getNowShowing']();
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('getTopCustomersByBookings', () => {
    it('should return top customers with orderCount', async () => {
      const result = await service['getTopCustomersByBookings']();
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
});
