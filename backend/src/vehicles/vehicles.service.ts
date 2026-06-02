import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ModelsService } from '../models/models.service';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class VehiclesService implements OnModuleInit {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly modelsService: ModelsService,
    private readonly brandsService: BrandsService,
  ) {}

  async onModuleInit() {
    await this.seedInitialVehicles();
  }

  async create(
    createVehicleDto: CreateVehicleDto,
    tenantId: string,
    username: string,
  ): Promise<Vehicle> {
    // 1. Verify model exists and belongs to the same tenant
    await this.modelsService.findOne(createVehicleDto.model_id, tenantId);

    // 2. Create the vehicle
    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      tenant_id: tenantId,
      created_by: username,
    });
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(tenantId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      where: { tenant_id: tenantId },
      relations: ['model', 'model.brand'],
    });
  }

  async findOne(id: number, tenantId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['model', 'model.brand'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
    tenantId: string,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id, tenantId);
    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const vehicle = await this.findOne(id, tenantId);
    await this.vehicleRepository.delete({ id: vehicle.id, tenant_id: tenantId });
  }

  async seedInitialVehicles(): Promise<void> {
    const count = await this.vehicleRepository.count();
    if (count > 0) {
      return;
    }

    const seedPath = path.resolve(process.cwd(), 'seed_vehicles.json');
    if (!fs.existsSync(seedPath)) {
      return;
    }

    const rawData = fs.readFileSync(seedPath, 'utf8');
    const parsedVehicles = JSON.parse(rawData);

    // Fetch existing brands and models under default 'aivacol' tenant to avoid duplicates
    const existingBrands = await this.brandsService.findAll('aivacol');
    const existingModels = await this.modelsService.findAll('aivacol');

    for (const item of parsedVehicles) {
      // 1. Get or create brand
      let brand = existingBrands.find((b) => b.name === item.brand_name);
      if (!brand) {
        brand = await this.brandsService.create(
          { name: item.brand_name },
          'aivacol',
          'aivacol',
        );
        existingBrands.push(brand);
      }

      // 2. Get or create model
      let model = existingModels.find(
        (m) => m.name === item.model_name && m.brand_id === brand.id,
      );
      if (!model) {
        model = await this.modelsService.create(
          { name: item.model_name, brand_id: brand.id },
          'aivacol',
          'aivacol',
        );
        existingModels.push(model);
      }

      // 3. Create vehicle
      const vehicle = this.vehicleRepository.create({
        license_plate: item.license_plate,
        chassis: item.chassis,
        renavam: item.renavam,
        year: item.year,
        model_id: model.id,
        tenant_id: 'aivacol',
        created_by: 'aivacol',
      });
      await this.vehicleRepository.save(vehicle);
    }
  }
}
