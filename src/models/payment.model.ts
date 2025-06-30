import mongoose, { Schema, Document } from 'mongoose';
import { IPaymentDocument, PaymentStatus } from '../types/payment.types';

// Schema สำหรับ Service Item
const serviceItemSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    required: [true, 'กรุณาระบุ ID ของบริการ']
  },
  serviceName: {
    type: String,
    required: [true, 'กรุณาระบุชื่อบริการ'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'กรุณาระบุจำนวน'],
    min: [1, 'จำนวนต้องมากกว่า 0']
  },
  unitPrice: {
    type: Number,
    required: [true, 'กรุณาระบุราคาต่อหน่วย'],
    min: [0, 'ราคาต้องไม่ติดลบ']
  },
  totalPrice: {
    type: Number,
    required: [true, 'กรุณาระบุราคารวม'],
    min: [0, 'ราคาต้องไม่ติดลบ']
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: false });

const paymentSchema = new Schema<IPaymentDocument>(
  {
    paymentNumber: {
      type: String,
      required: true,
      // unique: true,
      trim: true
    },
    patientName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อผู้ป่วย'],
      trim: true
    },
    patientPhone: {
      type: String,
      trim: true
    },
    patientEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก']
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'กรุณาระบุสาขา']
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    services: [serviceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'ยอดรวมต้องไม่ติดลบ']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'ส่วนลดต้องไม่ติดลบ']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'ภาษีต้องไม่ติดลบ']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'ยอดรวมสุดท้ายต้องไม่ติดลบ']
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'ยอดที่ชำระต้องไม่ติดลบ']
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'ยอดคงเหลือต้องไม่ติดลบ']
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    dueDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้สร้างบิล']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
paymentSchema.index({ paymentNumber: 1 }, { unique: true });
paymentSchema.index({ clinicId: 1 });
paymentSchema.index({ branchId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ patientName: 'text' });

// Pre-save middleware เพื่อสร้าง payment number
paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // นับจำนวน payment ในวันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const count = await mongoose.model('Payment').countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.paymentNumber = `PAY${year}${month}${day}${sequence}`;
  }
  next();
});

// Pre-save middleware เพื่อคำนวณยอด
paymentSchema.pre('save', function(next) {
  // คำนวณ subtotal จาก services
  this.subtotal = this.services.reduce((sum, service) => sum + service.totalPrice, 0);
  
  // คำนวณ total
  this.total = this.subtotal - this.discount + this.tax;
  
  // คำนวณ remainingAmount
  this.remainingAmount = this.total - this.paidAmount;
  
  // อัปเดตสถานะตาม remaining amount
  if (this.remainingAmount <= 0) {
    this.status = PaymentStatus.PAID;
  } else if (this.paidAmount > 0) {
    this.status = PaymentStatus.PARTIAL;
  } else {
    this.status = PaymentStatus.PENDING;
  }
  
  next();
});

const Payment = mongoose.model<IPaymentDocument>('Payment', paymentSchema);

export default Payment;