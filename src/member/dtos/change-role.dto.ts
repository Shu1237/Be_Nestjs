import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/enum/roles.enum';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'New role ID for the user (1: User, 2: Employee, 3: Admin)',
    enum: Role,
  })
  @IsEnum(Role)
  role_id: Role;
}
