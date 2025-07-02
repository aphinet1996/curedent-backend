import mongoose, { Schema, Model } from 'mongoose';
import { IStockTransferDocument, IStockTransferModel, TransferStatus } from '../types/stock.types';
import { compareObjectIds } from '../utils/mongoose.utils';

// Interface สำหรับ Model ที่รวม static methods
interface IStockTransferModelWithStatics extends Model<IStockTransferDocument>, IStockTransferModel {}

// Function สำหรับสร้างเลขที่การโอน
const generateTransferNumber = function(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6); // ใช้ 6 หลักสุดท้ายของ timestamp
  
  return `TRF${year}${month}${day}${time}`;
};

const stockTransferSchema = new Schema<IStockTransferDocument>(
  {
    transferNumber: {
      type: String,
      required: [true, 'กรุณาระบุเลขที่การโอน'],
      unique: true,
      default: generateTransferNumber
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'กรุณาระบุสินค้า']
    },
    fromBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'กรุณาระบุสาขาต้นทาง']
    },
    toBranchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'กรุณาระบุสาขาปลายทาง']
    },
    quantity: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวน'],
      min: [0.001, 'จำนวนต้องมากกว่า 0']
    },
    unit: {
      type: String,
      required: [true, 'กรุณาระบุหน่วย'],
      trim: true,
      uppercase: true
    },
    quantityInBaseUnit: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวนในหน่วยหลัก'],
      min: [0.001, 'จำนวนในหน่วยหลักต้องมากกว่า 0']
    },
    status: {
      type: String,
      enum: Object.values(TransferStatus),
      default: TransferStatus.PENDING
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้ขอโอน']
    },
    requestedAt: {
      type: Date,
      required: [true, 'กรุณาระบุเวลาที่ขอโอน'],
      default: Date.now
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      required: [true, 'กรุณาระบุเหตุผลการโอน'],
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
stockTransferSchema.index({ transferNumber: 1 }, { unique: true });
stockTransferSchema.index({ productId: 1, requestedAt: -1 });
stockTransferSchema.index({ fromBranchId: 1, requestedAt: -1 });
stockTransferSchema.index({ toBranchId: 1, requestedAt: -1 });
stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ requestedBy: 1 });
stockTransferSchema.index({ requestedAt: -1 });

// Compound indexes
stockTransferSchema.index({ fromBranchId: 1, toBranchId: 1, requestedAt: -1 });
stockTransferSchema.index({ productId: 1, status: 1, requestedAt: -1 });

