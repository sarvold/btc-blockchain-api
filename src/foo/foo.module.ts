import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { FooService } from './foo.service';

@Module({
  providers: [FooService],
  exports: [FooService],
  imports: [RedisModule],
})
export class FooModule {}
