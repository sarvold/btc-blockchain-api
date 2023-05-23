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
    let addresses: string[];
    it('should respond within 10 seconds', () => {
      return request(app.getHttpServer())
        .get('/blockchain/addresses')
        .expect(200)
        .expect((res) => {
          addresses = res?.body;
          expect(Array.isArray(addresses)).toBe(true);
        });
    }, 10000);
    it('should respond within 20ms (due to cached the first time)', () => {
      const start = Date.now();
      return request(app.getHttpServer())
        .get('/blockchain/addresses')
        .expect(200)
        .expect(() => {
          const end = Date.now();
          expect(end - start).toBeLessThan(20); // Check that the request took less than 20ms
        });
    });
    it('should return same array of addresses', () => {
      return request(app.getHttpServer())
        .get('/blockchain/addresses')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res?.body)).toBe(true);
          expect(res?.body).toEqual(addresses);
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
          expect(res.body).toHaveProperty('total_received');
          expect(res.body).toHaveProperty('total_sent');
          expect(res.body).toHaveProperty('balance');
          expect(res.body).toHaveProperty('unconfirmed_balance');
          expect(res.body).toHaveProperty('final_balance');
          expect(res.body).toHaveProperty('n_tx');
          expect(res.body).toHaveProperty('unconfirmed_n_tx');
          expect(res.body).toHaveProperty('final_n_tx');
          expect(res.body).toHaveProperty('txrefs');
          expect(res.body).toHaveProperty('tx_url');
        });
    }, 6000);
  });

  describe('/blockchain/transactions/:txHash (GET)', () => {
    it('should return info for a specific transaction', () => {
      return request(app.getHttpServer())
        .get(
          '/blockchain/transactions/61b48c3133314ac09cae1f22135db4efa4502b78aaa7bd1173d85fa436c27f5f',
        )
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('block_hash');
          expect(res.body).toHaveProperty('block_height');
          expect(res.body).toHaveProperty('block_index');
          expect(res.body).toHaveProperty('hash');
          expect(res.body).toHaveProperty('addresses');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('fees');
          expect(res.body).toHaveProperty('size');
          expect(res.body).toHaveProperty('vsize');
          expect(res.body).toHaveProperty('preference');
          expect(res.body).toHaveProperty('confirmed');
          expect(res.body).toHaveProperty('received');
          expect(res.body).toHaveProperty('ver');
          expect(res.body).toHaveProperty('double_spend');
          expect(res.body).toHaveProperty('vin_sz');
          expect(res.body).toHaveProperty('vout_sz');
          expect(res.body).toHaveProperty('confirmations');
          expect(res.body).toHaveProperty('confidence');
          expect(res.body).toHaveProperty('inputs');
          expect(res.body).toHaveProperty('outputs');
        });
    }, 6000);
    it('should return 404', () => {
      return request(app.getHttpServer())
        .get('/blockchain/transactions/nonexistent-hash')
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'Cannot GET /blockchain/transactions/nonexistent-hash',
            statusCode: 404,
          });
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
    it('should return 404', () => {
      return request(app.getHttpServer())
        .get('/blockchain/top-addresses/qwerty')
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'Cannot GET /blockchain/top-addresses/qwerty',
            statusCode: 404,
          });
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
    it('should return 404', () => {
      return request(app.getHttpServer())
        .get('/blockchain/top-transactions/qwerty')
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'Cannot GET /blockchain/top-transactions/qwerty',
            statusCode: 404,
          });
        });
    });
  });
  describe('Wrong URL', () => {
    it('should return 404', () => {
      return request(app.getHttpServer())
        .get('/blockchain/wrong-url')
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            error: 'Not Found',
            message: 'Cannot GET /blockchain/wrong-url',
            statusCode: 404,
          });
        });
    });
  });
});
