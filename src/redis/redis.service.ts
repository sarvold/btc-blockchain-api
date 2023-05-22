import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  // private client: Redis;

  /*
   * The construntor can't be used to inject Redis dependency because Jest struggles to resolve it.
   * Need to use onModuleInit lifecycle hook instead to avoid below error on tests for classes that depend on RedisService
   */
  // Nest can't resolve dependencies of the RedisService (?). Please make sure that the argument Redis at index [0] is available in the RedisModule context.
  // Potential solutions:
  // - Is RedisModule a valid NestJS module?
  // - If Redis is a provider, is it part of the current RedisModule?
  // - If Redis is exported from a separate @Module, is that module imported within RedisModule?
  //
  //   @Module({
  //     imports: [ /* the Module containing Redis */ ]
  //   })
  // constructor(private readonly client: Redis) {
  //   this.client = new Redis({
  //     host: 'localhost', // process.env.REDIS_HOST,
  //     port: 6379, // +process.env.REDIS_PORT,
  //   });
  // }

  constructor(private client: Redis) {}
      
  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, expirationSeconds: number) {
    await this.client.set(key, value, 'EX', expirationSeconds);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
}
