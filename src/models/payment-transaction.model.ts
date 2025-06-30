import mongoose, { Schema, Document } from 'mongoose';
import { IPaymentTransactionDocument, PaymentMethod } from '../types/payment.types';

const paymentTransactionSchema = new Schema<IPaymentTransactionDocument>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'กรุณาระบุการชำระเงิน']
    },
    transactionNumber: {
      type: String,
      required: true,
      // unique: true,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวนเงิน'],
      min: [0.01, 'จำนวนเงินต้องมากกว่า 0']
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: [true, 'กรุณาระบุวิธีการชำระเงิน']
    },
    referenceNumber: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้ดำเนินการ']
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
paymentTransactionSchema.index({ transactionNumber: 1 }, { unique: true });
paymentTransactionSchema.index({ paymentId: 1 });
paymentTransactionSchema.index({ processedAt: -1 });
paymentTransactionSchema.index({ method: 1 });

// Pre-save middleware เพื่อสร้าง transaction number
paymentTransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // นับจำนวน transaction ในวันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const count = await mongoose.model('PaymentTransaction').countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.transactionNumber = `TXN${year}${month}${day}${sequence}`;
  }
  next();
});

const PaymentTransaction = mongoose.model<IPaymentTransactionDocument>('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;