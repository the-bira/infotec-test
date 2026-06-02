import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FleetService } from '../../core/services/fleet';
import { IBrand, IModel } from '@aivacol/shared';
import { z } from 'zod';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Taiga UI
import { TuiButton, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';

const vehicleSchema = z.object({
  license_plate: z.string().min(7, 'Placa deve ter pelo menos 7 caracteres.').max(8, 'Placa inválida.'),
  chassis: z.string().min(17, 'Chassi deve ter exatamente 17 caracteres.').max(17, 'Chassi deve ter exatamente 17 caracteres.'),
  renavam: z.string().min(11, 'Renavam deve ter exatamente 11 dígitos.').max(11, 'Renavam deve ter exatamente 11 dígitos.'),
  year: z.number().int().min(1900, 'Ano inválido.').max(new Date().getFullYear() + 2, 'Ano inválido.'),
  model_id: z.number().min(1, 'Modelo é obrigatório.')
});

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TuiButton,
    TuiTextfield,
    TuiInput,
    TuiLabel
  ],
  templateUrl: './vehicle-form.html',
  styleUrls: ['./vehicle-form.css']
})
export class VehicleForm implements OnInit {
  vehicleForm: FormGroup;
  isEditMode = false;
  vehicleId?: number;
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  brands: IBrand[] = [];
  allModels: IModel[] = [];
  filteredModels: IModel[] = [];
  selectedBrandId?: number;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.vehicleForm = this.fb.group({
      license_plate: ['', [Validators.required]],
      chassis: ['', [Validators.required]],
      renavam: ['', [Validators.required]],
      year: [new Date().getFullYear(), [Validators.required]],
      brand_id: ['', [Validators.required]],
      model_id: [{ value: '', disabled: true }, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // forkJoin dispara as duas requisições em paralelo e só emite quando ambas completam
    forkJoin({
      brands: this.fleetService.getBrands(),
      models: this.fleetService.getModels()
    })
      .pipe(
        // finalize = "finally": sempre executa ao completar ou ao dar erro
        finalize(() => {
          const idParam = this.route.snapshot.paramMap.get('id');
          if (idParam) {
            // Modo edição: isLoading fica true até loadVehicleForEdit terminar
            this.isEditMode = true;
            this.vehicleId = Number(idParam);
            this.loadVehicleForEdit(this.vehicleId);
          } else {
            // Modo criação: libera o loading aqui
            this.isLoading = false;
          }
        })
      )
      .subscribe({
        next: ({ brands, models }) => {
          this.brands = brands;
          this.allModels = models;
        },
        error: (err) => {
          console.error('Erro ao carregar dados iniciais:', err);
          this.errorMessage = `Erro ao carregar dados (${err?.status ?? 'sem conexão'}). Verifique se o backend está rodando.`;
        }
      });
  }

  loadVehicleForEdit(id: number): void {
    this.fleetService.getVehicle(id)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (vehicle) => {
          this.selectedBrandId = vehicle.model?.brand_id;
          this.filterModelsByBrand(this.selectedBrandId);

          if (this.selectedBrandId) {
            this.vehicleForm.get('model_id')?.enable();
          }

          this.vehicleForm.patchValue({
            license_plate: vehicle.license_plate,
            chassis: vehicle.chassis,
            renavam: vehicle.renavam,
            year: vehicle.year,
            brand_id: this.selectedBrandId,
            model_id: vehicle.model_id
          });
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Não foi possível carregar os dados do veículo. Verifique o console.';
        }
      });
  }

  onBrandChange(event: any): void {
    const brandIdValue = event.target.value;
    const brandId = brandIdValue ? Number(brandIdValue) : undefined;
    this.selectedBrandId = brandId;

    this.filterModelsByBrand(brandId);

    const modelCtrl = this.vehicleForm.get('model_id');
    modelCtrl?.setValue('');
    if (brandId) {
      modelCtrl?.enable();
    } else {
      modelCtrl?.disable();
    }
  }

  filterModelsByBrand(brandId?: number): void {
    if (!brandId) {
      this.filteredModels = [];
    } else {
      this.filteredModels = this.allModels.filter((m) => m.brand_id === brandId);
    }
  }

  onSubmit(): void {
    const formValue = this.vehicleForm.getRawValue();
    const payload = {
      license_plate: formValue.license_plate,
      chassis: formValue.chassis,
      renavam: formValue.renavam,
      year: Number(formValue.year),
      model_id: Number(formValue.model_id)
    };

    const validation = vehicleSchema.safeParse(payload);
    if (!validation.success) {
      this.errorMessage = validation.error.issues[0].message;
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const save$ = this.isEditMode && this.vehicleId
      ? this.fleetService.updateVehicle(this.vehicleId, validation.data)
      : this.fleetService.createVehicle(validation.data);

    save$
      .pipe(finalize(() => { this.isSaving = false; }))
      .subscribe({
        next: () => {
          this.router.navigate(['/vehicles']);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = this.isEditMode
            ? 'Erro ao atualizar veículo. Verifique se os dados são únicos.'
            : 'Erro ao cadastrar veículo. Verifique se placa, chassi ou renavam já existem.';
        }
      });
  }
}
