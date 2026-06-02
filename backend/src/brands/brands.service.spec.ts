import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: Repository<Brand>;

  const mockBrand: Brand = {
    id: 1,
    name: 'Toyota',
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBrandRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepository,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repository = module.get<Repository<Brand>>(getRepositoryToken(Brand));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a brand', async () => {
      mockBrandRepository.create.mockReturnValue(mockBrand);
      mockBrandRepository.save.mockResolvedValue(mockBrand);

      const result = await service.create({ name: 'Toyota' }, 'aivacol', 'aivacol');

      expect(result).toEqual(mockBrand);
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Toyota',
        tenant_id: 'aivacol',
        created_by: 'aivacol',
      });
      expect(repository.save).toHaveBeenCalledWith(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should return all brands for a specific tenant', async () => {
      mockBrandRepository.find.mockResolvedValue([mockBrand]);

      const result = await service.findAll('aivacol');

      expect(result).toEqual([mockBrand]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { tenant_id: 'aivacol' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a brand by id and tenant', async () => {
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);

      const result = await service.findOne(1, 'aivacol');

      expect(result).toEqual(mockBrand);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
      });
    });

    it('should throw NotFoundException if brand not found', async () => {
      mockBrandRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, 'aivacol')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the updated brand', async () => {
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);
      mockBrandRepository.save.mockResolvedValue({ ...mockBrand, name: 'Toyota Updated' });

      const result = await service.update(
        1,
        { name: 'Toyota Updated' },
        'aivacol',
      );

      expect(result.name).toEqual('Toyota Updated');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
      });
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a brand if it exists', async () => {
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);
      mockBrandRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, 'aivacol');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, tenant_id: 'aivacol' },
      });
      expect(repository.delete).toHaveBeenCalledWith({ id: 1, tenant_id: 'aivacol' });
    });
  });
});
