import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    nickname: 'aivacol',
    name: 'Aivacol Standard User',
    email: 'aivacol@aivacol.com',
    password: 'hashedpassword',
    tenant_id: 'aivacol',
  };

  const mockUsersService = {
    findByNickname: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockedjwttoken'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('aivacol', 10);
      mockUsersService.findByNickname.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.validateUser('aivacol', 'aivacol');

      // Password should not be included in return
      const { password, ...expectedUser } = mockUser;
      expect(result).toEqual(expectedUser);
    });

    it('should return null if password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('aivacol', 10);
      mockUsersService.findByNickname.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.validateUser('aivacol', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      mockUsersService.findByNickname.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an object with access_token', async () => {
      const { password, ...userWithoutPassword } = mockUser;
      const result = await service.login(userWithoutPassword);

      expect(result).toEqual({
        access_token: 'mockedjwttoken',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: userWithoutPassword.id,
        nickname: userWithoutPassword.nickname,
        tenantId: userWithoutPassword.tenant_id,
      });
    });
  });
});
