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

  async getSeatTypeById(id: number) {
    const seatType = await this.seatTypeRepository.findOne({
      where: { id },
    });
    if (!seatType) {
      throw new NotFoundException('Seat type not found');
    }
    return seatType;
  }

  async createSeatType(createSeatTypeDto: CreateSeatTypeDto) {
    const seatType = this.seatTypeRepository.create(createSeatTypeDto);
    return this.seatTypeRepository.save(seatType);
  }

  async updateSeatType(id: number, updateSeatTypeDto: UpdateSeatTypeDto) {
    const seatType = await this.getSeatTypeById(id);
    Object.assign(seatType, updateSeatTypeDto);
    return this.seatTypeRepository.save(seatType);
  }

  async deleteSeatType(id: number) {
    const seatType = await this.getSeatTypeById(id);
    return this.seatTypeRepository.remove(seatType);
  }
}
