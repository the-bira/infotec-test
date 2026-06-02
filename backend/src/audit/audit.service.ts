import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
  ) {}

  async createLog(
    event: string,
    tenantId: string,
    user: string,
    payload: any,
  ): Promise<AuditLog> {
    const log = new this.auditLogModel({
      event,
      tenant_id: tenantId,
      user,
      payload,
    });
    return log.save();
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Always filter by tenant_id for tenant isolation
    const query = { tenant_id: tenantId };
    
    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    return { data, total };
  }
}
