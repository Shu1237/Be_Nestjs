import { Controller, Get, Req } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  someProtectedRoute(@Req() req) {
    return { message: 'Accessed Resource' };
  }
}
