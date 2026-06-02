import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
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
    return this.brandRepository.save(brand);
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
  ): Promise<Brand> {
    const brand = await this.findOne(id, tenantId);
    Object.assign(brand, updateBrandDto);
    return this.brandRepository.save(brand);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const brand = await this.findOne(id, tenantId);
    await this.brandRepository.delete({ id: brand.id, tenant_id: tenantId });
  }
}
