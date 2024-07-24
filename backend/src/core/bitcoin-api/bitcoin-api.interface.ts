import { Address, Block, RecommendedFees, Transaction, UTXO } from './bitcoin-api.schema';

export interface IBitcoinDataProvider {
  getFeesRecommended(): Promise<RecommendedFees>;
  getAddress({ address }: { address: string }): Promise<Address>;
  getAddressTxsUtxo({ address }: { address: string }): Promise<UTXO[]>;
  getAddressTxs({
    address,
    after_txid,
  }: {
    address: string;
    after_txid?: string;
  }): Promise<Transaction[]>;
  getTx({ txid }: { txid: string }): Promise<Transaction>;
  getTxHex({ txid }: { txid: string }): Promise<string>;
  getBlock({ hash }: { hash: string }): Promise<Block>;
  getBlockTxs({ hash }: { hash: string }): Promise<Transaction[]>;
  getBlockHeight({ height }: { height: number }): Promise<string>;
  getBlockHeader({ hash }: { hash: string }): Promise<string>;
  getBlockTxids({ hash }: { hash: string }): Promise<string[]>;
  getBlocksTipHash(): Promise<string>;
}
