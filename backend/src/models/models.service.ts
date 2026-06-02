import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    private readonly brandsService: BrandsService,
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
    return this.modelRepository.save(model);
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
  ): Promise<Model> {
    const model = await this.findOne(id, tenantId);
    Object.assign(model, updateModelDto);
    return this.modelRepository.save(model);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const model = await this.findOne(id, tenantId);
    await this.modelRepository.delete({ id: model.id, tenant_id: tenantId });
  }
}
