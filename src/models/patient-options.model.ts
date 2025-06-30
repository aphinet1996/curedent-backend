import mongoose, { Schema } from 'mongoose';
import { IPatientOptionsDocument, IMultilingualOption } from '../types/patient.types';

// Schema สำหรับตัวเลือกหลายภาษา
const multilingualOptionSchema = new Schema<IMultilingualOption>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุข้อมูลภาษาไทย'],
        trim: true,
        maxlength: [100, 'ข้อมูลภาษาไทยต้องไม่เกิน 100 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [100, 'ข้อมูลภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับ Patient Options
const patientOptionsSchema = new Schema<IPatientOptionsDocument>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: function(this: IPatientOptionsDocument) {
        return !this.isDefault;
      },
      validate: {
        validator: function(this: IPatientOptionsDocument, v: any) {
          // ถ้าเป็น default options ไม่ต้องมี clinicId
          if (this.isDefault) return true;
          // ถ้าไม่ใช่ default ต้องมี clinicId
          return v != null;
        },
        message: 'Default options ไม่ต้องระบุคลินิก, คลินิกเฉพาะต้องระบุคลินิก'
      }
    },
    category: {
      type: String,
      required: [true, 'กรุณาระบุประเภทของตัวเลือก'],
      enum: {
        values: ['nationality', 'titlePrefix', 'gender', 'patientType', 'bloodGroup', 'occupation', 'medicalRight', 'maritalStatus', 'referralSource'],
        message: 'ประเภทของตัวเลือกไม่ถูกต้อง'
      }
    },
    values: {
        type: [multilingualOptionSchema],
        required: [true, 'กรุณาระบุค่าตัวเลือก'],
        validate: {
            validator: function(v: IMultilingualOption[]) {
                return v && v.length > 0;
            },
            message: 'ต้องมีค่าตัวเลือกอย่างน้อย 1 รายการ'
        }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false // ข้อมูลเริ่มต้นของระบบ
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Index สำหรับ clinic-specific options (ไม่รวม default options)
patientOptionsSchema.index(
  { clinicId: 1, category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isDefault: false } // ใช้เฉพาะ non-default options
  }
);

// Index สำหรับ default options
patientOptionsSchema.index(
  { category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isDefault: true } // ใช้เฉพาะ default options
  }
);

// Additional indexes สำหรับ performance
patientOptionsSchema.index({ category: 1, isActive: 1 });
patientOptionsSchema.index({ isActive: 1 });
patientOptionsSchema.index({ isDefault: 1 });

// Compound index สำหรับ query ที่ใช้บ่อย
patientOptionsSchema.index({ 
  category: 1, 
  isDefault: 1, 
  isActive: 1 
});

// Index สำหรับ clinic-specific queries
patientOptionsSchema.index({ 
  clinicId: 1, 
  category: 1, 
  isActive: 1 
}, { 
  partialFilterExpression: { 
    isDefault: false 
  } 
});

// Text search index สำหรับค้นหาในภาษาต่างๆ
patientOptionsSchema.index({
  'values.th': 'text',
  'values.en': 'text'
});

// Static method สำหรับดึงตัวเลือกทั้งหมดของคลินิก
patientOptionsSchema.statics.getOptionsByClinic = function(clinicId: string) {
  return this.find({ 
    $or: [
      { clinicId, isActive: true },
      { isDefault: true, isActive: true } // รวมข้อมูลเริ่มต้นของระบบ
    ]
  }).sort({ category: 1 });
};

// Static method สำหรับดึงตัวเลือกตามประเภท
patientOptionsSchema.statics.getOptionsByCategory = function(clinicId: string, category: string) {
  return this.find({ 
    $or: [
      { clinicId, category, isActive: true },
      { isDefault: true, category, isActive: true }
    ]
  }).sort({ isDefault: 1 }); // ข้อมูลของคลินิกจะมาก่อนข้อมูลเริ่มต้น
};

// Pre-save middleware เพื่อ validate logic
patientOptionsSchema.pre('save', function(next) {
  // ตรวจสอบว่า default options ไม่มี clinicId
  if (this.isDefault && this.clinicId) {
    return next(new Error('Default options ต้องไม่มี clinicId'));
  }
  
  // ตรวจสอบว่า non-default options ต้องมี clinicId
  if (!this.isDefault && !this.clinicId) {
    return next(new Error('คลินิกเฉพาะต้องระบุ clinicId'));
  }
  
  // ตรวจสอบว่า values ไม่ซ้ำกัน (เฉพาะภาษาไทย)
  const thValues = this.values.map(v => v.th.toLowerCase().trim());
  const uniqueThValues = [...new Set(thValues)];
  if (thValues.length !== uniqueThValues.length) {
    return next(new Error('ค่าตัวเลือกภาษาไทยต้องไม่ซ้ำกัน'));
  }
  
  next();
});

// Post-save middleware
patientOptionsSchema.post('save', function(doc) {
  console.log(`Patient option ${doc.category} (${doc.isDefault ? 'default' : 'clinic'}) saved successfully`);
});

export const PatientOptions = mongoose.model<IPatientOptionsDocument>('PatientOptions', patientOptionsSchema);

export default PatientOptions;