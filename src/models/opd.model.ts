import mongoose, { Schema, Document } from 'mongoose';
import {
  IOpdDocument,
  OpdSide,
  ToothSurface,
  ToothCondition,
  TreatmentType
} from '../types/opd.types';

// Schema สำหรับข้อมูลฟัน
const toothDataSchema = new Schema({
  toothNumber: {
    type: String,
    required: [true, 'กรุณาระบุหมายเลขซี่ฟัน'],
    validate: {
      validator: function(v: string) {
        const validNumbers = [
          '11', '12', '13', '14', '15', '16', '17', '18',
          '21', '22', '23', '24', '25', '26', '27', '28',
          '31', '32', '33', '34', '35', '36', '37', '38',
          '41', '42', '43', '44', '45', '46', '47', '48'
        ];
        return validNumbers.includes(v);
      },
      message: 'หมายเลขซี่ฟันไม่ถูกต้อง (ใช้ระบบ FDI: 11-48)'
    }
  },
  surfaces: [{
    type: String,
    enum: Object.values(ToothSurface),
    required: true
  }],
  condition: {
    type: String,
    enum: Object.values(ToothCondition),
    required: [true, 'กรุณาระบุสภาพฟัน'],
    default: ToothCondition.HEALTHY
  },
  treatment: {
    type: String,
    enum: Object.values(TreatmentType),
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร']
  }
}, { _id: false });

// Schema สำหรับการวินิจฉัย
const diagnosisSchema = new Schema({
  code: {
    type: String,
    trim: true,
    maxlength: [20, 'รหัสการวินิจฉัยต้องไม่เกิน 20 ตัวอักษร']
  },
  name: {
    type: String,
    required: [true, 'กรุณาระบุชื่อการวินิจฉัย'],
    trim: true,
    maxlength: [200, 'ชื่อการวินิจฉัยต้องไม่เกิน 200 ตัวอักษร']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'รายละเอียดการวินิจฉัยต้องไม่เกิน 1000 ตัวอักษร']
  }
}, { _id: false });

// Schema สำหรับการรักษา
const treatmentSchema = new Schema({
  code: {
    type: String,
    trim: true,
    maxlength: [20, 'รหัสการรักษาต้องไม่เกิน 20 ตัวอักษร']
  },
  name: {
    type: String,
    required: [true, 'กรุณาระบุชื่อการรักษา'],
    trim: true,
    maxlength: [200, 'ชื่อการรักษาต้องไม่เกิน 200 ตัวอักษร']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'รายละเอียดการรักษาต้องไม่เกิน 1000 ตัวอักษร']
  },
  cost: {
    type: Number,
    min: [0, 'ค่าใช้จ่ายต้องไม่น้อยกว่า 0'],
    validate: {
      validator: function(v: number) {
        return v >= 0;
      },
      message: 'ค่าใช้จ่ายต้องเป็นจำนวนบวก'
    }
  }
}, { _id: false });

