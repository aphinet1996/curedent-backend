import mongoose, { Schema } from 'mongoose';
import { IClinicDocument, ClinicStatus } from '../types/clinic.types';

const clinicSchema = new Schema<IClinicDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อคลินิก'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'กรุณาระบุอีเมลติดต่อ'],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'กรุณาระบุเบอร์โทรศัพท์ติดต่อ'],
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ClinicStatus),
      default: ClinicStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
clinicSchema.index({ name: 1 }, { unique: true });
clinicSchema.index({ status: 1 });

// Create model
const Clinic = mongoose.model<IClinicDocument>('Clinic', clinicSchema);

export default Clinic;