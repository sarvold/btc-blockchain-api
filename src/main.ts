import { NestFactory } from '@nestjs/core';
import { BlockchainModule } from './blockchain/blockchain.module';


async function bootstrap() {
  console.log('Starting application');
  const app = await NestFactory.create(BlockchainModule);
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
