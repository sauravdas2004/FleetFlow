import mongoose, { Document, Schema } from 'mongoose';
import { VehicleStatus } from '../types/enums';

export interface IVehicle extends Document {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  capacity: number;
  status: VehicleStatus;
  color?: string;
  fuelType?: string;
  mileage?: number;
  lastMaintenance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    type: { type: String, required: true, enum: ['van', 'truck', 'bike', 'car', 'scooter'] },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.AVAILABLE,
      index: true,
    },
    color: String,
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
    mileage: Number,
    lastMaintenance: Date,
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
