import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class LoginGoogleDto {
  @IsNotEmpty()
  @IsString()
  googleToken: string;

  @IsNotEmpty()
  @IsString()
  clientID: string;

  @IsOptional()
  @IsString()
  ADDRESS?: string;

  @IsOptional()
  @IsString()
  DATE_OF_BIRTH?: string;

  @IsOptional()
  @IsString()
  GENDER?: string;

  @IsOptional()
  @IsString()
  IDENTITY_CARD?: string;

  @IsOptional()
  @IsString()
  PHONE_NUMBER?: string;
}
