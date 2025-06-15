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
      throw new NotFoundException(`Seat type with ID ${id} not found`);
    }
    return seatType;
  }

  async createSeatType(createSeatTypeDto: CreateSeatTypeDto) {
    const seatType = this.seatTypeRepository.create(createSeatTypeDto);
    await this.seatTypeRepository.save(seatType);
    return { msg: 'Seat type created successfully' };
  }

  async updateSeatType(id: string, updateSeatTypeDto: UpdateSeatTypeDto) {
    const seatType = await this.getSeatTypeById(id);
    Object.assign(seatType, updateSeatTypeDto);
    await this.seatTypeRepository.save(seatType);
    return { msg: 'Seat type updated successfully' };
  }

  async deleteSeatType(id: string) {
    const seatType = await this.getSeatTypeById(id);
    await this.seatTypeRepository.remove(seatType);
    return { msg: 'Seat type deleted successfully' };
  }
}
