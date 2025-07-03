import {
    IsIn,
    IsOptional,
    IsString,
    IsNumber,
    Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StatusOrderWithAll, StatusOrderWithAllType } from 'src/common/enums/status-order.enum';


export class GetAllOrdersDto {
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @IsOptional()
    page: number = 1;

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @IsOptional()
    limit: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsIn(StatusOrderWithAll, {
        message: `status must be one of: ${StatusOrderWithAll.join(', ')}`,
    })
    status?: StatusOrderWithAllType;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'sortOrder must be ASC or DESC',
    })
    sortOrder?: 'ASC' | 'DESC';

    @IsOptional()
    @IsString()
    paymentMethod?: string;
}
