import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model } from './entities/model.entity';
import { BrandsService } from '../brands/brands.service';
import { Brand } from '../brands/entities/brand.entity';

describe('ModelsService', () => {
  let service: ModelsService;
  let modelRepository: Repository<Model>;
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
    id: 1,
    name: 'Corolla',
    brand_id: 10,
    brand: mockBrand,
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockModelRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockBrandsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        {
          provide: getRepositoryToken(Model),
          useValue: mockModelRepository,
        },
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    modelRepository = module.get<Repository<Model>>(getRepositoryToken(Model));
    brandsService = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a model if brand exists in the same tenant', async () => {
      mockBrandsService.findOne.mockResolvedValue(mockBrand);
      mockModelRepository.create.mockReturnValue(mockModel);
      mockModelRepository.save.mockResolvedValue(mockModel);

      const result = await service.create(
        { name: 'Corolla', brand_id: 10 },
        'aivacol',
        'aivacol',
      );

      expect(result).toEqual(mockModel);
      expect(brandsService.findOne).toHaveBeenCalledWith(10, 'aivacol');
      expect(modelRepository.create).toHaveBeenCalledWith({
        name: 'Corolla',
        brand_id: 10,
        tenant_id: 'aivacol',
        created_by: 'aivacol',
      });
      expect(modelRepository.save).toHaveBeenCalledWith(mockModel);
    });

    it('should throw NotFoundException if brand does not exist in tenant', async () => {
      mockBrandsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({ name: 'Corolla', brand_id: 99 }, 'aivacol', 'aivacol'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all models for a specific tenant', async () => {
      mockModelRepository.find.mockResolvedValue([mockModel]);

      const result = await service.findAll('aivacol');

      expect(result).toEqual([mockModel]);
      expect(modelRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'aivacol' },
        relations: ['brand'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a model by id and tenant', async () => {
      mockModelRepository.findOne.mockResolvedValue(mockModel);

      const result = await service.findOne(1, 'aivacol');

      expect(result).toEqual(mockModel);
      expect(modelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['brand'],
      });
    });

    it('should throw NotFoundException if model not found in tenant', async () => {
      mockModelRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated model', async () => {
      mockModelRepository.findOne.mockResolvedValue(mockModel);
      mockModelRepository.save.mockResolvedValue({
        ...mockModel,
        name: 'Corolla Hybrid',
      });

      const result = await service.update(
        1,
        { name: 'Corolla Hybrid' },
        'aivacol',
      );

      expect(result.name).toEqual('Corolla Hybrid');
      expect(modelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['brand'],
      });
      expect(modelRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a model if it exists', async () => {
      mockModelRepository.findOne.mockResolvedValue(mockModel);
      mockModelRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 'aivacol');

      expect(modelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
        relations: ['brand'],
      });
      expect(modelRepository.delete).toHaveBeenCalledWith({
        id: 1,
        tenant_id: 'aivacol',
      });
    });
  });
});
