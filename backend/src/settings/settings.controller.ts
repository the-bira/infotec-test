import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentTenant() tenantId: string) {
    return this.settingsService.findByTenant(tenantId);
  }

  @Put()
  async updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() body: { cache_enabled: boolean; cache_ttl: number },
  ) {
    return this.settingsService.update(
      tenantId,
      body.cache_enabled,
      body.cache_ttl,
    );
  }

  @Post('clear-cache')
  async clearCache(@CurrentTenant() tenantId: string) {
    await this.settingsService.clearCache(tenantId);
    return { message: 'Cache limpo com sucesso' };
  }
}
