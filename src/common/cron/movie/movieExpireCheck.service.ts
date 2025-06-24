import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from 'src/database/entities/cinema/movie';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class MovieExpireCheckService {
  private readonly logger = new Logger(MovieExpireCheckService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  // Chạy mỗi ngày lúc 0h
  @Cron('0 0 * * *', { name: 'expire-movies' })
  async handleExpireMovies() {
    const now = new Date();
    // Tìm các phim chưa bị đánh dấu hết hạn nhưng đã hết hạn
    const expiredMovies = await this.movieRepository.find({
      where: {
        to_date: LessThan(now),
        is_deleted: false,
      },
    });

    if (expiredMovies.length > 0) {
      for (const movie of expiredMovies) {
        movie.is_deleted = true;
      }
      await this.movieRepository.save(expiredMovies);
      this.logger.log(`Expired ${expiredMovies.length} movies`);
    } else {
      this.logger.log('No movies expired today');
    }
  }
}