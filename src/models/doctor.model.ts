import mongoose, { Schema } from 'mongoose';
import { IDoctorDocument, Gender, DayOfWeek } from '../types/doctor.types';

// Schema สำหรับ timetable
const timetableSchema = new Schema({
  day: {
    type: String,
    enum: Object.values(DayOfWeek), // เปลี่ยนจาก Date เป็น enum ของวันในสัปดาห์
    required: [true, 'กรุณาระบุวันในสัปดาห์']
  },
  time: [{
    type: String,
    required: [true, 'กรุณาระบุเวลา']
  }]
}, { _id: false });

// Schema สำหรับ branch ที่หมอปฏิบัติงาน
const doctorBranchSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'กรุณาระบุสาขา']
  },
  timetable: [timetableSchema]
}, { _id: false });

const doctorSchema = new Schema<IDoctorDocument>(
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
    specialty: {
      type: String,
      required: [true, 'กรุณาระบุความเชี่ยวชาญ'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'กรุณาระบุสีของหมอ'],
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'สีต้องอยู่ในรูปแบบ hex color (เช่น #FF0000 หรือ #F00)'],
      default: '#3B82F6' // สีน้ำเงิน default
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก'],
    },
    branches: [doctorBranchSchema],
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
doctorSchema.index({ clinicId: 1 });
doctorSchema.index({ 'branches.branchId': 1 });
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ color: 1 }); // เพิ่ม index สำหรับสี

// Compound index สำหรับการค้นหาสีแบบ unique ภายในคลินิก (ถ้าต้องการให้สีไม่ซ้ำกันในคลินิกเดียวกัน)
// doctorSchema.index({ clinicId: 1, color: 1 }, { unique: true });

// Virtual fields
doctorSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.surname}`;
});

doctorSchema.virtual('age').get(function () {
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

// Pre-save middleware เพื่อตรวจสอบความซ้ำของสีในคลินิกเดียวกัน (ถ้าต้องการ)
doctorSchema.pre('save', async function(next) {
  // ถ้าต้องการให้สีไม่ซ้ำกันในคลินิกเดียวกัน สามารถเปิด comment นี้ได้
  /*
  if (this.isModified('color') || this.isModified('clinicId')) {
    const existingDoctor = await this.constructor.findOne({
      clinicId: this.clinicId,
      color: this.color,
      _id: { $ne: this._id }
    });
    
    if (existingDoctor) {
      const error = new Error('สีนี้ถูกใช้โดยหมอคนอื่นในคลินิกเดียวกันแล้ว');
      return next(error);
    }
  }
  */
  next();
});

// Create model
const Doctor = mongoose.model<IDoctorDocument>('Doctor', doctorSchema);

export default Doctor;