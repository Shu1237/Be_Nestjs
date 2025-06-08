import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Movie } from 'src/typeorm/entities/cinema/movie';
import { Actor } from 'src/typeorm/entities/cinema/actor';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { Version } from 'src/typeorm/entities/cinema/version';

@Module({
  imports: [TypeOrmModule.forFeature([Movie,Actor, Gerne,Version])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
