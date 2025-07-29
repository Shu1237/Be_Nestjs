import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from 'src/database/entities/order/ticket';
import { User } from 'src/database/entities/user/user';
import { TicketService } from './ticket.service';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';

describe('TicketService', () => {
  let service: TicketService;
  let mockTicketRepo: Partial<Repository<Ticket>>;
  let mockUserRepo: Partial<Repository<User>>;

  beforeEach(async () => {
    mockTicketRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
  });

  describe('1.markTicketsAsUsed', () => {
    it('✅ 1.1 should mark all found tickets as used', async () => {
      const fakeTickets = [
        { id: 'a', is_used: false },
        { id: 'b', is_used: false },
      ];
      (mockTicketRepo.find as jest.Mock).mockResolvedValue([
        { id: 'a', is_used: false },
        { id: 'b', is_used: false },
      ]);
      (mockTicketRepo.save as jest.Mock).mockResolvedValue([
        { id: 'a', is_used: true },
        { id: 'b', is_used: true },
      ]);

      await service.markTicketsAsUsed(['a', 'b']);
      expect(mockTicketRepo.save).toHaveBeenCalledWith([
        { id: 'a', is_used: true },
        { id: 'b', is_used: true },
      ]);
    });

    it('❌ 1.2 should throw NotFoundException if no tickets found', async () => {
      (mockTicketRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.markTicketsAsUsed(['a', 'b'])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 1.3 should throw BadRequestException if any ticket is already used or invalid', async () => {
      // Only one ticket found, the other is missing/used
      (mockTicketRepo.find as jest.Mock).mockResolvedValue([
        { id: 'a', is_used: false },
      ]);
      await expect(service.markTicketsAsUsed(['a', 'b'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
