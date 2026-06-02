import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditLogsResponse = {
    data: [
      {
        event: 'brand.created',
        tenant_id: 'aivacol',
        user: 'aivacol',
        payload: { id: 1, name: 'Honda' },
        timestamp: new Date(),
      },
    ],
    total: 1,
  };

  const mockAuditService = {
    findAll: jest.fn(),
    createLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should retrieve audit logs filtering by tenant with pagination', async () => {
      mockAuditService.findAll.mockResolvedValue(mockAuditLogsResponse);

      const result = await controller.getLogs('aivacol', 1, 10);

      expect(result).toEqual(mockAuditLogsResponse);
      expect(service.findAll).toHaveBeenCalledWith('aivacol', 1, 10);
    });
  });

  describe('handleAuditLog', () => {
    it('should consume rabbitmq audit.log pattern event and save to mongodb', async () => {
      mockAuditService.createLog.mockResolvedValue(undefined);

      const payload = {
        event: 'brand.created',
        tenantId: 'aivacol',
        user: 'aivacol',
        payload: { id: 1, name: 'Honda' },
      };

      await controller.handleAuditLog(payload);

      expect(service.createLog).toHaveBeenCalledWith(
        payload.event,
        payload.tenantId,
        payload.user,
        payload.payload,
      );
    });
  });
});
