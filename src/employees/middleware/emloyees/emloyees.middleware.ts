import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class EmloyeesMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    next();
  }
}
