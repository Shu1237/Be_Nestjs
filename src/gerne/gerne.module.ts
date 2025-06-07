import { Controller, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gerne } from 'src/typeorm/entities/cinema/gerne';
import { GerneService } from './gerne.service';
import { GerneController } from './gerne.controller';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@Module({
  imports: [TypeOrmModule.forFeature([Gerne, Movie])],
  controllers: [GerneController],
  providers: [GerneService],
  exports: [GerneService],
})
export class GerneModule {}
