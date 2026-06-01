import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    // Run seed automatically when the module initializes
    await this.createInitialSeed();
  }

  async findByNickname(nickname: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { nickname },
    });
  }

  async createInitialSeed(): Promise<void> {
    const defaultNickname = 'aivacol';
    const existingUser = await this.findByNickname(defaultNickname);

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('aivacol', 10);
      const newUser = this.userRepository.create({
        nickname: defaultNickname,
        name: 'Aivacol Standard User',
        email: 'aivacol@aivacol.com',
        password: hashedPassword,
        tenant_id: 'aivacol',
      });
      await this.userRepository.save(newUser);
    }
  }
}
