import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return the token from authService', async () => {
      const mockToken = { access_token: 'signedjwttoken' };
      mockAuthService.login.mockResolvedValue(mockToken);

      const req = {
        user: {
          id: 1,
          nickname: 'aivacol',
          name: 'Aivacol Standard User',
          email: 'aivacol@aivacol.com',
          tenant_id: 'aivacol',
        },
      };

      const result = await controller.login(req);

      expect(result).toEqual(mockToken);
      expect(authService.login).toHaveBeenCalledWith(req.user);
    });
  });
});
