export interface IBrand {
  id: number;
  name: string;
  tenant_id: string;
  created_by: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface ICreateBrandDto {
  name: string;
}

export interface IUpdateBrandDto {
  name: string;
}