const opdSchema = new Schema<IOpdDocument>(
  {
    title: {
      type: String,
      required: [true, 'กรุณาระบุหัวข้อ/วันที่'],
      trim: true,
      maxlength: [100, 'หัวข้อต้องไม่เกิน 100 ตัวอักษร']
    },
    date: {
      type: Date,
      required: [true, 'กรุณาระบุวันที่'],
      validate: {
        validator: function(v: Date) {
          return v <= new Date();
        },
        message: 'วันที่ต้องไม่เกินวันปัจจุบัน'
      }
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'กรุณาระบุผู้ป่วย']
    },
    dentistId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'กรุณาระบุทันตแพทย์']
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก']
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch'
    },
    chiefComplaint: {
      type: String,
      required: [true, 'กรุณาระบุข้อร้องเรียนหลัก'],
      trim: true,
      maxlength: [2000, 'ข้อร้องเรียนหลักต้องไม่เกิน 2000 ตัวอักษร']
    },
    side: {
      type: String,
      enum: Object.values(OpdSide),
      required: [true, 'กรุณาระบุด้าน']
    },
    teeth: [toothDataSchema],
    io: {
      type: String,
      required: [true, 'กรุณาระบุผลการตรวจ I/O'],
      trim: true,
      maxlength: [5000, 'ผลการตรวจ I/O ต้องไม่เกิน 5000 ตัวอักษร']
    },
    diagnosis: {
      type: [diagnosisSchema],
      validate: {
        validator: function(v: any[]) {
          return v && v.length > 0;
        },
        message: 'กรุณาระบุการวินิจฉัยอย่างน้อย 1 รายการ'
      }
    },
    treatment: {
      type: [treatmentSchema],
      validate: {
        validator: function(v: any[]) {
          return v && v.length > 0;
        },
        message: 'กรุณาระบุการรักษาอย่างน้อย 1 รายการ'
      }
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [2000, 'หมายเหตุต้องไม่เกิน 2000 ตัวอักษร']
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
opdSchema.index({ patientId: 1, date: -1 });
opdSchema.index({ dentistId: 1, date: -1 });
opdSchema.index({ clinicId: 1, date: -1 });
opdSchema.index({ branchId: 1, date: -1 });
opdSchema.index({ status: 1 });
opdSchema.index({ date: -1 });
opdSchema.index({ 'teeth.toothNumber': 1 });

// Compound indexes
opdSchema.index({ clinicId: 1, patientId: 1, date: -1 });
opdSchema.index({ dentistId: 1, status: 1, date: -1 });

// Virtual fields
opdSchema.virtual('totalCost').get(function () {
  if (!this.treatment || this.treatment.length === 0) return 0;
  
  return this.treatment.reduce((total, treatment) => {
    return total + (treatment.cost || 0);
  }, 0);
});

opdSchema.virtual('teethCount').get(function () {
  return this.teeth ? this.teeth.length : 0;
});

opdSchema.virtual('affectedTeethNumbers').get(function () {
  if (!this.teeth || this.teeth.length === 0) return [];
  
  return this.teeth.map(tooth => tooth.toothNumber);
});

// Pre-save middleware
opdSchema.pre('save', function(next) {
  // Auto-generate title from date if not provided
  if (!this.title && this.date) {
    const date = new Date(this.date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    this.title = `${day}/${month}/${year}`;
  }
  
  next();
});

// Pre-validate middleware
opdSchema.pre('validate', function(next) {
  // ตรวจสอบว่าไม่มีซี่ฟันซ้ำกัน
  if (this.teeth && this.teeth.length > 0) {
    const toothNumbers = this.teeth.map(tooth => tooth.toothNumber);
    const uniqueToothNumbers = [...new Set(toothNumbers)];
    
    if (toothNumbers.length !== uniqueToothNumbers.length) {
      this.invalidate('teeth', 'ไม่สามารถมีซี่ฟันซ้ำกันได้');
    }
  }
  
  next();
});

// Static methods
opdSchema.statics.findByPatient = function(patientId: string, options: any = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  const filter: any = { patientId };
  if (status) filter.status = status;
  
  return this.find(filter)
    .populate('dentistId', 'name surname specialty color')
    .populate('clinicId', 'name')
    .populate('branchId', 'name')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

opdSchema.statics.findByDentist = function(dentistId: string, options: any = {}) {
  const { page = 1, limit = 10, status, startDate, endDate } = options;
  const skip = (page - 1) * limit;
  
  const filter: any = { dentistId };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  return this.find(filter)
    .populate('patientId', 'name surname dateOfBirth gender')
    .populate('clinicId', 'name')
    .populate('branchId', 'name')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

opdSchema.statics.findByTooth = function(toothNumber: string, options: any = {}) {
  const { clinicId, patientId } = options;
  
  const filter: any = { 'teeth.toothNumber': toothNumber };
  if (clinicId) filter.clinicId = clinicId;
  if (patientId) filter.patientId = patientId;
  
  return this.find(filter)
    .populate('patientId', 'name surname')
    .populate('dentistId', 'name surname')
    .sort({ date: -1 });
};

// Instance methods
opdSchema.methods.getTeethByCondition = function(condition: ToothCondition) {
  return this.teeth.filter((tooth: any) => tooth.condition === condition);
};

opdSchema.methods.getTeethByTreatment = function(treatment: TreatmentType) {
  return this.teeth.filter((tooth: any) => tooth.treatment === treatment);
};

opdSchema.methods.addTooth = function(toothData: any) {
  // ตรวจสอบว่าซี่ฟันนี้มีอยู่แล้วหรือไม่
  const existingTooth = this.teeth.find((tooth: any) => tooth.toothNumber === toothData.toothNumber);
  
  if (existingTooth) {
    throw new Error(`ซี่ฟัน ${toothData.toothNumber} มีอยู่ในรายการแล้ว`);
  }
  
  this.teeth.push(toothData);
  return this.save();
};

opdSchema.methods.removeTooth = function(toothNumber: string) {
  this.teeth = this.teeth.filter((tooth: any) => tooth.toothNumber !== toothNumber);
  return this.save();
};

opdSchema.methods.updateToothCondition = function(toothNumber: string, condition: ToothCondition, treatment?: TreatmentType) {
  const tooth = this.teeth.find((tooth: any) => tooth.toothNumber === toothNumber);
  
  if (!tooth) {
    throw new Error(`ไม่พบซี่ฟัน ${toothNumber} ในรายการ`);
  }
  
  tooth.condition = condition;
  if (treatment) tooth.treatment = treatment;
  
  return this.save();
};

// Create model
const Opd = mongoose.model<IOpdDocument>('Opd', opdSchema);

export default Opd;