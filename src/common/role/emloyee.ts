import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import { JWTUserType } from '../utils/type';

export const checkEmployeeRole = (user: JWTUserType, msg: string) => {
  if (user.role_id !== Role.EMPLOYEE) {
    throw new ForbiddenException(msg);
  }
};
