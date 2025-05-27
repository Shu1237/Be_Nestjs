import { ApiProperty } from "@nestjs/swagger";


export class LogoutDto {

    @ApiProperty({
        description: 'The refresh token to be invalidated',
        type: String,
    })
    refreshToken: string;


}