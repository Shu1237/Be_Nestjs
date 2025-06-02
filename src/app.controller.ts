// app.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller()
export class AppController {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  @Get()
  someProtectedRoute(@Req() req) {
    return { message: 'Accessed Resource' };
  }
}
