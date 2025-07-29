import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BadRequestException extends BaseException {
  constructor(message = 'Endpoint or invalid request', errorCode?: string) {
    super(message, HttpStatus.BAD_REQUEST, errorCode);
  }
}
