import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { Setting } from './entities/setting.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: Repository<Setting>;
  let cacheManager: any;

  const mockSetting: Setting = {
    id: 1,
    tenant_id: 'aivacol',
    cache_enabled: true,
    cache_ttl: 60,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSettingRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockCacheManager = {
    del: jest.fn(),
    clear: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Setting),
          useValue: mockSettingRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get<Repository<Setting>>(getRepositoryToken(Setting));
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTenant', () => {
    it('should return existing setting if found', async () => {
      mockSettingRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findByTenant('aivacol');

      expect(result).toEqual(mockSetting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenant_id: 'aivacol' },
      });
    });

    it('should create and return new default setting if not found', async () => {
      mockSettingRepository.findOne.mockResolvedValue(null);
      mockSettingRepository.create.mockReturnValue(mockSetting);
      mockSettingRepository.save.mockResolvedValue(mockSetting);

      const result = await service.findByTenant('new-tenant');

      expect(repository.create).toHaveBeenCalledWith({
        tenant_id: 'new-tenant',
        cache_enabled: true,
        cache_ttl: 60,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSetting);
    });
  });

  describe('update', () => {
    it('should find existing setting, update values, and save it', async () => {
      mockSettingRepository.findOne.mockResolvedValue(mockSetting);
      mockSettingRepository.save.mockResolvedValue({
        ...mockSetting,
        cache_enabled: false,
        cache_ttl: 120,
      });

      const result = await service.update('aivacol', false, 120);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tenant_id: 'aivacol' },
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cache_enabled: false,
          cache_ttl: 120,
        }),
      );
      expect(result.cache_enabled).toBe(false);
      expect(result.cache_ttl).toBe(120);
    });
  });

  describe('clearCache', () => {
    it('should delete tenant vehicle cache and clear/reset cache manager', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);
      mockCacheManager.clear.mockResolvedValue(undefined);

      await service.clearCache('aivacol');

      expect(cacheManager.del).toHaveBeenCalledWith('vehicles:aivacol');
      expect(cacheManager.clear).toHaveBeenCalled();
    });

    it('should fallback to reset if clear is not present', async () => {
      const cacheManagerWithResetOnly = {
        del: jest.fn().mockResolvedValue(undefined),
        reset: jest.fn().mockResolvedValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SettingsService,
          {
            provide: getRepositoryToken(Setting),
            useValue: mockSettingRepository,
          },
          {
            provide: CACHE_MANAGER,
            useValue: cacheManagerWithResetOnly,
          },
        ],
      }).compile();

      const localService = module.get<SettingsService>(SettingsService);
      await localService.clearCache('aivacol');

      expect(cacheManagerWithResetOnly.del).toHaveBeenCalledWith('vehicles:aivacol');
      expect(cacheManagerWithResetOnly.reset).toHaveBeenCalled();
    });
  });
});
