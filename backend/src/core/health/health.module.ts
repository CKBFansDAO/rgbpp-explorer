import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CkbRpcModule } from '../ckb-rpc/ckb-rpc.module';
import { CkbExplorerModule } from '../ckb-explorer/ckb-explorer.module';
import { BitcoinApiModule } from '../bitcoin-api/bitcoin-api.module';
import { HttpModule } from '@nestjs/axios';
import { IndexerModule } from '../indexer/indexer.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    BitcoinApiModule,
    CkbRpcModule,
    CkbExplorerModule,
    IndexerModule,
  ],
  providers: [HealthController],
  controllers: [HealthController],
})
export class HealthModule {}
