import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage {
  sender: 'user' | 'aura';
  text: string;
  products?: Types.ObjectId[];
  timestamp: Date;
}

export interface IChatConversation extends Document {
  user?: Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sender: {
      type: String,
      enum: ['user', 'aura'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    messages: [ChatMessageSchema]
  },
  {
    timestamps: true
  }
);

export const ChatConversation = mongoose.model<IChatConversation>(
  'ChatConversation',
  ChatConversationSchema
);

