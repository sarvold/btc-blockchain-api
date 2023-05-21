import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

console.log('Loading BlockchainModule...')

@Module({
  imports: [RedisModule],
  providers: [BlockchainService],
  controllers: [BlockchainController]
})
export class BlockchainModule {}
