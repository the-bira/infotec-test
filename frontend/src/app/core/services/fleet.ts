import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBrand, IModel, IVehicle, ICreateVehicleDto, IUpdateVehicleDto } from '@aivacol/shared';

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

  // --- Models ---
  getModels(): Observable<IModel[]> {
    return this.http.get<IModel[]>(`${this.apiUrl}/models`);
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