// Virtual สำหรับข้อมูล Product
stockTransferSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูล From Branch
stockTransferSchema.virtual('fromBranch', {
  ref: 'Branch',
  localField: 'fromBranchId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูล To Branch
stockTransferSchema.virtual('toBranch', {
  ref: 'Branch',
  localField: 'toBranchId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลผู้ขอโอน
stockTransferSchema.virtual('requester', {
  ref: 'User',
  localField: 'requestedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลผู้อนุมัติ
stockTransferSchema.virtual('approver', {
  ref: 'User',
  localField: 'approvedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลผู้ส่ง
stockTransferSchema.virtual('sender', {
  ref: 'User',
  localField: 'sentBy',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลผู้รับ
stockTransferSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receivedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับคำนวณระยะเวลาการโอน
stockTransferSchema.virtual('transferDuration').get(function() {
  if (this.sentAt && this.receivedAt) {
    return Math.round((this.receivedAt.getTime() - this.sentAt.getTime()) / (1000 * 60 * 60)); // ชั่วโมง
  }
  return null;
});

// Virtual สำหรับคำนวณระยะเวลาตั้งแต่ขอจนถึงเสร็จสิ้น
stockTransferSchema.virtual('totalProcessTime').get(function() {
  if (this.requestedAt && this.receivedAt) {
    return Math.round((this.receivedAt.getTime() - this.requestedAt.getTime()) / (1000 * 60 * 60)); // ชั่วโมง
  }
  return null;
});

// Validation: ต้องไม่โอนให้สาขาเดียวกัน
stockTransferSchema.pre('save', function(next) {
  if (compareObjectIds(this.fromBranchId, this.toBranchId)) {
    next(new Error('ไม่สามารถโอนสินค้าภายในสาขาเดียวกันได้'));
  }
  next();
});

// Method เพื่ออนุมัติการโอน
stockTransferSchema.methods.approve = function(approvedBy: string, notes?: string) {
  if (this.status !== TransferStatus.PENDING) {
    throw new Error('สามารถอนุมัติได้เฉพาะการโอนที่มีสถานะรอการอนุมัติเท่านั้น');
  }
  
  this.status = TransferStatus.IN_TRANSIT;
  this.approvedBy = new mongoose.Types.ObjectId(approvedBy);
  this.approvedAt = new Date();
  
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n[อนุมัติ] ${notes}` : `[อนุมัติ] ${notes}`;
  }
  
  return this.save();
};

// Method เพื่อส่งสินค้า
stockTransferSchema.methods.send = function(sentBy: string, notes?: string) {
  if (this.status !== TransferStatus.IN_TRANSIT) {
    throw new Error('สามารถส่งสินค้าได้เฉพาะการโอนที่ได้รับการอนุมัติแล้วเท่านั้น');
  }
  
  this.sentBy = new mongoose.Types.ObjectId(sentBy);
  this.sentAt = new Date();
  
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n[ส่งสินค้า] ${notes}` : `[ส่งสินค้า] ${notes}`;
  }
  
  return this.save();
};

// Method เพื่อรับสินค้า
stockTransferSchema.methods.receive = function(receivedBy: string, notes?: string) {
  if (this.status !== TransferStatus.IN_TRANSIT) {
    throw new Error('สามารถรับสินค้าได้เฉพาะการโอนที่อยู่ระหว่างการส่งเท่านั้น');
  }
  
  if (!this.sentAt) {
    throw new Error('ต้องมีการส่งสินค้าก่อนจึงจะสามารถรับได้');
  }
  
  this.status = TransferStatus.COMPLETED;
  this.receivedBy = new mongoose.Types.ObjectId(receivedBy);
  this.receivedAt = new Date();
  
  if (notes) {
    this.notes = this.notes ? `${this.notes}\n[รับสินค้า] ${notes}` : `[รับสินค้า] ${notes}`;
  }
  
  return this.save();
};

// Method เพื่อยกเลิกการโอน
stockTransferSchema.methods.cancel = function(reason: string) {
  if (this.status === TransferStatus.COMPLETED) {
    throw new Error('ไม่สามารถยกเลิกการโอนที่เสร็จสิ้นแล้ว');
  }
  
  this.status = TransferStatus.CANCELLED;
  this.notes = this.notes ? `${this.notes}\n[ยกเลิก] ${reason}` : `[ยกเลิก] ${reason}`;
  
  return this.save();
};

// Method เพื่อตรวจสอบว่าสามารถแก้ไขได้หรือไม่
stockTransferSchema.methods.canEdit = function() {
  return this.status === TransferStatus.PENDING;
};

// Method เพื่อตรวจสอบว่าสามารถยกเลิกได้หรือไม่
stockTransferSchema.methods.canCancel = function() {
  return [TransferStatus.PENDING, TransferStatus.IN_TRANSIT].includes(this.status);
};

// Static method เพื่อดึงสถิติการโอน
stockTransferSchema.statics.getTransferStats = function(
  startDate?: Date,
  endDate?: Date,
  branchId?: string
) {
  const match: any = {};
  
  if (startDate && endDate) {
    match.requestedAt = { $gte: startDate, $lte: endDate };
  }
  
  if (branchId) {
    match.$or = [
      { fromBranchId: new mongoose.Types.ObjectId(branchId) },
      { toBranchId: new mongoose.Types.ObjectId(branchId) }
    ];
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantityInBaseUnit' }
      }
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: '$_id',
            count: '$count',
            totalQuantity: '$totalQuantity'
          }
        },
        totalTransfers: { $sum: '$count' },
        totalQuantityAll: { $sum: '$totalQuantity' }
      }
    }
  ]);
};

// Static method เพื่อหาการโอนที่ค้างอยู่นาน
stockTransferSchema.statics.findPendingTooLong = function(hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    status: { $in: [TransferStatus.PENDING, TransferStatus.IN_TRANSIT] },
    requestedAt: { $lt: cutoffDate }
  })
  .populate('productId', 'name sku')
  .populate('fromBranchId', 'name')
  .populate('toBranchId', 'name')
  .populate('requestedBy', 'name surname')
  .sort({ requestedAt: 1 });
};

// Static method เพื่อหาการโอนที่เสร็จสิ้นล่าช้า
stockTransferSchema.statics.findCompletedLate = function(expectedHours = 48) {
  return this.find({
    status: TransferStatus.COMPLETED,
    sentAt: { $exists: true },
    receivedAt: { $exists: true },
    $expr: {
      $gt: [
        { $subtract: ['$receivedAt', '$sentAt'] },
        expectedHours * 60 * 60 * 1000
      ]
    }
  })
  .populate('productId', 'name sku')
  .populate('fromBranchId', 'name')
  .populate('toBranchId', 'name')
  .sort({ receivedAt: -1 });
};

// Static method เพื่อดึงยอดรวมการโอนแต่ละเดือน
stockTransferSchema.statics.getMonthlyTransfers = function(
  year: number,
  branchId?: string
) {
  const match: any = {
    requestedAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  };
  
  if (branchId) {
    match.$or = [
      { fromBranchId: new mongoose.Types.ObjectId(branchId) },
      { toBranchId: new mongoose.Types.ObjectId(branchId) }
    ];
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$requestedAt' },
          status: '$status'
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantityInBaseUnit' }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        transfers: {
          $push: {
            status: '$_id.status',
            count: '$count',
            totalQuantity: '$totalQuantity'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

const StockTransfer = mongoose.model<IStockTransferDocument, IStockTransferModelWithStatics>('StockTransfer', stockTransferSchema);

export default StockTransfer;