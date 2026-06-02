import { Test, TestingModule } from '@nestjs/testing';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: ModelsService;

  const mockModel = {
    id: 1,
    name: 'Corolla',
    brand_id: 10,
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockModelsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [
        {
          provide: ModelsService,
          useValue: mockModelsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // bypass guard for testing
      .compile();

    controller = module.get<ModelsController>(ModelsController);
    service = module.get<ModelsService>(ModelsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a model', async () => {
      mockModelsService.create.mockResolvedValue(mockModel);
      const req = { user: { nickname: 'aivacol' } };

      const result = await controller.create(
        { name: 'Corolla', brand_id: 10 },
        'aivacol',
        req,
      );

      expect(result).toEqual(mockModel);
      expect(service.create).toHaveBeenCalledWith(
        { name: 'Corolla', brand_id: 10 },
        'aivacol',
        'aivacol',
      );
    });
  });

  describe('findAll', () => {
    it('should return all models for a specific tenantId', async () => {
      mockModelsService.findAll.mockResolvedValue([mockModel]);

      const result = await controller.findAll('aivacol');

      expect(result).toEqual([mockModel]);
      expect(service.findAll).toHaveBeenCalledWith('aivacol');
    });
  });

  describe('findOne', () => {
    it('should return a model by id and tenantId', async () => {
      mockModelsService.findOne.mockResolvedValue(mockModel);

      const result = await controller.findOne(1, 'aivacol');

      expect(result).toEqual(mockModel);
      expect(service.findOne).toHaveBeenCalledWith(1, 'aivacol');
    });
  });

  describe('update', () => {
    it('should update a model', async () => {
      mockModelsService.update.mockResolvedValue({
        ...mockModel,
        name: 'Corolla Updated',
      });

      const result = await controller.update(
        1,
        { name: 'Corolla Updated' },
        'aivacol',
      );

      expect(result.name).toEqual('Corolla Updated');
      expect(service.update).toHaveBeenCalledWith(
        1,
        { name: 'Corolla Updated' },
        'aivacol',
      );
    });
  });

  describe('remove', () => {
    it('should remove a model', async () => {
      mockModelsService.remove.mockResolvedValue(undefined);

      await controller.remove(1, 'aivacol');

      expect(service.remove).toHaveBeenCalledWith(1, 'aivacol');
    });
  });
});
