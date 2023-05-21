export interface BlockchairBlock {
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

export interface BlockchairApiResponse<T> {
  data: T[]; // T can be BlockchairBlock or BlockchairTransaction
  context: BlockchairApiResponseContext;
}

export interface BlockchairTransaction {
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

export interface BlockcypherTransaction {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
  ref_balance: number;
  confirmations: number;
  confirmed: string;
  double_spend: boolean;
}

export interface BlockcypherAddress {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
  txrefs: BlockcypherTransaction[];
  tx_url: string;
}
