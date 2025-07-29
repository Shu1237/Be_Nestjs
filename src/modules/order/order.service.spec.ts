import { OrderService } from './order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Order } from 'src/database/entities/order/order';
import { Transaction } from 'src/database/entities/order/transaction';
import { PaymentMethod } from 'src/database/entities/order/payment-method';
import { OrderDetail } from 'src/database/entities/order/order-detail';
import { User } from 'src/database/entities/user/user';
import { Promotion } from 'src/database/entities/promotion/promotion';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Ticket } from 'src/database/entities/order/ticket';
import { TicketType } from 'src/database/entities/order/ticket-type';
import { PayPalService } from './payment-menthod/paypal/paypal.service';
import { Method } from 'src/common/enums/payment-menthod.enum';
import { VisaService } from './payment-menthod/visa/visa.service';
import { VnpayService } from './payment-menthod/vnpay/vnpay.service';
import { MomoService } from './payment-menthod/momo/momo.service';
import { ZalopayService } from './payment-menthod/zalopay/zalopay.service';
import { ScheduleSeat } from 'src/database/entities/cinema/schedule_seat';
import { MyGateWay } from 'src/common/gateways/seat.gateway';
import { OrderExtra } from 'src/database/entities/order/order-extra';
import { Product } from 'src/database/entities/item/product';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { ConfigService } from '@nestjs/config';
import { TicketService } from '../ticket/ticket.service';
import { JwtService } from '@nestjs/jwt';
import { DailyTransactionSummary } from 'src/database/entities/order/daily_transaction_summary';
import { StatusSeat } from 'src/common/enums/status_seat.enum';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { StatusOrder } from 'src/common/enums/status-order.enum';
import { ConflictException } from 'src/common/exceptions/conflict.exception';

