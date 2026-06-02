import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  license_plate?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  chassis?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  renavam?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  model_id?: number;
}
