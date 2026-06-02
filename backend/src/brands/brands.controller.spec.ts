import { Test, TestingModule } from '@nestjs/testing';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('BrandsController', () => {
  let controller: BrandsController;
  let service: BrandsService;

  const mockBrand = {
    id: 1,
    name: 'Toyota',
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBrandsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // bypass guard for unit testing
      .compile();

    controller = module.get<BrandsController>(BrandsController);
    service = module.get<BrandsService>(BrandsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a brand', async () => {
      mockBrandsService.create.mockResolvedValue(mockBrand);
      const req = { user: { nickname: 'aivacol' } };

      const result = await controller.create(
        { name: 'Toyota' },
        'aivacol',
        req,
      );

      expect(result).toEqual(mockBrand);
      expect(service.create).toHaveBeenCalledWith(
        { name: 'Toyota' },
        'aivacol',
        'aivacol',
      );
    });
  });

  describe('findAll', () => {
    it('should return all brands for a specific tenantId', async () => {
      mockBrandsService.findAll.mockResolvedValue([mockBrand]);

      const result = await controller.findAll('aivacol');

      expect(result).toEqual([mockBrand]);
      expect(service.findAll).toHaveBeenCalledWith('aivacol');
    });
  });

  describe('findOne', () => {
    it('should return a brand by id and tenantId', async () => {
      mockBrandsService.findOne.mockResolvedValue(mockBrand);

      const result = await controller.findOne(1, 'aivacol');

      expect(result).toEqual(mockBrand);
      expect(service.findOne).toHaveBeenCalledWith(1, 'aivacol');
    });
  });

  describe('update', () => {
    it('should update a brand', async () => {
      mockBrandsService.update.mockResolvedValue({
        ...mockBrand,
        name: 'Toyota Updated',
      });

      const req = { user: { nickname: 'aivacol' } };
      const result = await controller.update(
        1,
        { name: 'Toyota Updated' },
        'aivacol',
        req,
      );

      expect(result.name).toEqual('Toyota Updated');
      expect(service.update).toHaveBeenCalledWith(
        1,
        { name: 'Toyota Updated' },
        'aivacol',
        'aivacol',
      );
    });
  });

  describe('remove', () => {
    it('should remove a brand', async () => {
      mockBrandsService.remove.mockResolvedValue(undefined);

      const req = { user: { nickname: 'aivacol' } };
      await controller.remove(1, 'aivacol', req);

      expect(service.remove).toHaveBeenCalledWith(1, 'aivacol', 'aivacol');
    });
  });
});
