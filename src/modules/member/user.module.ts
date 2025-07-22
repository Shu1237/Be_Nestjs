import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user/user';
import { Role } from '../../database/entities/user/roles';

import { UserService } from './services/user.service';

import { UserController } from './controllers/user.controller';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';


@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserService, ProfileService],
  controllers: [UserController, ProfileController],
  exports: [UserService, ProfileService],
})
export class UserModule {}
