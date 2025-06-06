import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionService } from './version.service';
import { VersionController } from './version.controller';
import { Version } from 'src/typeorm/entities/cinema/version';
import { Movie } from 'src/typeorm/entities/cinema/movie';

@Module({
  imports: [TypeOrmModule.forFeature([Version,Movie])],
  controllers: [VersionController],
  providers: [VersionService],
})
export class VersionModule {}