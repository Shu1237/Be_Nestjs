import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from 'src/typeorm/entities/user/roles';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'New role ID for the user (1: Member, 2: Employee, 3: Admin)',
    enum: RoleType,
  })
  @IsEnum(RoleType)
  role_id: RoleType;
}
