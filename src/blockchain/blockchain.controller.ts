import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }
  @Get('addresses/:address')
  async getAddressInfo(@Param('address') address: string): Promise<any> {
    return this.blockchainService.getAddressInfo(address);
  }

  @Get('transactions/:txHash')
  async getTransactionInfo(@Param('txHash') txHash: string): Promise<any> {
    return this.blockchainService.getTransactionInfo(txHash);
  }

  @Get('addresses')
  async getAddresses(): Promise<string[]> {
      console.log('Calling address')
    return this.blockchainService.getAddressesWithRecentTransactions();
  }

  @Get('top-addresses')
  async getTopAddresses(): Promise<any> {
    return this.blockchainService.getTopAddresses();
  }

  @Get('top-transactions')
  async getTopTransactions(): Promise<any> {
    return this.blockchainService.getTopTransactions();
  }
}
