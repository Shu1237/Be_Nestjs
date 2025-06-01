// app.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@Controller()
export class AppController {
    constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

    @Get()
    someProtectedRoute(@Req() req) {
     return { message: 'Accessed Resource'};
    }
}
