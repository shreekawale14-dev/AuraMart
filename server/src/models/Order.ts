import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  variant?: Record<string, string>;
  subtotal: number;
}

export interface IAddressSnapshot {
  fullName: string;
  phone: string;
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
}

export interface IStatusTimeline {
  status: string;
  timestamp: Date;
  note: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Returned'
  | 'Refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  deliveryAddressSnapshot: IAddressSnapshot;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
  };
  orderStatus: OrderStatus;
  statusTimeline: IStatusTimeline[];
  pricing: {
    itemsTotal: number;
    discount: number;
    deliveryCharge: number;
    grandTotal: number;
  };
  couponApplied?: {
    code: string;
    discountAmount: number;
  };
  cancellationReason?: string;
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    variant: { type: Map, of: String, default: {} },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const AddressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    addressType: { type: String, default: 'Home' }
  },
  { _id: false }
);

const StatusTimelineSchema = new Schema<IStatusTimeline>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [OrderItemSchema],
    deliveryAddressSnapshot: {
      type: AddressSnapshotSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Return Requested',
        'Returned',
        'Refunded'
      ],
      default: 'Pending',
      index: true
    },
    statusTimeline: [StatusTimelineSchema],
    pricing: {
      itemsTotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true }
    },
    couponApplied: {
      code: String,
      discountAmount: Number
    },
    cancellationReason: { type: String },
    estimatedDeliveryDate: { type: Date }
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

