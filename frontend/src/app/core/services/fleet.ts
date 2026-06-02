import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IBrand,
  ICreateBrandDto,
  IUpdateBrandDto,
  IModel,
  ICreateModelDto,
  IUpdateModelDto,
  IVehicle,
  ICreateVehicleDto,
  IUpdateVehicleDto
} from '@aivacol/shared';

@Injectable({
  providedIn: 'root',
})
export class FleetService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // --- Brands ---
  getBrands(): Observable<IBrand[]> {
    return this.http.get<IBrand[]>(`${this.apiUrl}/brands`);
  }

  createBrand(brand: ICreateBrandDto): Observable<IBrand> {
    return this.http.post<IBrand>(`${this.apiUrl}/brands`, brand);
  }

  updateBrand(id: number, brand: IUpdateBrandDto): Observable<IBrand> {
    return this.http.put<IBrand>(`${this.apiUrl}/brands/${id}`, brand);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/brands/${id}`);
  }

  // --- Models ---
  getModels(): Observable<IModel[]> {
    return this.http.get<IModel[]>(`${this.apiUrl}/models`);
  }

  createModel(model: ICreateModelDto): Observable<IModel> {
    return this.http.post<IModel>(`${this.apiUrl}/models`, model);
  }

  updateModel(id: number, model: IUpdateModelDto): Observable<IModel> {
    return this.http.put<IModel>(`${this.apiUrl}/models/${id}`, model);
  }

  deleteModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/models/${id}`);
  }

  // --- Vehicles ---
  getVehicles(): Observable<IVehicle[]> {
    return this.http.get<IVehicle[]>(`${this.apiUrl}/vehicles`);
  }

  getVehicle(id: number): Observable<IVehicle> {
    return this.http.get<IVehicle>(`${this.apiUrl}/vehicles/${id}`);
  }

  createVehicle(vehicle: ICreateVehicleDto): Observable<IVehicle> {
    return this.http.post<IVehicle>(`${this.apiUrl}/vehicles`, vehicle);
  }

  updateVehicle(id: number, vehicle: IUpdateVehicleDto): Observable<IVehicle> {
    return this.http.put<IVehicle>(`${this.apiUrl}/vehicles/${id}`, vehicle);
  }

  deleteVehicle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vehicles/${id}`);
  }
}
