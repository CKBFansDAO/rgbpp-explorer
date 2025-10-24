// import { RgbppTransaction } from '@/types/graphql'
// import { CkbTransaction } from '@/types/graphql'

export function resolveLayerTypeFromRGBppTransaction<
  T extends {
    btc?: { txid: string | null };
    direction?: 'on' | 'off' | 'within' | null;
    ckbTransaction: any;
    network:'ckb'|'btc'
  }
>(tx: T) {
   // withinBTC L1 在首页是null
  // in L1-L2 在首页是on
  // leapoutBTC L2-L1 在首页是off
  switch (tx.direction) {
    case 'on':
      return 'l1-l2'
    case 'off':
      return 'l2-l1'
    case 'within':
      return 'l1'
    default:
      if (tx.network==='ckb' && !tx.direction) return 'l2'
      return 'l1'
  }
}


