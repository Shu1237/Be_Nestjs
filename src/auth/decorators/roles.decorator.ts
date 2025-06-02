import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../../typeorm/entities/user/roles';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
