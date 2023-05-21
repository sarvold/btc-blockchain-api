import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import {
    BlockchairApiResponse, BlockchairBlock,
    BlockchairTransaction, BlockcypherAddress, BlockcypherTransaction
} from 'src/model/blockchain';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BlockchainService {
  REDIS_EXPIRY_TIME: number = 60 * 15; // amount of seconds in 15'

  constructor(
    private readonly redisService: RedisService,
    @InjectModel('Address')
    private readonly addressModel: Model<BlockcypherAddress>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<BlockcypherTransaction>,
  ) {}

  /**
   * This method fetches most recent block from BTC blockchain, then the block's transactions,
   * and from the transactions it fetches the input and output addresses.
   * Then the distinct addresses are stored in redis for a sensible amount of time to avoid long waiting time on each call.
   *
   * In summary, it provides addresses involved in recent transactions.
   *
   * @returns list of addresses
   */
  async getAddressesWithRecentTransactions(): Promise<string[]> {
    const cachedAddresses = await this.redisService.get('addresses');

    if (cachedAddresses) {
      return JSON.parse(cachedAddresses);
    }

    let txids: string[];
    try {
      // The API returns an array even though we set limit to one
      const { data: blockResponse } = await axios.get<
        BlockchairApiResponse<BlockchairBlock>
      >(
        'https://api.blockchair.com/bitcoin/blocks?s=id(desc)&limit=1', // should return the most recent block
      );
      const mostRecentBlockId = blockResponse.data[0].id;
      const { data: transactionsResponse } = await axios.get<
        BlockchairApiResponse<BlockchairTransaction>
      >(
        `https://api.blockchair.com/bitcoin/transactions?q=block_id(${mostRecentBlockId})`,
      );
      txids = transactionsResponse.data.map((t) => t.hash);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Error fetching list of transactions for most recent block`,
      );
    }
    const addresses = new Set<string>();

    for (const txid of txids) {
      let transactionResponse: AxiosResponse<any, unknown>;
      try {
        transactionResponse = await axios.get(
          `https://blockstream.info/api/tx/${txid}`,
        );
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException(
          `Error fetching transaction ${txid}`,
        );
      }
      const transaction = transactionResponse.data;
      try {
        transaction.vin.forEach((input: any) => {
          if (input.prevout) {
            addresses.add(input.prevout.scriptpubkey_address);
          }
        });

        transaction.vout.forEach((output: any) => {
          if (output.scriptpubkey_address) {
            addresses.add(output.scriptpubkey_address);
          }
        });
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException(
          `Error getting address from transaction ${txid}`,
        );
      }
    }

    try {
      const uniqueAddresses = Array.from(addresses);
      await this.redisService.set(
        'addresses',
        JSON.stringify(uniqueAddresses),
        this.REDIS_EXPIRY_TIME,
      );

      return uniqueAddresses;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error storing addresses into redis',
      );
    }
  }


  async getAddressInfo(address: string): Promise<BlockcypherAddress> {
    const response = await axios.get<BlockcypherAddress>(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
    );
    // Increment the search count for the address in MongoDB
    await this.addressModel.findOneAndUpdate(
      { address },
      { $inc: { searchCount: 1 } },
      { upsert: true },
    );
    return response.data;
  }

  async getTransactionInfo(txHash: string): Promise<BlockcypherTransaction> {
    const response = await axios.get<BlockcypherTransaction>(
      `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
    );
    // Increment the search count for the transaction in MongoDB
    await this.transactionModel.findOneAndUpdate(
      { txHash },
      { $inc: { searchCount: 1 } },
      { upsert: true },
    );
    return response.data;
  }

  // Top 5 searched
  async getTopAddresses(): Promise<BlockcypherAddress[]> {
    return this.addressModel.find().sort({ searchCount: -1 }).limit(5).exec();
  }

  async getTopTransactions(): Promise<BlockcypherTransaction[]> {
    return this.transactionModel
      .find()
      .sort({ searchCount: -1 })
      .limit(5)
      .exec();
  }
}
