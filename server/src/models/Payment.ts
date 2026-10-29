import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  provider: 'razorpay' | 'cod';
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
  transactionId?: string;
  razorpayOrderId?: string;
  signature?: string;
  rawResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    provider: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true
    },
    transactionId: {
      type: String,
      index: true
    },
    razorpayOrderId: {
      type: String,
      index: true
    },
    signature: String,
    rawResponse: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

