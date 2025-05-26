// app.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './guards/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
    constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}


    @Get()
    someProtectedRoute(@Req() req) {
        const user = req.user;
        return {
            message: 'Accessed protected resource',
            userID: user?.ACCOUNT_ID,
            username: user?.USERNAME,
            role: user?.ROLE_ID,
        };
    }
}
