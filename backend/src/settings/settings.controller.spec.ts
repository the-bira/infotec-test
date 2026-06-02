import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSetting = {
    id: 1,
    tenant_id: 'aivacol',
    cache_enabled: true,
    cache_ttl: 60,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSettingsService = {
    findByTenant: jest.fn(),
    update: jest.fn(),
    clearCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings for the current tenant', async () => {
      mockSettingsService.findByTenant.mockResolvedValue(mockSetting);

      const result = await controller.getSettings('aivacol');

      expect(result).toEqual(mockSetting);
      expect(service.findByTenant).toHaveBeenCalledWith('aivacol');
    });
  });

  describe('updateSettings', () => {
    it('should update and return updated settings for the tenant', async () => {
      const updateDto = { cache_enabled: false, cache_ttl: 120 };
      mockSettingsService.update.mockResolvedValue({
        ...mockSetting,
        ...updateDto,
      });

      const result = await controller.updateSettings('aivacol', updateDto);

      expect(result).toEqual(expect.objectContaining(updateDto));
      expect(service.update).toHaveBeenCalledWith('aivacol', false, 120);
    });
  });

  describe('clearCache', () => {
    it('should call clearCache on settings service and return success message', async () => {
      mockSettingsService.clearCache.mockResolvedValue(undefined);

      const result = await controller.clearCache('aivacol');

      expect(result).toEqual({ message: 'Cache limpo com sucesso' });
      expect(service.clearCache).toHaveBeenCalledWith('aivacol');
    });
  });
});
