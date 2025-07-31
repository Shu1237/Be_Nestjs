import { IsOptional, IsBoolean } from 'class-validator';

import { BasePaginationDto } from '../basePagination.dto';
import { Transform } from 'class-transformer';

export class CinemaRoomPaginationDto extends BasePaginationDto {

    @Transform(({ value }) => value === 'true' || value === true)
    @IsOptional()
    @IsBoolean()
    is_deleted?: boolean;

}
