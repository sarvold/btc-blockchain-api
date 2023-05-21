import * as mongoose from 'mongoose';

export const AddressSchema = new mongoose.Schema({
  address: String,
  searchCount: Number,
});

export const TransactionSchema = new mongoose.Schema({
  txHash: String,
  searchCount: Number,
});
