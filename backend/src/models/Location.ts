import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILocation extends Document {
  driver: Types.ObjectId;
  delivery?: Types.ObjectId;
  coordinates: [number, number];
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    driver: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
    delivery: { type: Schema.Types.ObjectId, ref: 'Delivery' },
    coordinates: { type: [Number], required: true },
    heading: Number,
    speed: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ driver: 1, timestamp: -1 });

// TTL index - auto-delete location history after 30 days
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Location = mongoose.model<ILocation>('Location', locationSchema);
