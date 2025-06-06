import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../typeorm/entities/user/user';
import { Role } from '../typeorm/entities/user/roles';
import { Member } from '../typeorm/entities/user/member';

import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Member]), RolesModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
