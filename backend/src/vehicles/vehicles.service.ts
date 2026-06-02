import { Injectable, NotFoundException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as fs from 'fs';
import * as path from 'path';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ModelsService } from '../models/models.service';
import { BrandsService } from '../brands/brands.service';
import { SettingsService } from '../settings/settings.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class VehiclesService implements OnModuleInit {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly modelsService: ModelsService,
    private readonly brandsService: BrandsService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly settingsService: SettingsService,
    @Inject('AUDIT_SERVICE')
    private readonly auditClient: ClientProxy,
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
    const saved = await this.vehicleRepository.save(vehicle);

    // 3. Invalidate vehicles list cache
    await this.cacheManager.del(`vehicles:${tenantId}`);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'vehicle.created',
      tenantId,
      user: username,
      payload: { id: saved.id, license_plate: saved.license_plate, model_id: saved.model_id },
    });

    return saved;
  }

  async findAll(tenantId: string): Promise<Vehicle[]> {
    const settings = await this.settingsService.findByTenant(tenantId);
    const cacheKey = `vehicles:${tenantId}`;

    if (settings.cache_enabled) {
      const cached = await this.cacheManager.get<Vehicle[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const vehicles = await this.vehicleRepository.find({
      where: { tenant_id: tenantId },
      relations: { model: { brand: true } },
    });

    if (settings.cache_enabled) {
      // TTL is stored in seconds in DB, convert to ms if required or pass as config depending on cache-manager version
      await this.cacheManager.set(cacheKey, vehicles, settings.cache_ttl);
    }
    return vehicles;
  }

  async findOne(id: number, tenantId: string): Promise<Vehicle> {
    const settings = await this.settingsService.findByTenant(tenantId);
    const cacheKey = `vehicle:${tenantId}:${id}`;

    if (settings.cache_enabled) {
      const cached = await this.cacheManager.get<Vehicle>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: { model: { brand: true } },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    if (settings.cache_enabled) {
      await this.cacheManager.set(cacheKey, vehicle, settings.cache_ttl);
    }
    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
    tenantId: string,
    username: string,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(id, tenantId);
    Object.assign(vehicle, updateVehicleDto);
    const updated = await this.vehicleRepository.save(vehicle);

    // Invalidate caches
    await this.cacheManager.del(`vehicles:${tenantId}`);
    await this.cacheManager.del(`vehicle:${tenantId}:${id}`);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'vehicle.updated',
      tenantId,
      user: username,
      payload: { id, changes: updateVehicleDto },
    });

    return updated;
  }

  async remove(id: number, tenantId: string, username: string): Promise<void> {
    const vehicle = await this.findOne(id, tenantId);
    await this.vehicleRepository.delete({ id: vehicle.id, tenant_id: tenantId });

    // Invalidate caches
    await this.cacheManager.del(`vehicles:${tenantId}`);
    await this.cacheManager.del(`vehicle:${tenantId}:${id}`);

    // Emit audit log to RabbitMQ
    this.auditClient.emit('audit.log', {
      event: 'vehicle.deleted',
      tenantId,
      user: username,
      payload: { id, license_plate: vehicle.license_plate },
    });
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
