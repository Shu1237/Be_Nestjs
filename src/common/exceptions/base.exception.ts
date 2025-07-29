import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(message: string, statusCode: HttpStatus, errorCode?: string) {
    super(
      {
        statusCode,
        message,
        errorCode,
      },
      statusCode,
    );
  }
}
