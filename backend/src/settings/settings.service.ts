import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findByTenant(tenantId: string): Promise<Setting> {
    let setting = await this.settingRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!setting) {
      setting = this.settingRepository.create({
        tenant_id: tenantId,
        cache_enabled: true,
        cache_ttl: 60,
      });
      setting = await this.settingRepository.save(setting);
    }

    return setting;
  }

  async update(
    tenantId: string,
    cacheEnabled: boolean,
    cacheTtl: number,
  ): Promise<Setting> {
    const setting = await this.findByTenant(tenantId);
    setting.cache_enabled = cacheEnabled;
    setting.cache_ttl = cacheTtl;
    return this.settingRepository.save(setting);
  }

  async clearCache(tenantId: string): Promise<void> {
    // Invalidate the vehicles list cache for this tenant
    await this.cacheManager.del(`vehicles:${tenantId}`);
    
    // Clear all entries in the cache manager as a fallback to ensure freshness
    try {
      if (typeof this.cacheManager.clear === 'function') {
        await this.cacheManager.clear();
      } else if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
    } catch (e) {
      console.error('Failed to clear cache manager:', e);
    }
  }
}
