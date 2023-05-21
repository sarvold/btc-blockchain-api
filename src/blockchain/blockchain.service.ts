import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { RedisClientType } from 'redis';
import { BlockChairApiResponse, BtcBlock, BtcTransaction } from 'src/model/blockchain';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class BlockchainService {
  REDIS_EXPIRY_TIME: number = 60*15; // amount of seconds in 15'

  constructor(private readonly redisService: RedisService) {}

  async getAddressesWithRecentTransactions(): Promise<string[]> {
    const cachedAddresses = await this.redisService.get('addresses');

    if (cachedAddresses) {
      return JSON.parse(cachedAddresses);
    }

    let txids: string[];
    try {
        // The API returns an array even though we set limit to one
        const {data: blockResponse} = await axios.get<BlockChairApiResponse<BtcBlock>>(
        'https://api.blockchair.com/bitcoin/blocks?s=id(desc)&limit=1', // should return the most recent block
      );
      const mostRecentBlockId = blockResponse.data[0].id;
      const {data: transactionsResponse} = await axios.get<BlockChairApiResponse<BtcTransaction>>(
          `https://api.blockchair.com/bitcoin/transactions?q=block_id(${mostRecentBlockId})`
      );
      txids = transactionsResponse.data.map(t => t.hash);
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
      await this.redisService.set('addresses', JSON.stringify(uniqueAddresses), this.REDIS_EXPIRY_TIME);

      return uniqueAddresses;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error storing addresses into redis',
      );
    }
  }

  async getAddressInfo(address: string): Promise<any> {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
    );
    return response.data;
  }

  async getTransactionInfo(txHash: string): Promise<any> {
    const response = await axios.get(
      `https://api.blockcypher.com/v1/btc/main/txs/${txHash}`,
    );
    return response.data;
  }

  //   async getAddressesWithRecentTransactions(): Promise<string[]> {
  //     const response = await axios.get('https://blockstream.info/api/blocks/tip/txids');
  //     const txids = response.data;
  //     const addresses = new Set<string>();

  //     for (const txid of txids) {
  //       const transactionResponse = await axios.get(`https://blockstream.info/api/tx/${txid}`);
  //       const transaction = transactionResponse.data;

  //       transaction.vin.forEach((input: any) => {
  //         if (input.prevout) {
  //           addresses.add(input.prevout.scriptpubkey_address);
  //         }
  //       });

  //       transaction.vout.forEach((output: any) => {
  //         if (output.scriptpubkey_address) {
  //           addresses.add(output.scriptpubkey_address);
  //         }
  //       });
  //     }

  //     return Array.from(addresses);
  //   }

  //   async getAddressesWithRecentTransactions(): Promise<string[]> {
  //     const cachedAddresses = await this.getAsync('addresses');

  //     if (cachedAddresses) {
  //       return JSON.parse(cachedAddresses);
  //     }

  //     const response = await axios.get('https://blockstream.info/api/blocks/tip/txids');
  //     const txids = response.data;
  //     const addresses = new Set<string>();

  //     for (const txid of txids) {
  //       const transactionResponse = await axios.get(`https://blockstream.info/api/tx/${txid}`);
  //       const transaction = transactionResponse.data;

  //       transaction.vin.forEach((input: any) => {
  //         if (input.prevout) {
  //           addresses.add(input.prevout.scriptpubkey_address);
  //         }
  //       });

  //       transaction.vout.forEach((output: any) => {
  //         if (output.scriptpubkey_address) {
  //           addresses.add(output.scriptpubkey_address);
  //         }
  //       });
  //     }

  //     const uniqueAddresses = Array.from(addresses);
  //     await this.setAsync('addresses', JSON.stringify(uniqueAddresses));

  //     return uniqueAddresses;
  //   }
  // }
  //   async getAddressesWithRecentTransactions(): Promise<string[]> {
  //     const latestBlock = await this.client.blockchain.getBlockHeight();
  //     const blockHash = await this.client.blockchain.getBlockHash(latestBlock);
  //     const block = await this.client.blockchain.getBlock(blockHash);
  //     const txs = block.txids.map(async (txid) => {
  //       const tx = await this.client.transaction.get(txid);
  //       return [
  //         tx.inputs.map((input) => input.address),
  //         tx.outputs.map((output) => output.address),
  //       ];
  //     });
  //     const addresses: string[] = [...new Set(txs.flat(2))] as string[];
  //     return addresses;
  //   }
}
