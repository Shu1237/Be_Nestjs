import { Role } from '../enums/roles.enum';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { JWTUserType } from '../utils/type';

export const checkAdminEmployeeRole = (user: JWTUserType, msg: string) => {
  if (user.role_id !== Role.ADMIN && user.role_id !== Role.EMPLOYEE) {
    throw new ForbiddenException(msg);
  }
};
