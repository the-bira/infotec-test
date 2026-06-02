import { IBrand } from './brands.interfaces';

export interface IModel {
  id: number;
  name: string;
  brand_id: number;
  brand?: IBrand;
  tenant_id: string;
  created_by: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ICreateModelDto {
  name: string;
  brand_id: number;
}

export interface IUpdateModelDto {
  name?: string;
  brand_id?: number;
}
