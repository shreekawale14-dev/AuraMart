export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  isEmailVerified: boolean;
  avatarUrl?: string;
}

export interface IAddress {
  _id: string;
  user: string;
  fullName: string;
  phone: string;
  street: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
  createdAt?: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  productCount?: number;
}

export interface IVariant {
  name: string;
  options: string[];
}

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  brand: string;
  category: string | { _id: string; name: string; slug: string };
  categoryName: string;
  sku: string;
  stock: number;
  images: string[];
  ratingsAvg: number;
  ratingsCount: number;
  features: string[];
  variants: IVariant[];
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  specifications: Record<string, string>;
  createdAt?: string;
}

export interface ICartItem {
  _id: string;
  product: IProduct;
  variant?: Record<string, string>;
  quantity: number;
  priceAtAddition: number;
}

export interface ICartTotals {
  itemsTotal: number;
  itemsOriginalTotal: number;
  totalSavings: number;
  deliveryCharge: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  grandTotal: number;
  totalItemsCount: number;
}

export interface ICart extends ICartTotals {
  _id: string;
  items: ICartItem[];
}

export interface IOrderItem {
  product: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  variant?: Record<string, string>;
  subtotal: number;
}

export interface IStatusTimeline {
  status: string;
  timestamp: string;
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

export interface IOrder {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string; phone: string };
  items: IOrderItem[];
  deliveryAddressSnapshot: {
    fullName: string;
    phone: string;
    street: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
  };
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: string;
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
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  validUntil: string;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
}

export interface IReview {
  _id: string;
  product: string;
  user: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface IAuraProductRecommendation {
  _id: string;
  title: string;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  rating: number;
  image: string;
  category: string;
  stock: number;
}

export interface IAuraChatResponse {
  reply: string;
  products?: IAuraProductRecommendation[];
  suggestedQueries?: string[];
  isFallback: boolean;
}

