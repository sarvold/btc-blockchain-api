import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { RedisModule } from 'src/redis/redis.module';
import { AddressSchema, TransactionSchema } from 'src/schemas/btc.schema';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

console.log('Loading BlockchainModule...')

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
      { name: 'Address', schema: AddressSchema },
      { name: 'Transaction', schema: TransactionSchema },
    ]),
  ],
  providers: [BlockchainService],
  controllers: [BlockchainController]
})
export class BlockchainModule {}
