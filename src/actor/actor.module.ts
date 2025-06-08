import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActorController } from './actor.controller';
import { ActorService } from './actor.service';
import { Actor } from '../typeorm/entities/cinema/actor';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@Module({
  imports: [TypeOrmModule.forFeature([Actor, Movie])],
  controllers: [ActorController],
  providers: [ActorService],
  exports: [ActorService],
})
export class ActorModule {}
