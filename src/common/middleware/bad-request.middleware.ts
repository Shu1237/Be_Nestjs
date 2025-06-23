import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BadRequestException } from '../exceptions/bad-request.exception';

@Injectable()
export class BadRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if ((req as any).route) {
      return next();
    }
    throw new BadRequestException();
  }
}
