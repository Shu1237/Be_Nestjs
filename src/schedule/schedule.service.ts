import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from 'src/typeorm/entities/cinema/schedule';
import { In, Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { CinemaRoom } from 'src/typeorm/entities/cinema/cinema-room';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ISchedule } from 'src/utils/type';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,
  ) { }

  async create(createScheduleDto: CreateScheduleDto): Promise<ISchedule> {
    const { movie_id, cinema_room_id, start_movie_time, end_movie_time } = createScheduleDto;

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
      start_movie_time, end_movie_time,
      movie,
      cinemaRoom,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Trả về dữ liệu đã gói gọn
    return {
      id: savedSchedule.id,
      cinema_room_id: savedSchedule.cinemaRoom.id,
      start_movie_time: savedSchedule.start_movie_time,
      end_movie_time: savedSchedule.end_movie_time,
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
      start_movie_time: schedule.start_movie_time,
      end_movie_time: schedule.end_movie_time,
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
      start_movie_time: schedule.start_movie_time,
      end_movie_time: schedule.end_movie_time,
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
    const { movie_id, cinema_room_id, start_movie_time, end_movie_time } = updateScheduleDto;

    // Tìm Schedule theo ID
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['movie', 'cinemaRoom'], // Lấy các quan hệ liên quan
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Cập nhật ngày chiếu nếu có
    if (start_movie_time) {
      schedule.start_movie_time = start_movie_time;
      schedule.end_movie_time = end_movie_time; // Cập nhật thời gian kết thúc
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
      start_movie_time: updatedSchedule.start_movie_time,
      end_movie_time: updatedSchedule.end_movie_time,
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

  async softDeleteSchedule(
    id: number,
  ): Promise<{ msg: string; schedule: Schedule }> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    schedule.is_deleted = true; // Đánh dấu là đã xóa
    await this.scheduleRepository.save(schedule);

    return { msg: 'Schedule soft-deleted successfully', schedule };
  }
}
