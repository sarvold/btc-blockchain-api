import { Controller, Get, Param } from '@nestjs/common';
import {
  BlockcypherAddress,
  BlockcypherTransaction,
} from '../model/blockchain';
import { BtcTopAddress, BtcTopClean, BtcTopTransaction } from '../model/top';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('addresses')
  async getAddresses(): Promise<string[]> {
    return this.blockchainService.getAddressesWithRecentTransactions();
  }

  @Get('addresses/:address')
  async getAddressInfo(
    @Param('address') address: string,
  ): Promise<BlockcypherAddress> {
    return this.blockchainService.getAddressInfo(address);
  }

  @Get('transactions/:txHash')
  async getTransactionInfo(
    @Param('txHash') txHash: string,
  ): Promise<BlockcypherTransaction> {
    return this.blockchainService.getTransactionInfo(txHash);
  }

  @Get('top-addresses')
  async getTopAddresses(): Promise<BtcTopClean<BtcTopAddress>[]> {
    return this.blockchainService.getTopAddresses();
  }

  @Get('top-transactions')
  async getTopTransactions(): Promise<BtcTopClean<BtcTopTransaction>[]> {
    return this.blockchainService.getTopTransactions();
  }
}
