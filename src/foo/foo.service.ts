import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FooService {
    constructor(private redisService: RedisService) {}
    
    async setSomething() {
      await this.redisService.set(
        'foo',
        JSON.stringify({hello: 'world'}),
        10000,
      );
    }
}
