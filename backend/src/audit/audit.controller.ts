import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // 1. HTTP Endpoint for Frontend Settings tab
  @Get()
  @UseGuards(JwtAuthGuard)
  async getLogs(
    @CurrentTenant() tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.auditService.findAll(tenantId, page, limit);
  }

  // 2. RabbitMQ Message Consumer
  @EventPattern('audit.log')
  async handleAuditLog(
    @Payload()
    data: {
      event: string;
      tenantId: string;
      user: string;
      payload: any;
    },
  ) {
    await this.auditService.createLog(
      data.event,
      data.tenantId,
      data.user,
      data.payload,
    );
  }
}
