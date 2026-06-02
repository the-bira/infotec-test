import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @Inject('AUDIT_SERVICE')
    private readonly auditClient: ClientProxy,
  ) {}

  async create(
    createBrandDto: CreateBrandDto,
    tenantId: string,
    username: string,
  ): Promise<Brand> {
    const brand = this.brandRepository.create({
      ...createBrandDto,
      tenant_id: tenantId,
      created_by: username,
    });
    const saved = await this.brandRepository.save(brand);
    
    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'brand.created',
      tenantId,
      user: username,
      payload: { id: saved.id, name: saved.name },
    });

    return saved;
  }

  async findAll(tenantId: string): Promise<Brand[]> {
    return this.brandRepository.find({
      where: { tenant_id: tenantId },
    });
  }

  async findOne(id: number, tenantId: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async update(
    id: number,
    updateBrandDto: UpdateBrandDto,
    tenantId: string,
    username: string,
  ): Promise<Brand> {
    const brand = await this.findOne(id, tenantId);
    Object.assign(brand, updateBrandDto);
    const saved = await this.brandRepository.save(brand);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'brand.updated',
      tenantId,
      user: username,
      payload: { id, changes: updateBrandDto },
    });

    return saved;
  }

  async remove(id: number, tenantId: string, username: string): Promise<void> {
    const brand = await this.findOne(id, tenantId);
    await this.brandRepository.delete({ id: brand.id, tenant_id: tenantId });

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'brand.deleted',
      tenantId,
      user: username,
      payload: { id, name: brand.name },
    });
  }
}
