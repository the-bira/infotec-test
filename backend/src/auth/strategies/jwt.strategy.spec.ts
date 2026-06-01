import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('AivacolSecretToken2026'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user payload with tenantId', async () => {
      const payload = {
        sub: 1,
        nickname: 'aivacol',
        tenantId: 'aivacol',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        nickname: 'aivacol',
        tenantId: 'aivacol',
      });
    });
  });
});
