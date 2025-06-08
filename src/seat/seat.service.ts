import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from 'src/typeorm/entities/cinema/seat';
import { CreateSeatDto } from './dto/create-seat.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
  ) {}

  async getAllSeats() {
    return this.seatRepository.find({
      relations: ['seatType', 'cinemaRoom'],
    });
  }

  async getSeatById(id: string) {
    const seat = await this.seatRepository.findOne({
      where: { id },
      relations: ['seatType', 'cinemaRoom'],
    });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }
    return seat;
  }

  async getSeatsByRoom(roomId: string) {
    return this.seatRepository.find({
      where: { cinemaRoom: { id: parseInt(roomId) } },
      relations: ['seatType'],
    });
  }

  async createSeat(createSeatDto: CreateSeatDto) {
    const seat = this.seatRepository.create(createSeatDto);
    return this.seatRepository.save(seat);
  }

  async updateSeat(id: string, updateSeatDto: UpdateSeatDto) {
    const seat = await this.getSeatById(id);
    Object.assign(seat, updateSeatDto);
    return this.seatRepository.save(seat);
  }

  async deleteSeat(id: string) {
    const seat = await this.getSeatById(id);
    return this.seatRepository.remove(seat);
  }

  async updateSeatStatus(id: string, status: boolean) {
    const seat = await this.getSeatById(id);
    seat.status = status;
    return this.seatRepository.save(seat);
  }
}
