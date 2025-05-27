// app.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App') // Nhóm hiển thị trong Swagger UI
@ApiBearerAuth() // Cho phép gửi Authorization: Bearer <token>
@UseGuards(JwtAuthGuard)
@Controller()
export class AppController {
    constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

    @Get()
    @ApiOperation({ summary: 'Access protected route with JWT' })
    @ApiResponse({
        status: 200,
        description: 'Successfully accessed protected route',
        schema: {
            example: {
                message: 'Accessed protected resource',
                userID: 1,
                username: 'john_doe',
                role: 3,
            }
        }
    })
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
