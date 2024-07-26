import DataLoader from 'dataloader';
import { Loader } from '@applifting-io/nestjs-dataloader';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CkbTransaction } from 'src/modules/ckb/transaction/transaction.model';
import {
  CkbTransactionLoader,
  CkbTransactionLoaderResponse,
} from 'src/modules/ckb/transaction/transaction.dataloader';
import { BitcoinTransaction } from 'src/modules/bitcoin/transaction/transaction.model';
import {
  BitcoinTransactionLoader,
  BitcoinTransactionLoaderResponse,
} from 'src/modules/bitcoin/transaction/transaction.dataloader';
import { RgbppBaseTransaction, RgbppLatestTransactionList, RgbppTransaction } from './transaction.model';
import { RgbppTransactionService } from './transaction.service';

@Resolver(() => RgbppTransaction)
export class RgbppTransactionResolver {
  constructor(private transactionService: RgbppTransactionService) {}

  @Query(() => RgbppLatestTransactionList, { name: 'rgbppLatestTransactions' })
  public async getLatestTransactions(
    @Args('page', { type: () => Int, nullable: true }) page: number = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize: number = 10,
  ): Promise<RgbppLatestTransactionList> {
    return await this.transactionService.getLatestTransactions(page, pageSize);
  }

  @Query(() => RgbppTransaction, { name: 'rgbppTransaction', nullable: true })
  public async getTransaction(
    @Args('txidOrTxHash') txidOrTxHash: string,
  ): Promise<RgbppBaseTransaction | null> {
    // FIXME: not sure if the txidOrTxHash is a ckb txHash or a btc txid
    // 'ck' is a ckbAddress prefix, not a txid prefix.
    return txidOrTxHash.startsWith('ck')
      ? this.transactionService.getTransactionByCkbTxHash(txidOrTxHash)
      : this.transactionService.getTransactionByBtcTxid(txidOrTxHash);
  }

  @ResolveField(() => CkbTransaction, { nullable: true })
  public async ckbTransaction(
    @Parent() tx: RgbppBaseTransaction,
    @Loader(CkbTransactionLoader)
    ckbTxLoader: DataLoader<string, CkbTransactionLoaderResponse>,
  ) {
    const ckbTx = await ckbTxLoader.load(tx.ckbTxHash);
    if (!ckbTx) {
      return null;
    }
    return CkbTransaction.from(ckbTx);
  }

  @ResolveField(() => BitcoinTransaction, { nullable: true })
  public async btcTransaction(
    @Parent() tx: RgbppBaseTransaction,
    @Loader(BitcoinTransactionLoader)
    btcTxLoader: DataLoader<string, BitcoinTransactionLoaderResponse>,
  ) {
    if (!tx.btcTxid) {
      return null;
    }
    const btcTx = await btcTxLoader.load(tx.btcTxid);
    if (!btcTx) {
      return null;
    }
    return BitcoinTransaction.from(btcTx);
  }
}
