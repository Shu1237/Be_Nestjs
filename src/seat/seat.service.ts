// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Seat } from '../typeorm/entities/cinema/seat';
// import { CreateSeatDto } from './dto/create-seat.dto';
// import { UpdateSeatDto } from './dto/update-seat.dto';

// @Injectable()
// export class SeatService {
//   constructor(
//     @InjectRepository(Seat)
//     private readonly seatRepository: Repository<Seat>,
//   ) {}

//   async create(createSeatDto: CreateSeatDto): Promise<Seat> {
//     const seat = this.seatRepository.create(createSeatDto);
//     return await this.seatRepository.save(seat);
//   }

//   async findAll(): Promise<Seat[]> {
//     return await this.seatRepository.find();
//   }

//   async findOne(id: number): Promise<Seat> {
//     const seat = await this.seatRepository.findOne({ where: { id } });
//     if (!seat) {
//       throw new NotFoundException(`Seat with ID ${id} not found`);
//     }
//     return seat;
//   }

//   async update(id: number, updateSeatDto: UpdateSeatDto): Promise<Seat> {
//     const seat = await this.findOne(id);
//     Object.assign(seat, updateSeatDto);
//     return await this.seatRepository.save(seat);
//   }

//   async remove(id: number): Promise<void> {
//     const seat = await this.findOne(id);
//     await this.seatRepository.remove(seat);
//   }
// }