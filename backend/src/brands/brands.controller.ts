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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('brands')
@UseGuards(JwtAuthGuard)
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @CurrentTenant() tenantId: string,
    @Request() req,
  ) {
    const username = req.user.nickname;
    return this.brandsService.create(createBrandDto, tenantId, username);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.brandsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.brandsService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.brandsService.update(id, updateBrandDto, tenantId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.brandsService.remove(id, tenantId);
  }
}
