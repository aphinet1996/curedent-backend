import mongoose, { Schema, Document } from 'mongoose';
import { IDiagnosisDocument } from '../types/diagnosis.types';

const diagnosisSchema = new Schema<IDiagnosisDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อการวินิจฉัย'],
      trim: true,
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
diagnosisSchema.index({ name: 1, clinicId: 1 }, { unique: true });
diagnosisSchema.index({ clinicId: 1 });

// Create model
const Diagnosis = mongoose.model<IDiagnosisDocument>('Diagnosis', diagnosisSchema);

export default Diagnosis;