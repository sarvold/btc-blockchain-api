import { InternalServerErrorException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosResponse } from 'axios';
import Redis from 'ioredis';
import { Model } from 'mongoose';
import {
  BlockchairApiResponse,
  BlockchairBlock,
  BlockchairTransaction,
  BlockcypherAddress,
  BlockcypherTransaction,
  BlockstreamTransaction,
} from 'src/model/blockchain';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;
  let redisService: RedisService;
  let addressModel: Model<BlockcypherAddress>;
  let transactionModel: Model<BlockcypherTransaction>;

  beforeEach(async () => {
    // const redisClient = new Redis(); // Create a new ioredis client
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: getModelToken('BtcBlockchainAddress'),
          useValue: {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValueOnce([
              { address: 'address1', searchCount: 10 },
              { address: 'address2', searchCount: 8 },
              { address: 'address3', searchCount: 6 },
              { address: 'address4', searchCount: 4 },
              { address: 'address5', searchCount: 2 },
            ]),
          },
        },
        {
          provide: getModelToken('BtcBlockchainTransaction'),
          useValue: {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValueOnce([
              { txHash: 'tx1', searchCount: 10, _id: '1', __v: 0 },
              { txHash: 'tx2', searchCount: 8, _id: '2', __v: 0 },
              { txHash: 'tx3', searchCount: 6, _id: '3', __v: 0 },
              { txHash: 'tx4', searchCount: 4, _id: '4', __v: 0 },
              { txHash: 'tx5', searchCount: 2, _id: '5', __v: 0 },
            ]),
          },
        },
      ],
      imports: [RedisModule],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    redisService = module.get<RedisService>(RedisService);
    addressModel = module.get<Model<BlockcypherAddress>>(
      getModelToken('BtcBlockchainAddress'),
    );
    transactionModel = module.get<Model<BlockcypherTransaction>>(
      getModelToken('BtcBlockchainTransaction'),
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAddressesWithRecentTransactions', () => {
    it('should return cached addresses if available', async () => {
      const cachedAddresses = ['address1', 'address2'];
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce(JSON.stringify(cachedAddresses));

      const result = await service.getAddressesWithRecentTransactions();

      expect(result).toEqual(cachedAddresses);
      expect(redisService.get).toHaveBeenCalledWith('addresses');
    });

    it('should fetch addresses from APIs and store them in redis if not cached', async () => {
      const blockResponse: Partial<
        BlockchairApiResponse<Partial<BlockchairBlock>>
      > = {
        data: [{ id: 990000123 }],
      };
      const transactionsResponse: Partial<
        BlockchairApiResponse<Partial<BlockchairTransaction>>
      > = {
        data: [{ hash: 'tx1' }, { hash: 'tx2' }],
      };
      const transactionResponse: AxiosResponse<BlockstreamTransaction> = {
        data: {
          vin: [{ prevout: { scriptpubkey_address: 'address1' } }],
          vout: [{ scriptpubkey_address: 'address2' }],
        },
      } as AxiosResponse<BlockstreamTransaction>;
      jest.spyOn(redisService, 'get').mockResolvedValueOnce(null);
      jest.spyOn(redisService, 'set').mockResolvedValueOnce(null);
      jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: blockResponse })
        .mockResolvedValueOnce({ data: transactionsResponse })
        .mockResolvedValueOnce(transactionResponse);

      const result = await service.getAddressesWithRecentTransactions();

      expect(result).toEqual(['address1', 'address2']);
      expect(redisService.get).toHaveBeenCalledWith('addresses');
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.blockchair.com/bitcoin/blocks?s=id(desc)&limit=1',
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.blockchair.com/bitcoin/transactions?q=block_id(block1)',
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://blockstream.info/api/tx/tx1',
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://blockstream.info/api/tx/tx2',
      );
      expect(redisService.set).toHaveBeenCalledWith(
        'addresses',
        JSON.stringify(['address1', 'address2']),
        service.REDIS_EXPIRY_TIME,
      );
    });
  });

  describe('getAddressInfo', () => {
    it('should return address info and increment search count', async () => {
      const addressInfo = { address: 'address1' } as BlockcypherAddress;
      jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: addressInfo });
      jest.spyOn(addressModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

      const result = await service.getAddressInfo('address1');

      expect(result).toEqual(addressInfo);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.blockcypher.com/v1/btc/main/addrs/address1',
      );
      expect(addressModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: 'address1' },
        { $inc: { searchCount: 1 } },
        { upsert: true },
      );
    });
  });

  describe('getTransactionInfo', () => {
    it('should return transaction info and increment search count', async () => {
      const transactionInfo = { tx_hash: 'tx1' } as BlockcypherTransaction;
      jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: transactionInfo });
      jest
        .spyOn(transactionModel, 'findOneAndUpdate')
        .mockResolvedValueOnce(null);

      const result = await service.getTransactionInfo('tx1');

      expect(result).toEqual(transactionInfo);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.blockcypher.com/v1/btc/main/txs/tx1',
      );
      expect(transactionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { txHash: 'tx1' },
        { $inc: { searchCount: 1 } },
        { upsert: true },
      );
    });
  });

  describe('getTopAddresses', () => {
    it('should return the top addresses from MongoDB', async () => {
      const topAddresses = await service.getTopAddresses();
      expect(topAddresses).toEqual([
        { address: 'address1', searchCount: 10 },
        { address: 'address2', searchCount: 8 },
        { address: 'address3', searchCount: 6 },
        { address: 'address4', searchCount: 4 },
        { address: 'address5', searchCount: 2 },
      ]);
    });
    it('should throw an InternalServerErrorException if an error occurs', async () => {
      jest.spyOn(addressModel, 'find').mockRejectedValueOnce(new Error());

      await expect(service.getTopAddresses()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(addressModel.find).toHaveBeenCalledWith();
    });
  });

  describe('getTopTransactions', () => {
    it('should return the top transactions from MongoDB', async () => {
      const topTransactions = await service.getTopTransactions();
      expect(topTransactions).toEqual([
        { txHash: 'txHash1', searchCount: 10 },
        { txHash: 'txHash2', searchCount: 8 },
        { txHash: 'txHash3', searchCount: 6 },
        { txHash: 'txHash4', searchCount: 4 },
        { txHash: 'txHash5', searchCount: 2 },
      ]);
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      jest.spyOn(transactionModel, 'find').mockRejectedValueOnce(new Error());

      await expect(service.getTopTransactions()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(transactionModel.find).toHaveBeenCalledWith();
    });
  });
});
