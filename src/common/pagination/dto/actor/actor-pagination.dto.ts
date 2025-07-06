import { BasePaginationDto } from "../basePagination.dto";
import { IsIn, IsOptional, IsString } from "class-validator";

export class ActorPaginationDto extends BasePaginationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    stage_name?: string;

 

    @IsOptional()
    @IsString()
    nationality?: string;

    @IsOptional()
    @IsString()
    date_of_birth?: string;
    
    @IsOptional()
    @IsIn(['male', 'female'], {
        message: 'Gender must be male or female',
    })
    gender?: string;

}
