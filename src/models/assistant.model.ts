import mongoose, { Schema } from 'mongoose';
import { IAssistantDocument, Gender, DayOfWeek, EmploymentType } from '../types/assistant.types';

// Schema สำหรับ timetable
const timetableSchema = new Schema({
  day: {
    type: String,
    enum: Object.values(DayOfWeek),
    required: [true, 'กรุณาระบุวันในสัปดาห์']
  },
  time: [{
    type: String,
    required: [true, 'กรุณาระบุเวลา']
  }]
}, { _id: false });

// Schema สำหรับ branch ที่ assistant ปฏิบัติงาน
const assistantBranchSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'กรุณาระบุสาขา']
  },
  timetable: [timetableSchema]
}, { _id: false });

const assistantSchema = new Schema<IAssistantDocument>(
  {
    photo: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อ'],
      trim: true,
    },
    surname: {
      type: String,
      required: [true, 'กรุณาระบุนามสกุล'],
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: [true, 'กรุณาระบุเพศ'],
    },
    nationality: {
      type: String,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: [true, 'กรุณาระบุประเภทการจ้างงาน'],
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก'],
    },
    branches: [assistantBranchSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
assistantSchema.index({ clinicId: 1 });
assistantSchema.index({ 'branches.branchId': 1 });
assistantSchema.index({ employmentType: 1 });
assistantSchema.index({ isActive: 1 });

// Virtual fields
assistantSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.surname}`;
});

assistantSchema.virtual('age').get(function () {
  if (!this.birthday) return undefined;
  const today = new Date();
  const birthDate = new Date(this.birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Create model
const Assistant = mongoose.model<IAssistantDocument>('Assistant', assistantSchema);

export default Assistant;