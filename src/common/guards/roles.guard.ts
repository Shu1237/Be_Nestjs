import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/roles.enum';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { JWTUserType } from '../utils/type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as JWTUserType 
    const hasRole= requiredRoles.includes(user.role_id);
    if( !hasRole ) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.map(role => this.getRoleName(role)).join(', ')}`);
    }
    return true;
  }

  private getRoleName(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'Admin';
      case Role.EMPLOYEE:
        return 'Employee';
      case Role.USER:
        return 'User';
      default:
        return 'Unknown';
    }
  }

}