describe('OrderService', () => {
  let service: OrderService;
  // Mocked repositories
  let mockOrderRepo: Partial<Repository<Order>>;
  let mockTransactionRepo: Partial<Repository<Transaction>>;
  let mockUserRepo: Partial<Repository<User>>;
  let mockPaymentMethodRepo: Partial<Repository<PaymentMethod>>;
  let mockPromotionRepo: Partial<Repository<Promotion>>;
  let mockScheduleRepo: Partial<Repository<Schedule>>;
  let mockTicketRepo: Partial<Repository<Ticket>>;
  let mockTicketTypeRepo: Partial<Repository<TicketType>>;
  let mockScheduleSeatRepo: Partial<Repository<ScheduleSeat>>;
  let mockOrderDetailRepo: Partial<Repository<OrderDetail>>;
  let mockOrderExtraRepo: Partial<Repository<OrderExtra>>;
  let mockProductRepo: Partial<Repository<Product>>;
  let mockHistoryScoreRepo: Partial<Repository<any>>;
  let mockDailyTransactionSummaryRepo: Partial<Repository<DailyTransactionSummary>>;

  // Mocked services and gateways
  let mockMomoService: Partial<MomoService>;
  let mockPaypalService: Partial<PayPalService>;
  let mockVisaService: Partial<VisaService>;
  let mockVnpayService: Partial<VnpayService>;
  let mockZalopayService: Partial<ZalopayService>;
  let mockGateway: Partial<MyGateWay>;
  let mockTicketService: Partial<TicketService>;
  let mockConfigService: Partial<ConfigService>;
  let mockJwtService: Partial<JwtService>;

  let mockRedis: any;

  beforeEach(async () => {
    mockOrderRepo = { findOne: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn() };
    mockTransactionRepo = { findOne: jest.fn(), save: jest.fn() };
    mockUserRepo = { findOne: jest.fn(), save: jest.fn() };
    mockPaymentMethodRepo = { findOne: jest.fn() };
    mockPromotionRepo = { findOne: jest.fn() };
    mockScheduleRepo = { findOne: jest.fn() };
    mockTicketRepo = { find: jest.fn(), save: jest.fn(), create: jest.fn() };
    mockTicketTypeRepo = { find: jest.fn() };
    mockScheduleSeatRepo = { find: jest.fn(), save: jest.fn() };
    mockOrderDetailRepo = { save: jest.fn() };
    mockOrderExtraRepo = { find: jest.fn(), save: jest.fn(), remove: jest.fn(), create: jest.fn() };
    mockProductRepo = { find: jest.fn() };
    mockHistoryScoreRepo = { save: jest.fn() };
    mockDailyTransactionSummaryRepo = { create: jest.fn(), save: jest.fn() };

    mockMomoService = { createOrderMomo: jest.fn(), queryOrderStatusMomo: jest.fn() };
    mockPaypalService = { createOrderPaypal: jest.fn(), queryOrderStatusPaypal: jest.fn() };
    mockVisaService = { createOrderVisa: jest.fn(), queryOrderStatusVisa: jest.fn() };
    mockVnpayService = { createOrderVnPay: jest.fn(), queryOrderStatusVnpay: jest.fn() };
    mockZalopayService = { createOrderZaloPay: jest.fn(), queryOrderStatusZaloPay: jest.fn() };
    mockGateway = { emitBookSeat: jest.fn(), emitHoldSeat: jest.fn(), emitCancelBookSeat: jest.fn() };
    mockTicketService = { markTicketsAsUsed: jest.fn() };
    mockConfigService = { get: jest.fn() };
    mockJwtService = { verify: jest.fn() };

    mockRedis = { get: jest.fn(), keys: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(PaymentMethod), useValue: mockPaymentMethodRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Promotion), useValue: mockPromotionRepo },
        { provide: getRepositoryToken(Schedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
        { provide: getRepositoryToken(TicketType), useValue: mockTicketTypeRepo },
        { provide: getRepositoryToken(ScheduleSeat), useValue: mockScheduleSeatRepo },
        { provide: getRepositoryToken(OrderDetail), useValue: mockOrderDetailRepo },
        { provide: getRepositoryToken(OrderExtra), useValue: mockOrderExtraRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(class HistoryScore {}), useValue: mockHistoryScoreRepo },
        { provide: getRepositoryToken(DailyTransactionSummary), useValue: mockDailyTransactionSummaryRepo },
        { provide: MomoService, useValue: mockMomoService },
        { provide: PayPalService, useValue: mockPaypalService },
        { provide: VisaService, useValue: mockVisaService },
        { provide: VnpayService, useValue: mockVnpayService },
        { provide: ZalopayService, useValue: mockZalopayService },
        { provide: MyGateWay, useValue: mockGateway },
        { provide: TicketService, useValue: mockTicketService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('1.getUserById', () => {
    it('✅ 1.1 should return user if found', async () => {
      const fakeUser = { id: '123', role: { role_id: 1 } };
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(fakeUser);
      expect(await service['getUserById']('123')).toBe(fakeUser);
    });
    it('❌ 1.2 should throw NotFoundException if not found', async () => {
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service['getUserById']('999')).rejects.toThrow(NotFoundException);
    });
    it('✅ 1.3 should return user even if role is missing', async () => {
      const fakeUser = { id: '123', role: null };
      (mockUserRepo.findOne as jest.Mock).mockResolvedValue(fakeUser);
      expect(await service['getUserById']('123')).toBe(fakeUser);
    });
    
    it('❌ 1.4 should throw error if userId is null or empty string', async () => {
      await expect(service['getUserById'](null as any)).rejects.toThrow();
      await expect(service['getUserById']('')).rejects.toThrow();
    });
  });

  describe('2.getPromotionById', () => {
    it('✅ 2.1 should return promotion if found and active', async () => {
      const promo = { id: 1, is_active: true, promotionType: {} };
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(promo);
      expect(await service['getPromotionById'](1)).toBe(promo);
    });
    it('❌ 2.2 should throw NotFoundException if not found or inactive', async () => {
      (mockPromotionRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service['getPromotionById'](999)).rejects.toThrow(NotFoundException);
    });
    
    
    
  });

  describe('3.getScheduleById', () => {
    it('✅ 3.1 should return schedule if found', async () => {
      const sch = { id: 1, is_deleted: false };
      (mockScheduleRepo.findOne as jest.Mock).mockResolvedValue(sch);
      expect(await service['getScheduleById'](1)).toBe(sch);
    });
    it('❌ 3.2 should throw NotFoundException if not found', async () => {
      (mockScheduleRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service['getScheduleById'](999)).rejects.toThrow(NotFoundException);
    });
    
    
    
  });

  describe('4.getOrderById', () => {
    it('✅ 4.1 should return order if found', async () => {
      const order = { id: 1, transaction: {} };
      (mockOrderRepo.findOne as jest.Mock).mockResolvedValue(order);
      expect(await service['getOrderById'](1)).toBe(order);
    });
    it('❌ 4.2 should throw NotFoundException if not found', async () => {
      (mockOrderRepo.findOne as jest.Mock).mockResolvedValue(undefined);
      await expect(service['getOrderById'](999)).rejects.toThrow(NotFoundException);
    });
    
    
    it('❌ 4.4 should throw error if orderId is string', async () => {
      await expect(service['getOrderById']('abc' as any)).rejects.toThrow();
    });
    
  });

  describe('5.getPaymentCode', () =>   {
    it('✅ 5.1 should return payUrl for MOMO', async () => {
      (mockMomoService.createOrderMomo as jest.Mock).mockResolvedValue({ payUrl: 'momo-url', orderId: 'momo-123' });
      const res = await service['getPaymentCode']({
          payment_method_id: Method.MOMO, total_prices: '100000',
          promotion_id: 0,
          schedule_id: 0,
          seats: []
      }, 'ip');
      expect(res.payUrl).toBe('momo-url');
    });
    it('✅ 5.2 should return payUrl for PAYPAL', async () => {
      (mockPaypalService.createOrderPaypal as jest.Mock).mockResolvedValue({ payUrl: 'paypal-url', orderId: 'p-123' });
      const res = await service['getPaymentCode']({
          payment_method_id: Method.PAYPAL,
          total_prices: '',
          promotion_id: 0,
          schedule_id: 0,
          seats: []
      }, 'ip');
      expect(res.payUrl).toBe('paypal-url');
    });
    it('✅ 5.3 should return payUrl for CASH', async () => {
      const res = await service['getPaymentCode']({
          payment_method_id: Method.CASH,
          total_prices: '',
          promotion_id: 0,
          schedule_id: 0,
          seats: []
      }, 'ip');
      expect(res.payUrl).toMatch(/Payment successful by Cash/);
    });
   
    
    it('❌ 5.4 should throw error if transactionId is null or undefined', async () => {
      await expect(service['getTransactionById'](null as any)).rejects.toThrow();
      await expect(service['getTransactionById'](undefined as any)).rejects.toThrow();
    });
    
  });
  
  describe('6.validateBeforeOrder', () => {
    it('✅ 6.1 should return true if no conflicting seat holds', async () => {
      // User's own hold exists, no other holds
      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify({ seatIds: ['s1', 's2'] }));
      mockRedis.keys = jest.fn().mockResolvedValue(['seat-hold-1-123']);
      await expect(service['validateBeforeOrder'](1, '123', ['s1', 's2'])).resolves.toBe(true);
      expect(mockGateway.emitCancelBookSeat).not.toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledWith('seat-hold-1-123');
    });

    it('❌ 6.2 should throw BadRequestException if user seat hold expired', async () => {
      mockRedis.get = jest.fn().mockResolvedValue(undefined);
      await expect(service['validateBeforeOrder'](1, '123', ['s1'])).rejects.toThrow(BadRequestException);
      expect(mockGateway.emitCancelBookSeat).toHaveBeenCalled();
    });

    it('❌ 6.3 should return false if another user holds a conflicting seat', async () => {
      // Current user has a hold, another user's hold overlaps
      mockRedis.get = jest.fn().mockResolvedValue('{}');
      mockRedis.keys = jest.fn().mockResolvedValue(['seat-hold-1-123', 'seat-hold-1-999']);
      mockRedis.get = jest
        .fn()
        .mockImplementation((key) => {
          if (key === 'seat-hold-1-123') return JSON.stringify({ seatIds: ['s1'] });
          if (key === 'seat-hold-1-999') return JSON.stringify({ seatIds: ['s1', 's2'] });
        });
      await expect(service['validateBeforeOrder'](1, '123', ['s1'])).resolves.toBe(false);
    });
    it('❌ 6.4 should throw NotFoundException if audienceTypes is empty array', async () => {
      (mockTicketTypeRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service['getTicketTypesByAudienceTypes']([])).rejects.toThrow(NotFoundException);
    });
    
    it('❌ 6.5 should throw error if audienceTypes is null or undefined', async () => {
      await expect(service['getTicketTypesByAudienceTypes'](null as any)).rejects.toThrow();
      await expect(service['getTicketTypesByAudienceTypes'](undefined as any)).rejects.toThrow();
    });
    
  });

  describe('7.changeStatusScheduleSeatToBooked', () => {
    it('✅ 7.1 should update seat status to BOOKED', async () => {
      const seats = [{ seat: { id: 'a' }, schedule: {}, status: StatusSeat.HELD }];
      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue(seats);
      (mockScheduleSeatRepo.save as jest.Mock).mockImplementation((s) => s);

      await service['changeStatusScheduleSeatToBooked'](['a'], 1);
      expect(seats[0].status).toBe(StatusSeat.BOOKED);
      expect(mockScheduleSeatRepo.save).toHaveBeenCalledWith(seats[0]);
    });

    it('❌ 7.2 should throw NotFoundException if seats not found', async () => {
      (mockScheduleSeatRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service['changeStatusScheduleSeatToBooked'](['x'], 1)).rejects.toThrow(NotFoundException);
    });

    it('❌ 7.3 should throw NotFoundException if no seatIds', async () => {
      await expect(service['changeStatusScheduleSeatToBooked']([], 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('8.getTicketTypesByAudienceTypes', () => {
    it('✅ 8.1 should return ticket types', async () => {
      (mockTicketTypeRepo.find as jest.Mock).mockResolvedValue([{ audience_type: 'adult' }]);
      expect(await service['getTicketTypesByAudienceTypes'](['adult'])).toEqual([{ audience_type: 'adult' }]);
    });
    it('❌ 8.2 should throw NotFoundException if none found', async () => {
      (mockTicketTypeRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service['getTicketTypesByAudienceTypes'](['child'])).rejects.toThrow(NotFoundException);
    });
  });

  describe('8.getOrderExtraByIds', () => {
    it('✅ 8.1 should return products', async () => {
      (mockProductRepo.find as jest.Mock).mockResolvedValue([{ id: 1 }]);
      expect(await service['getOrderExtraByIds']([1])).toEqual([{ id: 1 }]);
    });
    it('❌ 8.2 should throw NotFoundException if none found', async () => {
      (mockProductRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service['getOrderExtraByIds']([99])).rejects.toThrow(NotFoundException);
    });
  });
});