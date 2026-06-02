import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateModelDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
