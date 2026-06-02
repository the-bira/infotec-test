import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';

describe('AuditService', () => {
  let service: AuditService;
  let model: any;

  const mockAuditLog = {
    event: 'brand.created',
    tenant_id: 'aivacol',
    user: 'aivacol',
    payload: { id: 1, name: 'Honda' },
    timestamp: new Date(),
    save: jest.fn(),
  };

  // Mock class for Mongoose model constructor/static methods
  class MockAuditLogModel {
    constructor(public data: any) {
      Object.assign(this, data);
    }
    save = jest.fn().mockResolvedValue(mockAuditLog);
    static find = jest.fn();
    static countDocuments = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: MockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    model = module.get(getModelToken(AuditLog.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should instantiate and save a new audit log', async () => {
      const result = await service.createLog(
        'brand.created',
        'aivacol',
        'aivacol',
        { id: 1, name: 'Honda' },
      );

      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should search logs filtering by tenant_id with pagination and sort by timestamp desc', async () => {
      const mockQueryExec = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      const mockCountExec = {
        exec: jest.fn().mockResolvedValue(1),
      };

      model.find.mockReturnValue(mockQueryExec);
      model.countDocuments.mockReturnValue(mockCountExec);

      const result = await service.findAll('aivacol', 2, 5);

      expect(model.find).toHaveBeenCalledWith({ tenant_id: 'aivacol' });
      expect(mockQueryExec.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryExec.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockQueryExec.limit).toHaveBeenCalledWith(5);
      expect(model.countDocuments).toHaveBeenCalledWith({ tenant_id: 'aivacol' });
      expect(result).toEqual({ data: [mockAuditLog], total: 1 });
    });
  });
});
