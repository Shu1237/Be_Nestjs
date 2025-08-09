import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatType } from 'src/database/entities/cinema/seat-type';
import { CreateSeatTypeDto } from './dto/create-seat-type.dto';
import { UpdateSeatTypeDto } from './dto/update-seat-type.dto';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';

@Injectable()
export class SeatTypeService {
  constructor(
    @InjectRepository(SeatType)
    private seatTypeRepository: Repository<SeatType>,
  ) {}

  async getAllSeatTypes() {
    return this.seatTypeRepository.find();
  }

  async getSeatTypeById(id: string) : Promise<SeatType> {
    const seatType = await this.seatTypeRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!seatType) {
      throw new NotFoundException(`Seat type with ID ${id} not found`);
    }
    return seatType;
  }

  async createSeatType(createSeatTypeDto: CreateSeatTypeDto) : Promise<{ msg: string }> {
    const seatType = this.seatTypeRepository.create(createSeatTypeDto);
    await this.seatTypeRepository.save(seatType);
    return { msg: 'Seat type created successfully' };
  }

  async updateSeatType(id: string, updateSeatTypeDto: UpdateSeatTypeDto) : Promise<{ msg: string }> {
    const seatType = await this.getSeatTypeById(id);
    Object.assign(seatType, updateSeatTypeDto);
    await this.seatTypeRepository.save(seatType);
    return { msg: 'Seat type updated successfully' };
  }

  async deleteSeatType(id: string) : Promise<{ msg: string }> {
    const seatType = await this.getSeatTypeById(id);
    await this.seatTypeRepository.remove(seatType);
    return { msg: 'Seat type deleted successfully' };
  }
}
