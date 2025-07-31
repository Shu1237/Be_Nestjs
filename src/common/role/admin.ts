import { Role } from '../enums/roles.enum';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { JWTUserType } from '../utils/type';

export const checkAdminRole = (user: JWTUserType, msg: string) => {
  if (user.role_id !== Role.ADMIN) {
    throw new ForbiddenException(msg);
  }
};
