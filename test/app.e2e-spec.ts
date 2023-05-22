import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { BlockchainModule } from '../src/blockchain/blockchain.module';

describe('BlockchainController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BlockchainModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/blockchain/addresses (GET)', () => {
    it('should return an array of addresses', () => {
      return request(app.getHttpServer())
        .get('/blockchain/addresses')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/blockchain/addresses/:address (GET)', () => {
    it('should return info for a specific address', () => {
      return request(app.getHttpServer())
        .get(
          '/blockchain/addresses/bc1p8pnsd4lyy08qfwqfrkegp5ue6lhmhvpu0qdz87w62jgkzpsza82qfe3l30',
        )
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('address');
          expect(res.body).toHaveProperty('balance');
          expect(res.body).toHaveProperty('total_received');
          expect(res.body).toHaveProperty('total_sent');
          expect(res.body).toHaveProperty('unconfirmed_balance');
          expect(res.body).toHaveProperty('unconfirmed_txrefs');
          expect(res.body).toHaveProperty('txrefs');
        });
    });
  });

  describe('/blockchain/transactions/:txHash (GET)', () => {
    it('should return info for a specific transaction', () => {
      return request(app.getHttpServer())
        .get(
          '/blockchain/transactions/61b48c3133314ac09cae1f22135db4efa4502b78aaa7bd1173d85fa436c27f5f',
        )
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('block_height');
          expect(res.body).toHaveProperty('block_index');
          expect(res.body).toHaveProperty('hash');
          expect(res.body).toHaveProperty('inputs');
          expect(res.body).toHaveProperty('lock_time');
          expect(res.body).toHaveProperty('outputs');
          expect(res.body).toHaveProperty('relayed_by');
          expect(res.body).toHaveProperty('result');
          expect(res.body).toHaveProperty('size');
          expect(res.body).toHaveProperty('time');
          expect(res.body).toHaveProperty('tx_index');
          expect(res.body).toHaveProperty('vin_sz');
          expect(res.body).toHaveProperty('vout_sz');
        });
    });
  });

  describe('/blockchain/top-addresses (GET)', () => {
    it('should return an array of top addresses', () => {
      return request(app.getHttpServer())
        .get('/blockchain/top-addresses')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/blockchain/top-transactions (GET)', () => {
    it('should return an array of top transactions', () => {
      return request(app.getHttpServer())
        .get('/blockchain/top-transactions')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
