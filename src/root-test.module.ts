import { Module } from '@nestjs/common';
import { BlockchainModule } from './blockchain/blockchain.module';
import { RedisModule } from "./redis/redis.module";

@Module({
    imports: [RedisModule, BlockchainModule],
  })
  export class RootTestModule {}