import * as mongoose from 'mongoose';

export const MdbAddressSchema = new mongoose.Schema({
  address: String,
  searchCount: Number,
});

export const MdbTransactionSchema = new mongoose.Schema({
  txHash: String,
  searchCount: Number,
});
