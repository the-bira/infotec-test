import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehicle = {
    id: 1,
    license_plate: 'ABC1234',
    chassis: '9BWAAAAAA12345678',
    renavam: '12345678901',
    year: 2022,
    model_id: 20,
    tenant_id: 'aivacol',
    created_by: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // bypass guard for testing
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle', async () => {
      mockVehiclesService.create.mockResolvedValue(mockVehicle);
      const req = { user: { nickname: 'aivacol' } };

      const result = await controller.create(
        {
          license_plate: 'ABC1234',
          chassis: '9BWAAAAAA12345678',
          renavam: '12345678901',
          year: 2022,
          model_id: 20,
        },
        'aivacol',
        req,
      );

      expect(result).toEqual(mockVehicle);
      expect(service.create).toHaveBeenCalledWith(
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
    });
  });

  describe('findAll', () => {
    it('should return all vehicles for a specific tenantId', async () => {
      mockVehiclesService.findAll.mockResolvedValue([mockVehicle]);

      const result = await controller.findAll('aivacol');

      expect(result).toEqual([mockVehicle]);
      expect(service.findAll).toHaveBeenCalledWith('aivacol');
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id and tenantId', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne(1, 'aivacol');

      expect(result).toEqual(mockVehicle);
      expect(service.findOne).toHaveBeenCalledWith(1, 'aivacol');
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      mockVehiclesService.update.mockResolvedValue({
        ...mockVehicle,
        year: 2023,
      });

      const result = await controller.update(
        1,
        { year: 2023 },
        'aivacol',
      );

      expect(result.year).toEqual(2023);
      expect(service.update).toHaveBeenCalledWith(
        1,
        { year: 2023 },
        'aivacol',
      );
    });
  });

  describe('remove', () => {
    it('should remove a vehicle', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove(1, 'aivacol');

      expect(service.remove).toHaveBeenCalledWith(1, 'aivacol');
    });
  });
});
