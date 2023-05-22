import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import * as redisMock from 'redis-mock';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let redisClientMock: redisMock.RedisClient;

  beforeEach(async () => {
    redisClientMock = {
      set: jest.fn(),
      get: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: Redis,
          useValue: redisMock.createClient(),
        },
      ],
    }).compile();

    redisClientMock = module.get(Redis);
    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should set a value in Redis with expiration date', async () => {
      const spy = jest.spyOn(redisClientMock, 'set');
      await service.set('my-key', 'my-value', 60);
      expect(spy).toHaveBeenCalledWith('my-key', 'my-value', 'EX', 60);
    });
  });

  describe('get', () => {
    it('should return null if the key does not exist', async () => {
      const spy = jest.spyOn(redisClientMock, 'get').mockReturnValue(undefined);
      const value = await service.get('nonexistent-key');
      expect(value).toBeUndefined();
    });
    it('should return the value if the key exists', async () => {
      jest.spyOn(redisClientMock, 'get').mockReturnValue('my-value');
      const value = await service.get('my-key');
      expect(value).toBe('my-value');
    });
  });
});
