import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { Movie } from 'src/database/entities/cinema/movie';
import { Actor } from 'src/database/entities/cinema/actor';
import { Gerne } from 'src/database/entities/cinema/gerne';
import { Version } from 'src/database/entities/cinema/version';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Actor, Gerne, Version])],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
