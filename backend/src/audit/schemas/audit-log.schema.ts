import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'audit_logs' })
export class AuditLog extends Document {
  @Prop({ required: true })
  event: string;

  @Prop({ required: true })
  tenant_id: string;

  @Prop({ required: true })
  user: string;

  @Prop({ type: Object, default: {} })
  payload: any;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
