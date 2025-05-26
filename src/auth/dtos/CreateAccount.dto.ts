import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDateString,
  Length,
  Matches,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  ADDRESS: string;

  @IsDateString()
  @IsNotEmpty()
  DATE_OF_BIRTH: Date;

  @IsEmail()
  @IsNotEmpty()
  EMAIL: string;

  @IsString()
  @IsNotEmpty()
  FULL_NAME: string;

  @IsString()
  @IsNotEmpty()
  GENDER: number;

  @IsString()
  @Length(9, 12)
  IDENTITY_CARD: string;

  @IsString()
  @IsOptional()
  IMAGE: string;

  @IsString()
  @Length(6, 32)
  PASSWORD: string;

  @IsString()
  @Matches(/^\d{10,11}$/, { message: 'PHONE_NUMBER must be 10-11 digits' })
  PHONE_NUMBER: string;

  @IsString()
  @IsNotEmpty()
  USERNAME: string;

  @IsOptional()
  @IsNumber()
  ROLE_ID?: number; // Optional: nếu không có thì mặc định là user
}
