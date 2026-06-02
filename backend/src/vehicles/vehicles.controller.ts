import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @CurrentTenant() tenantId: string,
    @Request() req,
  ) {
    const username = req.user.nickname;
    return this.vehiclesService.create(createVehicleDto, tenantId, username);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.vehiclesService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.vehiclesService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, tenantId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.vehiclesService.remove(id, tenantId);
  }
}
