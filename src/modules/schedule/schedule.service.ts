import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from 'src/database/entities/cinema/schedule';
import { Repository } from 'typeorm';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Movie } from 'src/database/entities/cinema/movie';
import { CinemaRoom } from 'src/database/entities/cinema/cinema-room';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ISchedule } from 'src/common/utils/type';
import { NotFoundException } from 'src/common/exceptions/not-found.exception';
import { Version } from 'src/database/entities/cinema/version';
import { BadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SchedulePaginationDto } from 'src/common/pagination/dto/shedule/schedulePagination.dto';
import { applyCommonFilters } from 'src/common/pagination/applyCommonFilters';
import { scheduleFieldMapping } from 'src/common/pagination/fillters/scheduleFieldMapping';
import { applySorting } from 'src/common/pagination/apply_sort';
import { applyPagination } from 'src/common/pagination/applyPagination';
import { buildPaginationResponse } from 'src/common/pagination/pagination-response';
@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,

    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,

    @InjectRepository(CinemaRoom)
    private readonly cinemaRoomRepository: Repository<CinemaRoom>,

    @InjectRepository(Version)
    private readonly versionRepository: Repository<Version>,
  ) { }
  private getScheduleSummary(schedule: Schedule): ISchedule {
    return {
      id: schedule.id,
      is_deleted: schedule.is_deleted,
      cinemaRoom: {
        id: schedule.cinemaRoom.id,
        name: schedule.cinemaRoom.cinema_room_name,
      },
      start_movie_time: schedule.start_movie_time,
      end_movie_time: schedule.end_movie_time,
      movie: {
        id: schedule.movie.id,
        name: schedule.movie.name,
      },
      version: schedule.version
        ? {
          id: schedule.version.id,
          name: schedule.version.name,
        }
        : null, // Nếu version là null, trả về null
    };
  }
  async findAllUser(): Promise<ISchedule[]> {
    const schedules = await this.scheduleRepository.find({
      where: { is_deleted: false },
      relations: ['movie', 'cinemaRoom', 'version'],
    });


    return schedules.map((schedule) => this.getScheduleSummary(schedule));
  }
  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<{ message: string }> {
    const {
      movie_id,
      cinema_room_id,
      start_movie_time,
      end_movie_time,
      id_Version,
    } = createScheduleDto;

    // Kiểm tra sự tồn tại của Movie
    const movie = await this.movieRepository.findOne({
      where: { id: movie_id },
      relations: ['versions'], // Load danh sách versions
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

    const version = await this.versionRepository.findOne({
      where: { id: id_Version },
    });
    if (!version) {
      throw new NotFoundException(`Version with ID ${id_Version} not found`);
    }

    const versionBelongsToMovie = movie.versions.some(
      (v) => v.id === id_Version,
    );
    if (!versionBelongsToMovie) {
      throw new BadRequestException(
        `Version ID ${id_Version} không thuộc movie ID ${movie_id}`,
      );
    }

    const overlappingSchedule = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.cinemaRoom = :cinemaRoomId', {
        cinemaRoomId: cinema_room_id,
      })
      .andWhere('schedule.start_movie_time < :end', { end: end_movie_time })
      .andWhere('schedule.end_movie_time > :start', { start: start_movie_time })
      .andWhere('schedule.is_deleted = false') // Chỉ kiểm tra các lịch chưa bị xóa
      .getOne();

    if (overlappingSchedule) {
      throw new BadRequestException(
        'Phòng chiếu đã có lịch chiếu trùng thời gian',
      );
    }

    // Tạo mới Schedule
    const schedule = this.scheduleRepository.create({
      start_movie_time: start_movie_time,
      end_movie_time: end_movie_time,
      movie,
      cinemaRoom,
      version, // Liên kết phiên bản cụ thể
    });

    await this.scheduleRepository.save(schedule);
    // Trả về dữ liệu đã gói gọn
    return {
      message: 'create successfully schedule', // Trả về phiên bản cụ thể
    };
  }
  async findAll(fillters: SchedulePaginationDto) {
    const qb = this.scheduleRepository.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.movie', 'movie')
      .leftJoinAndSelect('schedule.cinemaRoom', 'cinemaRoom')
      .leftJoinAndSelect('schedule.version', 'version');

    applyCommonFilters(qb, fillters, scheduleFieldMapping);
    const allowedFields = [
      'schedule.id',
      'movie.name',
      'version.id',
      'cinemaRoom.cinema_room_name',
    ];
    applySorting(qb, fillters.sortBy, fillters.sortOrder, allowedFields, 'schedule.id');

    applyPagination(qb, {
      page: fillters.page,
      take: fillters.take
    })

    const [schedules, total] = await qb.getManyAndCount();
    const summaries = schedules.map((schedule) =>
      this.getScheduleSummary(schedule),
    );

    const counts = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select([
        `SUM(CASE WHEN schedule.is_deleted = false THEN 1 ELSE 0 END) AS activeCount`,
        `SUM(CASE WHEN schedule.is_deleted = true THEN 1 ELSE 0 END) AS deletedCount`,
      ])
      .getRawOne();

    const activeCount = parseInt(counts.activeCount, 10) || 0;
    const deletedCount = parseInt(counts.deletedCount, 10) || 0;

    // Calculate schedule status counts
    const currentTime = new Date();
    const statusCounts = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .select([
        `SUM(CASE WHEN schedule.start_movie_time > :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS upcomingCount`,
        `SUM(CASE WHEN schedule.start_movie_time <= :currentTime AND schedule.end_movie_time >= :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS nowPlayingCount`,
        `SUM(CASE WHEN schedule.end_movie_time < :currentTime AND schedule.is_deleted = false THEN 1 ELSE 0 END) AS completedCount`,
      ])
      .setParameters({ currentTime })
      .getRawOne();

    const nowPlayingSchedule = parseInt(statusCounts.nowPlayingCount, 10) || 0;
    const upComingSchedule = parseInt(statusCounts.upcomingCount, 10) || 0;
    const completedSchedule = parseInt(statusCounts.completedCount, 10) || 0;

    return buildPaginationResponse(summaries, {
      total,
      page: fillters.page,
      take: fillters.take,
      activeCount,
      deletedCount,
      nowPlayingSchedule,
      upComingSchedule,
      completedSchedule,
    });
  }


  async find(): Promise<ISchedule[]> {
    const schedules = await this.scheduleRepository.find({
      relations: ['movie', 'cinemaRoom', 'version'],
    });

    // Gói gọn dữ liệu trả về
    return schedules.map((schedule) => this.getScheduleSummary(schedule));
  }


  async findOut(id: number): Promise<ISchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['movie', 'cinemaRoom', 'movie.versions', 'version'], // Load các quan hệ liên quan
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return this.getScheduleSummary(schedule);
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<{ message: string }> {
    const { movie_id, cinema_room_id, start_movie_time, end_movie_time } =
      updateScheduleDto;

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
      schedule.start_movie_time = new Date(start_movie_time);
      schedule.end_movie_time = new Date(end_movie_time);
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

    await this.scheduleRepository.save(schedule);

    // Trả về dữ liệu đã gói gọn
    return {
      message: 'update successfully schedule',
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

  async restoreSchedule(
    id: number,
  ): Promise<{ msg: string; schedule: Schedule }> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    if (!schedule.is_deleted) {
      throw new BadRequestException(
        `Schedule with ID ${id} is not soft-deleted`,
      );
    }
    schedule.is_deleted = false;
    await this.scheduleRepository.save(schedule);
    return { msg: 'Schedule restored successfully', schedule };
  }
}
