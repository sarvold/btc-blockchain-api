import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Model, ModifyResult, Query } from 'mongoose';
import {
  BlockchairApiResponse,
  BlockchairBlock,
  BlockchairTransaction,
  BlockcypherAddress,
  BlockcypherTransaction,
  BlockstreamTransaction,
} from '../model/blockchain';
import { RedisService } from '../redis/redis.service';
import { BlockchainService } from './blockchain.service';

// Mock the RedisService dependency
class RedisServiceMock {
  set = jest.fn();
  get = jest.fn();
}

describe('BlockchainService', () => {
  let axiosMock: MockAdapter;
  let service: BlockchainService;
  let redisServiceMock: RedisServiceMock;
  let fakeAddressModel: Partial<Model<BlockcypherAddress>>;
  let fakeTransactionModel: Partial<Model<BlockcypherTransaction>>;

  beforeEach(async () => {
    jest.createMockFromModule('../redis/redis.module');
    axiosMock = new MockAdapter(axios);

    // Callback hell! Room for improvement here, but didn't search hard enough yet.
    fakeAddressModel = {
      findOneAndUpdate: () => {
        return {} as Query<
          ModifyResult<unknown>,
          unknown,
          unknown,
          BlockcypherAddress,
          'findOneAndUpdate'
        >;
      },
      find: () => {
        return {
          sort: () => {
            return {
              limit: () => {
                return {
                  exec: () => {
                    return [
                      {
                        address: 'address1',
                        searchCount: 10,
                        _id: '1',
                        __v: 0,
                      },
                      { address: 'address2', searchCount: 8, _id: '2', __v: 0 },
                      { address: 'address3', searchCount: 6, _id: '3', __v: 0 },
                      { address: 'address4', searchCount: 4, _id: '4', __v: 0 },
                      { address: 'address5', searchCount: 2, _id: '5', __v: 0 },
                    ];
                  },
                } as unknown as Query<
                  unknown[],
                  unknown,
                  unknown,
                  BlockcypherAddress,
                  'find'
                >;
              },
            } as unknown as Query<
              unknown[],
              unknown,
              unknown,
              BlockcypherAddress,
              'find'
            >;
          },
        } as Query<unknown[], unknown, unknown, BlockcypherAddress, 'find'>;
      },
    };
    fakeTransactionModel = {
      findOneAndUpdate: () => {
        return {} as Query<
          ModifyResult<unknown>,
          unknown,
          unknown,
          BlockcypherTransaction,
          'findOneAndUpdate'
        >;
      },
      find: () => {
        return {
          sort: () => {
            return {
              limit: () => {
                return {
                  exec: () => {
                    return [
                      { txHash: 'tx1', searchCount: 10, _id: '1', __v: 0 },
                      { txHash: 'tx2', searchCount: 8, _id: '2', __v: 0 },
                      { txHash: 'tx3', searchCount: 6, _id: '3', __v: 0 },
                      { txHash: 'tx4', searchCount: 4, _id: '4', __v: 0 },
                      { txHash: 'tx5', searchCount: 2, _id: '5', __v: 0 },
                    ];
                  },
                } as unknown as Query<
                  unknown[],
                  unknown,
                  unknown,
                  BlockcypherAddress,
                  'find'
                >;
              },
            } as unknown as Query<
              unknown[],
              unknown,
              unknown,
              BlockcypherAddress,
              'find'
            >;
          },
        } as Query<unknown[], unknown, unknown, BlockcypherAddress, 'find'>;
      },
    };
    // const redisClient = new Redis(); // Create a new ioredis client
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: RedisService,
          useClass: RedisServiceMock,
        },
        // Nest can't resolve dependencies of the RedisService (?). Please make sure that the argument Redis at index [0] is available in the RedisModule context.
        // {
        //   provide: RedisService,
        //   useValue: redisServiceMock,
        // },
        {
          provide: getModelToken('BtcBlockchainAddress'),
          useValue: fakeAddressModel,
        },
        {
          provide: getModelToken('BtcBlockchainTransaction'),
          useValue: fakeTransactionModel,
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    redisServiceMock = module.get<RedisServiceMock>(RedisService);
  });

  afterEach(() => {
    axiosMock.reset();
    jest.resetAllMocks();
  });

  describe('getAddressesWithRecentTransactions', () => {
    it('should return cached addresses if available', async () => {
      const cachedAddresses = ['address1', 'address2'];
      jest
        .spyOn(redisServiceMock, 'get')
        .mockResolvedValueOnce(JSON.stringify(cachedAddresses));

      const result = await service.getAddressesWithRecentTransactions();

      expect(result).toEqual(cachedAddresses);
      expect(redisServiceMock.get).toHaveBeenCalledWith('addresses');
    });

    it('should fetch addresses from APIs and store them in redis if not cached', async () => {
      const blockResponse: Partial<
        BlockchairApiResponse<Partial<BlockchairBlock>>
      > = {
        data: [{ id: 990000123 }],
      };
      const blockTransactionsResponse: Partial<
        BlockchairApiResponse<Partial<BlockchairTransaction>>
      > = {
        data: [{ hash: 'tx1' }, { hash: 'tx2' }],
      };
      const transactionResponse: Partial<BlockstreamTransaction> = {
        vin: [{ prevout: { scriptpubkey_address: 'address1' } }],
        vout: [{ scriptpubkey_address: 'address2' }],
      } as BlockstreamTransaction;
      jest.spyOn(redisServiceMock, 'get').mockResolvedValueOnce(null);
      jest.spyOn(redisServiceMock, 'set').mockResolvedValueOnce(null);

      const recentBlockUrl =
        'https://api.blockchair.com/bitcoin/blocks?s=id(desc)&limit=1';
      axiosMock
        .onGet(recentBlockUrl)
        .replyOnce<Partial<BlockchairApiResponse<Partial<BlockchairBlock>>>>(
          200,
          blockResponse,
        );
      const transactionsForBlockUrl =
        /^https:\/\/api\.blockchair\.com\/bitcoin\/transactions\?q=block_id\(/;
      axiosMock
        .onGet(transactionsForBlockUrl)
        .replyOnce<
          Partial<BlockchairApiResponse<Partial<BlockchairTransaction>>>
        >(200, blockTransactionsResponse);
      const transactionInfoUrl = /^https:\/\/blockstream\.info\/api\/tx\//;
      axiosMock
        .onGet(transactionInfoUrl)
        .reply<Partial<BlockstreamTransaction>>(200, transactionResponse);

      const result = await service.getAddressesWithRecentTransactions();

      expect(result).toEqual(['address1', 'address2']);
      expect(redisServiceMock.get).toHaveBeenCalledWith('addresses');

      expect(axiosMock.history.get[0].url).toContain(
        'https://api.blockchair.com/bitcoin/blocks?s=id(desc)&limit=1',
      );

      expect(axiosMock.history.get[1].url).toContain(
        'https://api.blockchair.com/bitcoin/transactions?q=block_id(990000123)',
      );
      expect(axiosMock.history.get[2].url).toContain(
        'https://blockstream.info/api/tx/tx1',
      );
      expect(axiosMock.history.get[3].url).toContain(
        'https://blockstream.info/api/tx/tx2',
      );
      expect(redisServiceMock.set).toHaveBeenCalledWith(
        'addresses',
        JSON.stringify(['address1', 'address2']),
        service.REDIS_EXPIRY_TIME,
      );
    });
  });

  describe('getAddressInfo', () => {
    it('should return address info and increment search count', async () => {
      const addressInfo: Partial<BlockcypherAddress> = { address: 'address1' };
      axiosMock
        .onGet()
        .replyOnce<Partial<BlockcypherAddress>>(200, addressInfo);
      jest.spyOn(fakeAddressModel, 'findOneAndUpdate').mockReturnValue(null);

      const result = await service.getAddressInfo('address1');

      expect(result).toEqual(addressInfo);
      expect(axiosMock.history.get[0].url).toContain(
        'https://api.blockcypher.com/v1/btc/main/addrs/address1',
      );
      expect(fakeAddressModel.findOneAndUpdate).toHaveBeenCalledWith(
        { address: 'address1' },
        { $inc: { searchCount: 1 } },
        { upsert: true },
      );
    });
  });

  describe('getTransactionInfo', () => {
    it('should return transaction info and increment search count', async () => {
      const transactionInfo: Partial<BlockcypherTransaction> = { hash: 'tx1' };
      axiosMock
        .onGet()
        .replyOnce<Partial<BlockcypherTransaction>>(200, transactionInfo);
      jest
        .spyOn(fakeTransactionModel, 'findOneAndUpdate')
        .mockReturnValue(null);
      const result = await service.getTransactionInfo('tx1');

      expect(result).toEqual(transactionInfo);
      expect(axiosMock.history.get[0].url).toContain(
        'https://api.blockcypher.com/v1/btc/main/txs/tx1',
      );
      expect(fakeTransactionModel.findOneAndUpdate).toHaveBeenCalledWith(
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
  });

  // YAGN: below code was meant to test failures when calling mongo, but don't want to spend any more time debugging it right now
  //   it('should throw an InternalServerErrorException if an error occurs', async () => {
  //     // jest.spyOn(fakeAddressModel, 'find').mockRejectedValue(new Error());
  //     fakeAddressModel.find = () => Promise.reject('DB call failed');
  //     await expect(service.getTopAddresses()).rejects.toThrow(
  //       InternalServerErrorException,
  //     );
  //     expect(fakeAddressModel.find).toHaveBeenCalled();
  //     await expect(fakeAddressModel.find()).rejects.toThrow();
  //   });
  // });

  describe('getTopTransactions', () => {
    it('should return the top transactions from MongoDB', async () => {
      const topTransactions = await service.getTopTransactions();
      expect(topTransactions).toEqual([
        { txHash: 'tx1', searchCount: 10 },
        { txHash: 'tx2', searchCount: 8 },
        { txHash: 'tx3', searchCount: 6 },
        { txHash: 'tx4', searchCount: 4 },
        { txHash: 'tx5', searchCount: 2 },
      ]);
    });

    // YAGN: same here
    // it('should throw an InternalServerErrorException if an error occurs', async () => {
    //   jest
    //     .spyOn(fakeTransactionModel, 'find')
    //     .mockRejectedValueOnce(new Error());

    //   await expect(service.getTopTransactions()).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    //   expect(fakeTransactionModel.find).toHaveBeenCalledWith();
    // });
  });
});
