import { BaseException } from './base.exception';
import { HttpStatus } from '@nestjs/common';

export class InternalServerErrorException extends BaseException {
  constructor(message = 'Something went wrong in the server', errorCode?: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
  }
}
