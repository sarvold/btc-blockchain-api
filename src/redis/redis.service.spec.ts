import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: Redis;

  beforeEach(async () => {
    redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: Redis,
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await redisClient.flushall();
    await redisClient.quit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should set a key-value pair with expiration', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const expirationSeconds = 10;

      await service.set(key, value, expirationSeconds);

      const result = await redisClient.get(key);
      expect(result).toBe(value);

      const ttl = await redisClient.ttl(key);
      expect(ttl).toBe(expirationSeconds);
    });
  });

  describe('get', () => {
    it('should get the value of a key', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await redisClient.set(key, value);

      const result = await service.get(key);
      expect(result).toBe(value);
    });

    it('should return null if the key does not exist', async () => {
      const key = 'non-existent-key';

      const result = await service.get(key);
      expect(result).toBeNull();
    });
  });
});
