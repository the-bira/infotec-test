import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FleetService } from '../../core/services/fleet';
import { IBrand, IModel, ICreateBrandDto, IUpdateBrandDto, ICreateModelDto, IUpdateModelDto } from '@aivacol/shared';
import { z } from 'zod';
import { forkJoin } from 'rxjs';
import { finalize, timeout } from 'rxjs/operators';

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
    FormsModule,
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

  // Modal State
  showManagerModal = false;
  activeManagerTab: 'brands' | 'models' = 'brands';
  isModalSaving = false;
  modalErrorMessage = '';

  // Brand Management State
  brandInputName = '';
  editingBrandId?: number;
  brandPage = 1;
  brandPageSize = 5;

  // Model Management State
  modelInputName = '';
  modelInputBrandId?: number;
  editingModelId?: number;
  modelPage = 1;
  modelPageSize = 5;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
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
        timeout(8000),
        finalize(() => {
          const idParam = this.route.snapshot.paramMap.get('id');
          if (idParam) {
            this.isEditMode = true;
            this.vehicleId = Number(idParam);
            this.loadVehicleForEdit(this.vehicleId);
          } else {
            this.isLoading = false;
            this.cdr.detectChanges();
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
          this.errorMessage = err?.name === 'TimeoutError'
            ? 'Timeout: o backend não respondeu em 8 segundos. Verifique se o Docker está rodando.'
            : `Erro ${err?.status ?? '0'}: não foi possível carregar marcas/modelos.`;
        }
      });
  }

  loadVehicleForEdit(id: number): void {
    this.fleetService.getVehicle(id)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
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

  // --- Pagination Getters ---
  get paginatedBrands(): IBrand[] {
    const startIndex = (this.brandPage - 1) * this.brandPageSize;
    return this.brands.slice(startIndex, startIndex + this.brandPageSize);
  }

  get totalBrandPages(): number {
    return Math.ceil(this.brands.length / this.brandPageSize) || 1;
  }

  get paginatedModels(): IModel[] {
    const startIndex = (this.modelPage - 1) * this.modelPageSize;
    return this.allModels.slice(startIndex, startIndex + this.modelPageSize);
  }

  get totalModelPages(): number {
    return Math.ceil(this.allModels.length / this.modelPageSize) || 1;
  }

  // --- Modal Control Methods ---
  openManagerModal(): void {
    this.showManagerModal = true;
    this.modalErrorMessage = '';
    this.resetBrandForm();
    this.resetModelForm();
    this.brandPage = 1;
    this.modelPage = 1;
    this.cdr.detectChanges();
  }

  closeManagerModal(): void {
    this.showManagerModal = false;
    this.cdr.detectChanges();
  }

  resetBrandForm(): void {
    this.brandInputName = '';
    this.editingBrandId = undefined;
  }

  resetModelForm(): void {
    this.modelInputName = '';
    this.modelInputBrandId = this.brands.length > 0 ? this.brands[0].id : undefined;
    this.editingModelId = undefined;
  }

  setTab(tab: 'brands' | 'models'): void {
    this.activeManagerTab = tab;
    this.modalErrorMessage = '';
    if (tab === 'models') {
      this.resetModelForm();
    } else {
      this.resetBrandForm();
    }
    this.cdr.detectChanges();
  }

  // --- Brand Actions ---
  saveBrand(): void {
    if (!this.brandInputName.trim()) {
      this.modalErrorMessage = 'O nome da marca é obrigatório.';
      return;
    }

    this.isModalSaving = true;
    this.modalErrorMessage = '';

    const action$ = this.editingBrandId
      ? this.fleetService.updateBrand(this.editingBrandId, { name: this.brandInputName.trim() })
      : this.fleetService.createBrand({ name: this.brandInputName.trim() });

    action$
      .pipe(finalize(() => {
        this.isModalSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.resetBrandForm();
          this.refreshData();
        },
        error: (err) => {
          console.error(err);
          this.modalErrorMessage = 'Erro ao salvar marca. Verifique se o nome já existe.';
        }
      });
  }

  editBrand(brand: IBrand): void {
    this.editingBrandId = brand.id;
    this.brandInputName = brand.name;
    this.cdr.detectChanges();
  }

  deleteBrand(id: number): void {
    if (!confirm('Tem certeza que deseja excluir esta marca? Todos os modelos associados também serão excluídos.')) {
      return;
    }

    this.isModalSaving = true;
    this.modalErrorMessage = '';

    this.fleetService.deleteBrand(id)
      .pipe(finalize(() => {
        this.isModalSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          // Se a marca excluída estava selecionada no form principal, limpa ela
          if (this.selectedBrandId === id) {
            this.selectedBrandId = undefined;
            this.vehicleForm.patchValue({ brand_id: '', model_id: '' });
            this.vehicleForm.get('model_id')?.disable();
          }
          this.refreshData();
        },
        error: (err) => {
          console.error(err);
          this.modalErrorMessage = 'Erro ao excluir marca.';
        }
      });
  }

  // --- Model Actions ---
  saveModel(): void {
    if (!this.modelInputName.trim()) {
      this.modalErrorMessage = 'O nome do modelo é obrigatório.';
      return;
    }
    if (!this.modelInputBrandId) {
      this.modalErrorMessage = 'Selecione uma marca para o modelo.';
      return;
    }

    this.isModalSaving = true;
    this.modalErrorMessage = '';

    const payload = {
      name: this.modelInputName.trim(),
      brand_id: Number(this.modelInputBrandId)
    };

    const action$ = this.editingModelId
      ? this.fleetService.updateModel(this.editingModelId, payload)
      : this.fleetService.createModel(payload);

    action$
      .pipe(finalize(() => {
        this.isModalSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.resetModelForm();
          this.refreshData();
        },
        error: (err) => {
          console.error(err);
          this.modalErrorMessage = 'Erro ao salvar modelo. Verifique se o nome já existe para esta marca.';
        }
      });
  }

  editModel(model: IModel): void {
    this.editingModelId = model.id;
    this.modelInputName = model.name;
    this.modelInputBrandId = model.brand_id;
    this.cdr.detectChanges();
  }

  deleteModel(id: number): void {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) {
      return;
    }

    this.isModalSaving = true;
    this.modalErrorMessage = '';

    this.fleetService.deleteModel(id)
      .pipe(finalize(() => {
        this.isModalSaving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          // Se o modelo excluído estava selecionado no form principal, limpa ele
          const currentModelId = Number(this.vehicleForm.get('model_id')?.value);
          if (currentModelId === id) {
            this.vehicleForm.patchValue({ model_id: '' });
          }
          this.refreshData();
        },
        error: (err) => {
          console.error(err);
          this.modalErrorMessage = 'Erro ao excluir modelo.';
        }
      });
  }

  refreshData(): void {
    forkJoin({
      brands: this.fleetService.getBrands(),
      models: this.fleetService.getModels()
    })
      .pipe(timeout(8000))
      .subscribe({
        next: ({ brands, models }) => {
          this.brands = brands;
          this.allModels = models;
          
          // Se modelInputBrandId não estiver setado ou não estiver mais nas marcas, seta para a primeira
          if (this.brands.length > 0 && (!this.modelInputBrandId || !this.brands.some(b => b.id === this.modelInputBrandId))) {
            this.modelInputBrandId = this.brands[0].id;
          }
          
          this.filterModelsByBrand(this.selectedBrandId);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao recarregar marcas/modelos:', err);
        }
      });
  }
}
