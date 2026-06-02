import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FleetService } from '../../core/services/fleet';
import { Auth } from '../../core/services/auth';
import { IVehicle } from '@aivacol/shared';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-vehicles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './vehicles-list.html',
  styleUrls: ['./vehicles-list.css']
})
export class VehiclesList implements OnInit {
  vehicles: IVehicle[] = [];
  filteredVehicles: IVehicle[] = [];
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  username = '';
  tenantId = '';

  constructor(
    private fleetService: FleetService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.username = this.auth.getNickname() || 'Usuário';
    this.tenantId = this.auth.getTenantId() || '';
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.fleetService.getVehicles()
      .pipe(
        timeout(8000),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges(); // força re-render independente de zona
        })
      )
      .subscribe({
        next: (data) => {
          this.vehicles = data;
          this.applyFilter();
        },
        error: (err) => {
          if (err?.name === 'TimeoutError') {
            this.errorMessage = 'Timeout: o backend não respondeu em 8 segundos. Verifique se o Docker está rodando corretamente.';
          } else {
            this.errorMessage = `Erro ${err?.status ?? '0'}: ${err?.message ?? 'sem conexão'}. Verifique se o backend está acessível em localhost:3000.`;
          }
          console.error('Erro ao buscar veículos:', err);
        }
      });
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredVehicles = this.vehicles;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredVehicles = this.vehicles.filter((v) => {
      const modelName = v.model?.name || '';
      const brandName = v.model?.brand?.name || '';
      return (
        v.license_plate.toLowerCase().includes(query) ||
        modelName.toLowerCase().includes(query) ||
        brandName.toLowerCase().includes(query) ||
        v.year.toString().includes(query)
      );
    });
  }

  onDelete(id: number): void {
    if (confirm('Deseja realmente excluir este veículo? Esta ação não pode ser desfeita.')) {
      this.fleetService.deleteVehicle(id).subscribe({
        next: () => {
          this.vehicles = this.vehicles.filter((v) => v.id !== id);
          this.applyFilter();
        },
        error: (err) => {
          console.error('Erro ao excluir veículo:', err);
          alert('Erro ao excluir o veículo. Tente novamente.');
        }
      });
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
