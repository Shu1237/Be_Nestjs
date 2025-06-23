import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class ForbiddenException extends BaseException {
  constructor(message = 'Access denied', errorCode?: string) {
    super(message, HttpStatus.FORBIDDEN, errorCode);
  }
}
