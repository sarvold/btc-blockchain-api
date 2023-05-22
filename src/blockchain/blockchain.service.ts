import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import {
  BlockchairApiResponse,
  BlockchairBlock,
  BlockchairTransaction,
  BlockcypherAddress,
  BlockcypherTransaction,
  BlockstreamTransaction,
  BlockstreamTransactionVin,
  BlockstreamTransactionVout,
} from 'src/model/blockchain';
import { BtcTopAddress, BtcTopClean, BtcTopTransaction } from '../model/top';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BlockchainService {
  REDIS_EXPIRY_TIME: number = 60 * 15; // amount of seconds in 15'

  constructor(
    private readonly redisService: RedisService,
    @InjectModel('BtcBlockchainAddress')
    private readonly addressModel: Model<BtcTopAddress>,
    @InjectModel('BtcBlockchainTransaction')
    private readonly transactionModel: Model<BtcTopTransaction>,
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
    try {
      const cachedAddresses = await this.redisService.get('addresses');
      if (cachedAddresses) {
        // If we still have cached addresses, we return them and forget about any API call
        return JSON.parse(cachedAddresses);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while searching for cached addresses',
      );
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
      const { data: blockTransactionsResponse } = await axios.get<
        BlockchairApiResponse<BlockchairTransaction>
      >(
        `https://api.blockchair.com/bitcoin/transactions?q=block_id(${mostRecentBlockId})`,
      );
      txids = blockTransactionsResponse.data.map((t) => t.hash);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `Error fetching list of transactions for most recent block`,
      );
    }
    const addresses = new Set<string>();

    // We want to get information from each of the transactions in order to get sample addresses
    for (const txid of txids) {
      let transactionResponse: AxiosResponse<BlockstreamTransaction, unknown>;
      try {
        // using an alternative API that retrieves trx inputs and outputs, which contain addresses
        transactionResponse = await axios.get<BlockstreamTransaction>(
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
        transaction.vin.forEach((input: BlockstreamTransactionVin) => {
          if (input.prevout) {
            addresses.add(input.prevout.scriptpubkey_address);
          }
        });

        transaction.vout.forEach((output: BlockstreamTransactionVout) => {
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
    let response: AxiosResponse<BlockcypherAddress, unknown>;
    try {
      response = await axios.get<BlockcypherAddress>(
        `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while asking blockcypher for address ${address}`,
      );
    }
    try {
      // Increment the search count for the address in MongoDB
      await this.addressModel.findOneAndUpdate(
        { address },
        { $inc: { searchCount: 1 } },
        { upsert: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while incrementing search count for address ${address}`,
      );
    }
    return response.data;
  }

  async getTransactionInfo(txHash: string): Promise<BlockcypherTransaction> {
    let response: AxiosResponse<BlockcypherTransaction, unknown>;
    try {
      response = await axios.get<BlockcypherTransaction>(
        `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while asking blockcypher for transaction ${txHash}`,
      );
    }
    try {
      // Increment the search count for the transaction in MongoDB
      await this.transactionModel.findOneAndUpdate(
        { txHash },
        { $inc: { searchCount: 1 } },
        { upsert: true },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while incrementing search count for transaction ${txHash}`,
      );
    }
    return response.data;
  }

  // Top 5 searched
  async getTopAddresses(): Promise<BtcTopClean<BtcTopAddress>[]> {
    try {
      const mongoResponse = await this.addressModel
        .find()
        .sort({ searchCount: -1 })
        .limit(5)
        .exec();
      const cleanAddress: BtcTopClean<BtcTopAddress>[] = mongoResponse.map(
        ({ address, searchCount }) => {
          return { address, searchCount };
        },
      );
      return cleanAddress;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while searching for top addresses`,
      );
    }
  }

  async getTopTransactions(): Promise<BtcTopClean<BtcTopTransaction>[]> {
    try {
      const mongoResponse = await this.transactionModel
        .find()
        .sort({ searchCount: -1 })
        .limit(5)
        .exec();
      const cleanTrx: BtcTopClean<BtcTopTransaction>[] = mongoResponse.map(
        ({ txHash, searchCount }) => {
          return { txHash, searchCount };
        },
      );
      return cleanTrx;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error while searching for top transactions`,
      );
    }
  }
}
