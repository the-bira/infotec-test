import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(nickname: string, pass: string): Promise<any> {
    const user = await this.usersService.findByNickname(nickname);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      nickname: user.nickname,
      tenantId: user.tenant_id,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
