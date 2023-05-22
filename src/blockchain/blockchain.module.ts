import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { MdbAddressSchema, MdbTransactionSchema } from '../schemas/btc.schema';
import { RedisModule } from '../redis/redis.module';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

console.log('Loading BlockchainModule...');

dotenv.config(); // .env must be loaded here otherwise we don't get envs properly loaded

@Module({
  imports: [
    RedisModule,
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      auth: {
        username: process.env.MONGODB_USER,
        password: process.env.MONGODB_PASSWORD,
      },
      dbName: process.env.MONGODB_DATABASE,
    }),
    MongooseModule.forFeature([
      { name: 'BtcBlockchainAddress', schema: MdbAddressSchema },
      { name: 'BtcBlockchainTransaction', schema: MdbTransactionSchema },
    ]),
  ],
  providers: [BlockchainService],
  controllers: [BlockchainController],
})
export class BlockchainModule {}
