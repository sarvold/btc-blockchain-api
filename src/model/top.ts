interface BtcTop {
  _id: string;
  __v: number;
  searchCount: number;
}
export interface BtcTopAddress extends BtcTop {
  address: string;
}
export interface BtcTopTransaction extends BtcTop {
  txHash: string;
}
export type BtcTopClean<T> = Omit<T, '_id' | '__v'>;
