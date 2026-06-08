import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  activeDrivers: number;
  newCustomers: number;
  metrics: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    hourlyDistribution: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    date: { type: Date, required: true, unique: true, index: true },
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    cancelledDeliveries: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 },
    activeDrivers: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    metrics: {
      byStatus: { type: Map, of: Number, default: {} },
      byPriority: { type: Map, of: Number, default: {} },
      hourlyDistribution: { type: [Number], default: Array(24).fill(0) },
    },
  },
  { timestamps: true }
);

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
