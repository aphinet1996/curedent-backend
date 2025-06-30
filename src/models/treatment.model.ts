import mongoose, { Schema } from 'mongoose';
import { ITreatmentDocument, ITreatmentModel, FeeType } from '../types/treatment.types';

// Schema สำหรับ Fee
const feeSchema = new Schema({
  amount: {
    type: Number,
    required: [true, 'กรุณาระบุจำนวนเงิน'],
    min: [0, 'จำนวนเงินต้องไม่น้อยกว่า 0']
  },
  type: {
    type: String,
    enum: Object.values(FeeType),
    required: [true, 'กรุณาระบุประเภทค่าธรรมเนียม']
  }
}, { _id: false });

// Custom validator สำหรับ percentage
feeSchema.path('amount').validate(function(value) {
  if (this.type === FeeType.PERCENTAGE && value > 100) {
    return false;
  }
  return true;
}, 'เปอร์เซ็นต์ต้องไม่เกิน 100');

const treatmentSchema = new Schema<ITreatmentDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อการรักษา'],
      trim: true,
      maxlength: [200, 'ชื่อการรักษาต้องไม่เกิน 200 ตัวอักษร']
    },
    price: {
      type: Number,
      required: [true, 'กรุณาระบุราคา'],
      min: [0, 'ราคาต้องไม่น้อยกว่า 0']
    },
    includeVat: {
      type: Boolean,
      default: false
    },
    doctorFee: {
      type: feeSchema,
      required: false
    },
    assistantFee: {
      type: feeSchema,
      required: false
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
treatmentSchema.index({ name: 1, clinicId: 1 }, { unique: true });
treatmentSchema.index({ clinicId: 1 });
treatmentSchema.index({ price: 1 });

// Instance Methods

/**
 * คำนวณค่าธรรมเนียมหมอ
 */
treatmentSchema.methods.calculateDoctorFee = function(): number {
  if (!this.doctorFee) return 0;
  
  if (this.doctorFee.type === FeeType.PERCENTAGE) {
    const basePrice = this.includeVat ? this.calculatePriceExcludingVat() : this.price;
    return Math.round((basePrice * this.doctorFee.amount / 100) * 100) / 100;
  } else {
    return this.doctorFee.amount;
  }
};

/**
 * คำนวณค่าธรรมเนียมผู้ช่วย
 */
treatmentSchema.methods.calculateAssistantFee = function(): number {
  if (!this.assistantFee) return 0;
  
  if (this.assistantFee.type === FeeType.PERCENTAGE) {
    const basePrice = this.includeVat ? this.calculatePriceExcludingVat() : this.price;
    return Math.round((basePrice * this.assistantFee.amount / 100) * 100) / 100;
  } else {
    return this.assistantFee.amount;
  }
};

/**
 * คำนวณจำนวน VAT (7%)
 */
treatmentSchema.methods.calculateVatAmount = function(): number {
  if (!this.includeVat) return 0;
  
  // ถ้าราคารวม VAT แล้ว ให้คำนวณ VAT ย้อนกลับ
  // VAT = ราคารวม VAT × 7/107
  return Math.round((this.price * 7 / 107) * 100) / 100;
};

/**
 * คำนวณราคาไม่รวม VAT
 */
treatmentSchema.methods.calculatePriceExcludingVat = function(): number {
  if (!this.includeVat) return this.price;
  
  // ถ้าราคารวม VAT แล้ว ให้คำนวณราคาไม่รวม VAT
  // ราคาไม่รวม VAT = ราคารวม VAT × 100/107
  return Math.round((this.price * 100 / 107) * 100) / 100;
};

/**
 * คำนวณราคารวมทั้งหมด (รวม fees)
 */
treatmentSchema.methods.calculateTotalPrice = function(): number {
  const doctorFee = this.calculateDoctorFee();
  const assistantFee = this.calculateAssistantFee();
  
  return Math.round((this.price) * 100) / 100;
};

// Virtual fields

/**
 * Virtual สำหรับดูข้อมูลการคำนวณทั้งหมด
 */
treatmentSchema.virtual('calculations').get(function () {
  return {
    doctorFeeAmount: this.calculateDoctorFee(),
    assistantFeeAmount: this.calculateAssistantFee(),
    vatAmount: this.calculateVatAmount(),
    priceExcludingVat: this.calculatePriceExcludingVat(),
    totalPrice: this.calculateTotalPrice()
  };
});

// Static Methods สำหรับ query ทั่วไป

/**
 * หาการรักษาตาม clinic
 */
treatmentSchema.statics.findByClinic = function(clinicId: string) {
  return this.find({ clinicId })
    .populate('clinicId', 'name')
    .sort({ name: 1 });
};

// Pre-save middleware
treatmentSchema.pre('save', function (next) {
  // Round ราคาให้เป็นทศนิยม 2 ตำแหน่ง
  if (this.isModified('price')) {
    this.price = Math.round(this.price * 100) / 100;
  }
  
  // Round fee amounts
  if (this.doctorFee && this.isModified('doctorFee.amount')) {
    this.doctorFee.amount = Math.round(this.doctorFee.amount * 100) / 100;
  }
  
  if (this.assistantFee && this.isModified('assistantFee.amount')) {
    this.assistantFee.amount = Math.round(this.assistantFee.amount * 100) / 100;
  }
  
  next();
});

// Create model
const Treatment = mongoose.model<ITreatmentDocument, ITreatmentModel>('Treatment', treatmentSchema);

export default Treatment;