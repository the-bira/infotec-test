import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleForm } from './vehicle-form';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FleetService } from '../../core/services/fleet';
import { of } from 'rxjs';
import { IBrand, IModel, IVehicle } from '@aivacol/shared';
import { vi } from 'vitest';

describe('VehicleForm', () => {
  let component: VehicleForm;
  let fixture: ComponentFixture<VehicleForm>;
  let mockFleetService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockBrands: IBrand[] = [
    { id: 1, name: 'Brand A', created_at: new Date(), tenant_id: 'test-tenant', created_by: '1', updated_at: new Date() }
  ];
  
  const mockModels: IModel[] = [
    { id: 10, name: 'Model A1', brand_id: 1, created_at: new Date(), tenant_id: 'test-tenant', created_by: '1', updated_at: new Date() },
    { id: 20, name: 'Model B1', brand_id: 2, created_at: new Date(), tenant_id: 'test-tenant', created_by: '1', updated_at: new Date() }
  ];

  const mockVehicle: IVehicle = {
    id: 100,
    license_plate: 'ABC1D23',
    chassis: '12345678901234567',
    renavam: '12345678901',
    year: 2024,
    model_id: 10,
    tenant_id: 'test-tenant',
    created_at: new Date(),
    created_by: '1',
    updated_at: new Date(),
    model: {
      id: 10,
      name: 'Model A1',
      brand_id: 1,
      created_at: new Date(),
      tenant_id: 'test-tenant',
      created_by: '1',
      updated_at: new Date(),
      brand: { id: 1, name: 'Brand A', created_at: new Date(), tenant_id: 'test-tenant', created_by: '1', updated_at: new Date() }
    }
  };

  beforeEach(async () => {
    mockFleetService = {
      getBrands: vi.fn().mockReturnValue(of(mockBrands)),
      getModels: vi.fn().mockReturnValue(of(mockModels)),
      getVehicle: vi.fn().mockReturnValue(of(mockVehicle)),
      createVehicle: vi.fn().mockReturnValue(of(mockVehicle)),
      updateVehicle: vi.fn().mockReturnValue(of(mockVehicle)),
      createBrand: vi.fn().mockReturnValue(of(mockBrands[0])),
      updateBrand: vi.fn().mockReturnValue(of(mockBrands[0])),
      deleteBrand: vi.fn().mockReturnValue(of(undefined)),
      createModel: vi.fn().mockReturnValue(of(mockModels[0])),
      updateModel: vi.fn().mockReturnValue(of(mockModels[0])),
      deleteModel: vi.fn().mockReturnValue(of(undefined))
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null) // defaults to new mode
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [VehicleForm, ReactiveFormsModule],
      providers: [
        { provide: FleetService, useValue: mockFleetService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleForm);
    component = fixture.componentInstance;
  });

  it('should create and load initial brands/models', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(mockFleetService.getBrands).toHaveBeenCalled();
    expect(mockFleetService.getModels).toHaveBeenCalled();
    expect(component.brands.length).toBe(1);
    expect(component.allModels.length).toBe(2);
    expect(component.isEditMode).toBe(false);
  });

  it('should load vehicle details and switch to edit mode when id parameter exists', () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('100');
    fixture.detectChanges();
    
    expect(component.isEditMode).toBe(true);
    expect(mockFleetService.getVehicle).toHaveBeenCalledWith(100);
    expect(component.vehicleForm.value.license_plate).toBe('ABC1D23');
    expect(component.selectedBrandId).toBe(1);
    expect(component.filteredModels.length).toBe(1);
  });

  it('should filter models by brand', () => {
    fixture.detectChanges();
    component.onBrandChange({ target: { value: '1' } });
    expect(component.selectedBrandId).toBe(1);
    expect(component.filteredModels.length).toBe(1);
    expect(component.filteredModels[0].id).toBe(10);
  });

  it('should validate form fields using zod on submit', () => {
    fixture.detectChanges();
    
    component.vehicleForm.setValue({
      license_plate: 'SHORT',
      chassis: '12345678901234567',
      renavam: '12345678901',
      year: 2024,
      brand_id: 1,
      model_id: 10
    });

    component.onSubmit();
    expect(component.errorMessage).toContain('Placa deve ter pelo menos 7 caracteres.');
    expect(mockFleetService.createVehicle).not.toHaveBeenCalled();
  });

  it('should call createVehicle when submitting valid form in new mode', () => {
    fixture.detectChanges();
    
    component.vehicleForm.setValue({
      license_plate: 'ABC1D23',
      chassis: '12345678901234567',
      renavam: '12345678901',
      year: 2024,
      brand_id: 1,
      model_id: 10
    });

    component.onSubmit();
    
    expect(mockFleetService.createVehicle).toHaveBeenCalledWith({
      license_plate: 'ABC1D23',
      chassis: '12345678901234567',
      renavam: '12345678901',
      year: 2024,
      model_id: 10
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/vehicles']);
  });

  it('should call updateVehicle when submitting valid form in edit mode', () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('100');
    fixture.detectChanges();
    
    component.vehicleForm.setValue({
      license_plate: 'XYZ9K87',
      chassis: '12345678901234567',
      renavam: '12345678901',
      year: 2025,
      brand_id: 1,
      model_id: 10
    });

    component.onSubmit();
    
    expect(mockFleetService.updateVehicle).toHaveBeenCalledWith(100, {
      license_plate: 'XYZ9K87',
      chassis: '12345678901234567',
      renavam: '12345678901',
      year: 2025,
      model_id: 10
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/vehicles']);
  });

  describe('Brands & Models Modal Manager', () => {
    it('should open and close manager modal', () => {
      fixture.detectChanges();
      expect(component.showManagerModal).toBe(false);
      component.openManagerModal();
      expect(component.showManagerModal).toBe(true);
      component.closeManagerModal();
      expect(component.showManagerModal).toBe(false);
    });

    it('should call createBrand when saving a new brand', () => {
      fixture.detectChanges();
      component.brandInputName = 'New Brand';
      component.saveBrand();
      expect(mockFleetService.createBrand).toHaveBeenCalledWith({ name: 'New Brand' });
    });

    it('should call updateBrand when saving an edited brand', () => {
      fixture.detectChanges();
      component.editingBrandId = 1;
      component.brandInputName = 'Edited Brand';
      component.saveBrand();
      expect(mockFleetService.updateBrand).toHaveBeenCalledWith(1, { name: 'Edited Brand' });
    });

    it('should call deleteBrand when deleting a brand', () => {
      fixture.detectChanges();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.deleteBrand(1);
      expect(mockFleetService.deleteBrand).toHaveBeenCalledWith(1);
    });

    it('should call createModel when saving a new model', () => {
      fixture.detectChanges();
      component.modelInputName = 'New Model';
      component.modelInputBrandId = 1;
      component.saveModel();
      expect(mockFleetService.createModel).toHaveBeenCalledWith({ name: 'New Model', brand_id: 1 });
    });

    it('should call updateModel when saving an edited model', () => {
      fixture.detectChanges();
      component.editingModelId = 10;
      component.modelInputName = 'Edited Model';
      component.modelInputBrandId = 1;
      component.saveModel();
      expect(mockFleetService.updateModel).toHaveBeenCalledWith(10, { name: 'Edited Model', brand_id: 1 });
    });

    it('should call deleteModel when deleting a model', () => {
      fixture.detectChanges();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.deleteModel(10);
      expect(mockFleetService.deleteModel).toHaveBeenCalledWith(10);
    });
  });
});
