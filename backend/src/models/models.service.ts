import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { BrandsService } from '../brands/brands.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    private readonly brandsService: BrandsService,
    @Inject('AUDIT_SERVICE')
    private readonly auditClient: ClientProxy,
  ) {}

  async create(
    createModelDto: CreateModelDto,
    tenantId: string,
    username: string,
  ): Promise<Model> {
    // 1. Verify that the brand exists and belongs to the same tenant
    await this.brandsService.findOne(createModelDto.brand_id, tenantId);

    // 2. Create the model
    const model = this.modelRepository.create({
      ...createModelDto,
      tenant_id: tenantId,
      created_by: username,
    });
    const saved = await this.modelRepository.save(model);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'model.created',
      tenantId,
      user: username,
      payload: { id: saved.id, name: saved.name, brand_id: saved.brand_id },
    });

    return saved;
  }

  async findAll(tenantId: string): Promise<Model[]> {
    return this.modelRepository.find({
      where: { tenant_id: tenantId },
      relations: { brand: true },
    });
  }

  async findOne(id: number, tenantId: string): Promise<Model> {
    const model = await this.modelRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: { brand: true },
    });
    if (!model) {
      throw new NotFoundException(`Model with ID ${id} not found`);
    }
    return model;
  }

  async update(
    id: number,
    updateModelDto: UpdateModelDto,
    tenantId: string,
    username: string,
  ): Promise<Model> {
    const model = await this.findOne(id, tenantId);
    Object.assign(model, updateModelDto);
    const saved = await this.modelRepository.save(model);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'model.updated',
      tenantId,
      user: username,
      payload: { id, changes: updateModelDto },
    });

    return saved;
  }

  async remove(id: number, tenantId: string, username: string): Promise<void> {
    const model = await this.findOne(id, tenantId);
    await this.modelRepository.delete({ id: model.id, tenant_id: tenantId });

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'model.deleted',
      tenantId,
      user: username,
      payload: { id, name: model.name },
    });
  }
}
