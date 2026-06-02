import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Model } from '../../models/entities/model.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  license_plate: string;

  @Column()
  chassis: string;

  @Column()
  renavam: string;

  @Column()
  year: number;

  @Column()
  model_id: number;

  @ManyToOne(() => Model, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @Column()
  tenant_id: string;

  @Column()
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
