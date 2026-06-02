import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  license_plate: string;

  @IsString()
  @IsNotEmpty()
  chassis: string;

  @IsString()
  @IsNotEmpty()
  renavam: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  model_id: number;
}
