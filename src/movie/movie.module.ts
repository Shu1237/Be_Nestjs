import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule

import { Movie } from 'src/typeorm/entities/cinema/movie';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';



@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]), // Import entity Movie
    JwtModule.register({}), // Import JwtModule
  ],
  controllers: [MovieController],
  providers: [MovieService], 
})
export class MovieModule {}
