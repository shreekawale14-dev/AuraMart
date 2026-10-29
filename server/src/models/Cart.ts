import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  variant?: Record<string, string>;
  quantity: number;
  priceAtAddition: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: Map,
      of: String,
      default: {}
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    priceAtAddition: {
      type: Number,
      required: true
    }
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: [CartItemSchema]
  },
  {
    timestamps: true
  }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);

