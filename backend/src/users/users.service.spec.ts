import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    nickname: 'aivacol',
    name: 'Aivacol Standard User',
    email: 'aivacol@aivacol.com',
    password: 'hashedpassword',
    tenant_id: 'aivacol',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByNickname', () => {
    it('should return a user if found by nickname', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByNickname('aivacol');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { nickname: 'aivacol' },
      });
    });

    it('should return null if user is not found by nickname', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByNickname('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createInitialSeed', () => {
    it('should seed standard user "aivacol" if table is empty', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.createInitialSeed();

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { nickname: 'aivacol' },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not seed if standard user "aivacol" already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await service.createInitialSeed();

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
