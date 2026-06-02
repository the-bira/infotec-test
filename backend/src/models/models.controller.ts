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
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';

@Controller('models')
@UseGuards(JwtAuthGuard)
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  async create(
    @Body() createModelDto: CreateModelDto,
    @CurrentTenant() tenantId: string,
    @Request() req,
  ) {
    const username = req.user.nickname;
    return this.modelsService.create(createModelDto, tenantId, username);
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.modelsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.modelsService.findOne(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModelDto: UpdateModelDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.modelsService.update(id, updateModelDto, tenantId);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentTenant() tenantId: string,
  ) {
    return this.modelsService.remove(id, tenantId);
  }
}
