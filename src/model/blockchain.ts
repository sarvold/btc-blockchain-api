export interface BtcBlock {
  id: number;
  hash: string;
  date: string;
  time: string;
  median_time: string;
  size: number;
  stripped_size: number;
  weight: number;
  version: number;
  version_hex: string;
  version_bits: string;
  merkle_root: string;
  nonce: number;
  bits: number;
  difficulty: number;
  chainwork: string;
  coinbase_data_hex: string;
  transaction_count: number;
  witness_count: number;
  input_count: number;
  output_count: number;
  input_total: number;
  input_total_usd: number;
  output_total: number;
  output_total_usd: number;
  fee_total: number;
  fee_total_usd: number;
  fee_per_kb: number;
  fee_per_kb_usd: number;
  fee_per_kwu: number;
  fee_per_kwu_usd: number;
  cdd_total: number;
  generation: number;
  generation_usd: number;
  reward: number;
  reward_usd: number;
  guessed_miner: string;
}
export interface BlockchairApiResponseContext {
  code?: number;
  source?: string;
  limit?: number;
  offset?: number;
  rows?: number;
  pre_rows?: number;
  total_rows?: number;
  state?: number;
  market_price_usd?: number;
  cache?: {
    live?: boolean;
    duration?: number;
    since?: string;
    until?: string;
    time?: number;
  };
  api?: {
    version?: string;
    last_major_update?: string;
    next_major_update?: string | null;
    documentation?: string;
    notice?: string;
  };
  servers?: string;
  time?: number;
  render_time?: number;
  full_time?: number;
  request_cost?: number;
}

export interface BlockChairApiResponse<T> {
  data: T[]; // T can be BtcBlock or BtcTransaction
  context: BlockchairApiResponseContext;
}

export interface BtcTransaction {
  block_id: number;
  id: number;
  hash: string;
  date: string;
  time: string;
  size: number;
  weight: number;
  version: number;
  lock_time: number;
  is_coinbase: boolean;
  has_witness: boolean;
  input_count: number;
  output_count: number;
  input_total: number;
  input_total_usd: number;
  output_total: number;
  output_total_usd: number;
  fee: number;
  fee_usd: number;
  fee_per_kb: number;
  fee_per_kb_usd: number;
  fee_per_kwu: number;
  fee_per_kwu_usd: number;
  cdd_total: number;
}
