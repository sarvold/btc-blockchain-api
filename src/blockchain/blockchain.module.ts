import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MdbAddressSchema, MdbTransactionSchema } from '../schemas/btc.schema';
import { RedisModule } from '../redis/redis.module';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';

console.log('Loading BlockchainModule...');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`
    }),
    RedisModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        auth: {
          username: configService.get<string>('MONGODB_USER'),
          password: configService.get<string>('MONGODB_PASSWORD'),
        },
        dbName: configService.get<string>('MONGODB_DATABASE'),
      }),
      inject: [ConfigService],
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
