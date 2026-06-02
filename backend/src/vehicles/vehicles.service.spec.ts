import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { ModelsService } from '../models/models.service';
import { BrandsService } from '../brands/brands.service';
import { Model } from '../models/entities/model.entity';
import { Brand } from '../brands/entities/brand.entity';
import * as fs from 'fs';

jest.mock('fs');

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepository: Repository<Vehicle>;
  let modelsService: ModelsService;
  let brandsService: BrandsService;

  const mockBrand: Brand = {
    id: 10,
    name: 'Toyota',
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockModel: Model = {
    id: 20,
    name: 'Corolla',
    brand_id: 10,
    brand: mockBrand,
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockVehicle: Vehicle = {
    id: 1,
    license_plate: 'ABC1234',
    chassis: '9BWAAAAAA12345678',
    renavam: '12345678901',
    year: 2022,
    model_id: 20,
    model: mockModel,
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockVehicleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockModelsService = {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  };

  const mockBrandsService = {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
        {
          provide: ModelsService,
          useValue: mockModelsService,
        },
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    vehicleRepository = module.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));
    modelsService = module.get<ModelsService>(ModelsService);
    brandsService = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a vehicle if model exists in tenant', async () => {
      mockModelsService.findOne.mockResolvedValue(mockModel);
      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(
        {
          license_plate: 'ABC1234',
          chassis: '9BWAAAAAA12345678',
          renavam: '12345678901',
          year: 2022,
          model_id: 20,
        },
        'aivacol',
        'aivacol',
      );

      expect(result).toEqual(mockVehicle);
      expect(modelsService.findOne).toHaveBeenCalledWith(20, 'aivacol');
      expect(vehicleRepository.create).toHaveBeenCalledWith({
        license_plate: 'ABC1234',
        chassis: '9BWAAAAAA12345678',
        renavam: '12345678901',
        year: 2022,
        model_id: 20,
        tenant_id: 'aivacol',
        created_by: 'aivacol',
      });
      expect(vehicleRepository.save).toHaveBeenCalledWith(mockVehicle);
    });

    it('should throw NotFoundException if model does not exist in tenant', async () => {
      mockModelsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(
          {
            license_plate: 'ABC1234',
            chassis: '9BWAAAAAA12345678',
            renavam: '12345678901',
            year: 2022,
            model_id: 99,
          },
          'aivacol',
          'aivacol',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles for a specific tenant', async () => {
      mockVehicleRepository.find.mockResolvedValue([mockVehicle]);

      const result = await service.findAll('aivacol');

      expect(result).toEqual([mockVehicle]);
      expect(vehicleRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'aivacol' },
        relations: ['model', 'model.brand'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id and tenant', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1, 'aivacol');

      expect(result).toEqual(mockVehicle);
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['model', 'model.brand'],
      });
    });

    it('should throw NotFoundException if vehicle not found in tenant', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated vehicle', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue({
        ...mockVehicle,
        year: 2023,
      });

      const result = await service.update(
        1,
        { year: 2023 },
        'aivacol',
      );

      expect(result.year).toEqual(2023);
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['model', 'model.brand'],
      });
      expect(vehicleRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a vehicle if it exists', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 'aivacol');

      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['model', 'model.brand'],
      });
      expect(vehicleRepository.delete).toHaveBeenCalledWith({
        id: 1,
        tenant_id: 'aivacol',
      });
    });
  });

  describe('seedInitialVehicles', () => {
    it('should seed vehicles if table is empty', async () => {
      mockVehicleRepository.count.mockResolvedValue(0);
      mockBrandsService.findAll.mockResolvedValue([mockBrand]);
      mockModelsService.findAll.mockResolvedValue([mockModel]);

      const mockJsonData = JSON.stringify([
        {
          license_plate: 'ABC1234',
          chassis: '9BWAAAAAA12345678',
          renavam: '12345678901',
          year: 2022,
          brand_name: 'Toyota',
          model_name: 'Corolla',
        },
      ]);

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockJsonData);

      mockVehicleRepository.create.mockReturnValue(mockVehicle);
      mockVehicleRepository.save.mockResolvedValue(mockVehicle);

      await service.seedInitialVehicles();

      expect(vehicleRepository.count).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(vehicleRepository.save).toHaveBeenCalled();
    });

    it('should not seed if vehicles exist', async () => {
      mockVehicleRepository.count.mockResolvedValue(5);

      await service.seedInitialVehicles();

      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });
});
