import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatType } from 'src/typeorm/entities/cinema/seat-type';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';

@Injectable()
export class SeatTypeService {
  constructor(
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
  ) {}

  async getAllSeatTypes() {
    return this.seatTypeRepository.find();
  }

  async getSeatTypeById(id: string) {
    const seatType = await this.seatTypeRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!seatType) {
      throw new NotFoundException('Seat type not found');
    }
    return seatType;
  }

  async createSeatType(createSeatTypeDto: CreateSeatTypeDto) {
    const seatType = new SeatType();
    seatType.seat_type_name = createSeatTypeDto.seat_type_name;
    seatType.seat_type_price = createSeatTypeDto.seat_type_price;
    return this.seatTypeRepository.save(seatType);
  }

  async updateSeatType(id: string, updateSeatTypeDto: UpdateSeatTypeDto) {
    const seatType = await this.getSeatTypeById(id);
    if (updateSeatTypeDto.seat_type_name !== undefined) {
      seatType.seat_type_name = updateSeatTypeDto.seat_type_name;
    }
    if (updateSeatTypeDto.seat_type_price !== undefined) {
      seatType.seat_type_price = updateSeatTypeDto.seat_type_price;
    }
    return this.seatTypeRepository.save(seatType);
  }

  async deleteSeatType(id: string) {
    const seatType = await this.getSeatTypeById(id);
    return this.seatTypeRepository.remove(seatType);
  }
}
