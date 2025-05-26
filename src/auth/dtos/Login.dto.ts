import { IsNotEmpty, IsString } from "class-validator";


export class LoginDto {

    @IsString()
    @IsNotEmpty()
    USERNAME: string;
    
    @IsString()
    @IsNotEmpty()
    PASSWORD: string;
    
  

}