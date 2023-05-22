import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../redis/redis.service';
import { FooService } from './foo.service';

// Mock the RedisService dependency
class RedisServiceMock {
  set = jest.fn();
}

describe('FooService', () => {
  let service: FooService;
  let redisService: RedisServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FooService,
        {
          provide: RedisService,
          useClass: RedisServiceMock,
        },
      ],
    }).compile();

    service = module.get<FooService>(FooService);
    redisService = module.get<RedisServiceMock>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setSomething', () => {
    it('should call set on RedisService', async () => {
      await service.setSomething();
      expect(redisService.set).toHaveBeenCalledWith(
        'foo',
        JSON.stringify({ hello: 'world' }),
        10000,
      );
    });
  });
});