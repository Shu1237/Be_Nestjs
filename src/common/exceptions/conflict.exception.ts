import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class ConflictException extends BaseException {
  constructor(message = 'Conflict data ', errorCode?: string) {
    super(message, HttpStatus.CONFLICT, errorCode);
  }
}
