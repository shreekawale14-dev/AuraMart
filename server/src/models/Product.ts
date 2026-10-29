import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVariant {
  name: string; // e.g. "Size", "Color", "Storage"
  options: string[]; // e.g. ["128GB", "256GB"]
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  brand: string;
  category: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>(
  {
    name: { type: String, required: true },
    options: [{ type: String, required: true }]
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 95
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },
    categoryName: {
      type: String,
      required: true,
      index: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    images: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length > 0, 'At least one product image is required']
    },
    ratingsAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    features: [{ type: String }],
    variants: [VariantSchema],
    tags: [{ type: String, index: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    isBestseller: { type: Boolean, default: false, index: true },
    specifications: {
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Text search index for rich searching by title, brand, description, tags, categoryName
ProductSchema.index({
  title: 'text',
  brand: 'text',
  description: 'text',
  tags: 'text',
  categoryName: 'text'
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

