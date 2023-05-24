import { Inject, Injectable } from '@nestjs/common';
import { RedisClient } from './redis.providers';

@Injectable()
export class RedisService {
  public constructor(
    @Inject('REDIS_CLIENT')
    private readonly client: RedisClient,
  ) {}
  // }
  // async onModuleInit() {
  //   this.client = new Redis({
  //     host: process.env.REDIS_HOST,
  //     port: +process.env.REDIS_PORT,
  //   });
  // }

  // async onModuleDestroy() {
  //   await this.client.quit();
  // }

  async set(key: string, value: string, expirationSeconds: number) {
    await this.client.set(key, value, 'EX', expirationSeconds);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
}
