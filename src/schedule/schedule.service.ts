import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { In, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { CinemaRoom } from 'src/typeorm/entities/cinema/cinema-room';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ISchedule } from 'src/utils/type';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<ISchedule> {
    const { movie_id, cinema_room_id, show_date } = createScheduleDto;

    // Kiểm tra sự tồn tại của Movie
    const movie = await this.movieRepository.findOne({
      where: { id: movie_id },
      select: ['id', 'name'], // Chỉ lấy id và name
    });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movie_id} not found`);
    }

    // Kiểm tra sự tồn tại của Cinema Room
    const cinemaRoom = await this.cinemaRoomRepository.findOne({
      where: { id: cinema_room_id },
      select: ['id', 'cinema_room_name'], // Chỉ lấy id và name
    });
    if (!cinemaRoom) {
      throw new NotFoundException(
        `Cinema Room with ID ${cinema_room_id} not found`,
      );
    }

    // Tạo mới Schedule
    const schedule = this.scheduleRepository.create({
      show_date,
      movie,
      cinemaRoom,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Trả về dữ liệu đã gói gọn
    return {
      id: savedSchedule.id,
      cinema_room_id: savedSchedule.cinemaRoom.id,
      show_date: savedSchedule.show_date,
      movie: {
        id: savedSchedule.movie.id,
        name: savedSchedule.movie.name,
      },
    };
  }
  async find(): Promise<ISchedule[]> {
    const schedules = await this.scheduleRepository.find({
      relations: ['movie', 'cinemaRoom'], // Lấy thông tin liên quan đến movie và cinemaRoom
    });

    // Gói gọn dữ liệu trả về
    return schedules.map((schedule) => ({
      id: schedule.id,
      cinema_room_id: schedule.cinemaRoom.id,
      show_date: schedule.show_date,
      movie: {
        id: schedule.movie.id,
        name: schedule.movie.name,
      },
    }));
  }

  async findOut(id: number): Promise<ISchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['movie', 'cinemaRoom'], // Lấy thông tin liên quan đến movie và cinemaRoom
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Gói gọn dữ liệu trả về
    return {
      id: schedule.id,
      cinema_room_id: schedule.cinemaRoom.id,
      show_date: schedule.show_date,
      movie: {
        id: schedule.movie.id,
        name: schedule.movie.name,
      },
    };
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ISchedule> {
    const { movie_id, cinema_room_id, show_date } = updateScheduleDto;

    // Tìm Schedule theo ID
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['movie', 'cinemaRoom'], // Lấy các quan hệ liên quan
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Cập nhật ngày chiếu nếu có
    if (show_date) {
      schedule.show_date = show_date;
    }

    // Cập nhật Movie nếu có
    if (movie_id) {
      const movie = await this.movieRepository.findOne({
        where: { id: movie_id },
        select: ['id', 'name'], // Chỉ lấy id và name
      });
      if (!movie) {
        throw new NotFoundException(`Movie with ID ${movie_id} not found`);
      }
      schedule.movie = movie;
    }

    // Cập nhật Cinema Room nếu có
    if (cinema_room_id) {
      const cinemaRoom = await this.cinemaRoomRepository.findOne({
        where: { id: cinema_room_id },
        select: ['id', 'cinema_room_name'], // Chỉ lấy id và name
      });
      if (!cinemaRoom) {
        throw new NotFoundException(
          `Cinema Room with ID ${cinema_room_id} not found`,
        );
      }
      schedule.cinemaRoom = cinemaRoom;
    }

    const updatedSchedule = await this.scheduleRepository.save(schedule);

    // Trả về dữ liệu đã gói gọn
    return {
      id: updatedSchedule.id,
      cinema_room_id: updatedSchedule.cinemaRoom.id,
      show_date: updatedSchedule.show_date,
      movie: {
        id: updatedSchedule.movie.id,
        name: updatedSchedule.movie.name,
      },
    };
  }

  async softDelete(id: number): Promise<void> {
    const result = await this.scheduleRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Schedule not found');
    }
  }
}
