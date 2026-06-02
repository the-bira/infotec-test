import { IModel } from './models.interfaces';

export interface IVehicle {
  id: number;
  license_plate: string;
  chassis: string;
  renavam: string;
  year: number;
  model_id: number;
  model?: IModel;
  tenant_id: string;
  created_by: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ICreateVehicleDto {
  license_plate: string;
  chassis: string;
  renavam: string;
  year: number;
  model_id: number;
}

export interface IUpdateVehicleDto {
  license_plate?: string;
  chassis?: string;
  renavam?: string;
  year?: number;
  model_id?: number;
}
