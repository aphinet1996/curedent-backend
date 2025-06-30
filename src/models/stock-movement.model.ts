import mongoose, { Schema, Model } from 'mongoose';
import { IStockMovementDocument, IStockMovementModel, StockMovementType } from '../types/stock.types';

// Interface สำหรับ Model ที่รวม static methods
interface IStockMovementModelWithStatics extends Model<IStockMovementDocument>, IStockMovementModel {}

const stockMovementSchema = new Schema<IStockMovementDocument>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'กรุณาระบุสินค้า']
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'กรุณาระบุสาขา']
    },
    movementType: {
      type: String,
      enum: Object.values(StockMovementType),
      required: [true, 'กรุณาระบุประเภทการเคลื่อนไหว']
    },
    quantity: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวน']
    },
    unit: {
      type: String,
      required: [true, 'กรุณาระบุหน่วย'],
      trim: true,
      uppercase: true
    },
    quantityInBaseUnit: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวนในหน่วยหลัก']
    },
    balanceBefore: {
      type: Number,
      required: [true, 'กรุณาระบุยอดก่อนหน้า'],
      min: [0, 'ยอดก่อนหน้าต้องไม่ติดลบ']
    },
    balanceAfter: {
      type: Number,
      required: [true, 'กรุณาระบุยอดหลังการเคลื่อนไหว'],
      min: [0, 'ยอดหลังการเคลื่อนไหวต้องไม่ติดลบ']
    },
    referenceType: {
      type: String,
      trim: true
    },
    referenceId: {
      type: String,
      trim: true
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: 'StockTransfer'
    },
    reason: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      min: [0, 'ต้นทุนต้องไม่ติดลบ']
    },
    totalCost: {
      type: Number,
      min: [0, 'ต้นทุนรวมต้องไม่ติดลบ']
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้ดำเนินการ']
    },
    performedAt: {
      type: Date,
      required: [true, 'กรุณาระบุเวลาที่ดำเนินการ'],
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
stockMovementSchema.index({ productId: 1, performedAt: -1 });
stockMovementSchema.index({ branchId: 1, performedAt: -1 });
stockMovementSchema.index({ movementType: 1 });
stockMovementSchema.index({ referenceType: 1, referenceId: 1 });
stockMovementSchema.index({ transferId: 1 });
stockMovementSchema.index({ performedBy: 1 });
stockMovementSchema.index({ performedAt: -1 });

// Compound indexes
stockMovementSchema.index({ productId: 1, branchId: 1, performedAt: -1 });
stockMovementSchema.index({ productId: 1, movementType: 1, performedAt: -1 });

// Virtual สำหรับข้อมูล Product
stockMovementSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูล Branch
stockMovementSchema.virtual('branch', {
  ref: 'Branch',
  localField: 'branchId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลผู้ดำเนินการ
stockMovementSchema.virtual('performer', {
  ref: 'User',
  localField: 'performedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูลการโอน
stockMovementSchema.virtual('transfer', {
  ref: 'StockTransfer',
  localField: 'transferId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware เพื่อคำนวณ totalCost
stockMovementSchema.pre('save', function(next) {
  if (this.cost && this.quantityInBaseUnit) {
    this.totalCost = this.cost * Math.abs(this.quantityInBaseUnit);
  }
  next();
});

// Method เพื่อตรวจสอบว่าเป็นการเพิ่ม stock หรือไม่
stockMovementSchema.methods.isStockIncrease = function() {
  return [
    StockMovementType.IN,
    StockMovementType.PURCHASE,
    StockMovementType.RETURN,
    StockMovementType.TRANSFER_IN
  ].includes(this.movementType) || 
  (this.movementType === StockMovementType.ADJUSTMENT && this.quantityInBaseUnit > 0);
};

// Method เพื่อตรวจสอบว่าเป็นการลด stock หรือไม่
stockMovementSchema.methods.isStockDecrease = function() {
  return [
    StockMovementType.OUT,
    StockMovementType.SALE,
    StockMovementType.DAMAGED,
    StockMovementType.EXPIRED,
    StockMovementType.TRANSFER_OUT
  ].includes(this.movementType) || 
  (this.movementType === StockMovementType.ADJUSTMENT && this.quantityInBaseUnit < 0);
};

// Static method เพื่อดึงสถิติการเคลื่อนไหว
stockMovementSchema.statics.getMovementStats = function(
  productId: string,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = { productId: new mongoose.Types.ObjectId(productId) };
  
  if (startDate && endDate) {
    match.performedAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$movementType',
        totalQuantity: { $sum: '$quantityInBaseUnit' },
        count: { $sum: 1 },
        totalCost: { $sum: { $ifNull: ['$totalCost', 0] } }
      }
    },
    {
      $group: {
        _id: null,
        movements: {
          $push: {
            movementType: '$_id',
            totalQuantity: '$totalQuantity',
            count: '$count',
            totalCost: '$totalCost'
          }
        },
        totalMovements: { $sum: '$count' },
        totalCostAll: { $sum: '$totalCost' }
      }
    }
  ]);
};

// Static method เพื่อดึงการเคลื่อนไหวตามช่วงเวลา
stockMovementSchema.statics.getMovementsByPeriod = function(
  branchId?: string,
  startDate?: Date,
  endDate?: Date,
  movementTypes?: StockMovementType[]
) {
  const match: any = {};
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  if (startDate && endDate) {
    match.performedAt = { $gte: startDate, $lte: endDate };
  }
  
  if (movementTypes && movementTypes.length > 0) {
    match.movementType = { $in: movementTypes };
  }
  
  return this.find(match)
    .populate('productId', 'name sku units')
    .populate('branchId', 'name')
    .populate('performedBy', 'name surname')
    .sort({ performedAt: -1 });
};

// Static method เพื่อดึงยอดรวมการเคลื่อนไหวแต่ละเดือน
stockMovementSchema.statics.getMonthlyMovements = function(
  year: number,
  branchId?: string
) {
  const match: any = {
    performedAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  };
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          month: { $month: '$performedAt' },
          movementType: '$movementType'
        },
        totalQuantity: { $sum: '$quantityInBaseUnit' },
        count: { $sum: 1 },
        totalCost: { $sum: { $ifNull: ['$totalCost', 0] } }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        movements: {
          $push: {
            movementType: '$_id.movementType',
            totalQuantity: '$totalQuantity',
            count: '$count',
            totalCost: '$totalCost'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Static method เพื่อหาสินค้าที่มีการเคลื่อนไหวมากที่สุด
stockMovementSchema.statics.getMostActiveProducts = function(
  limit = 10,
  branchId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = {};
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  if (startDate && endDate) {
    match.performedAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$productId',
        totalMovements: { $sum: 1 },
        totalQuantity: { $sum: { $abs: '$quantityInBaseUnit' } },
        lastMovement: { $max: '$performedAt' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $sort: { totalMovements: -1 } },
    { $limit: limit },
    {
      $project: {
        productId: '$_id',
        'product.name': 1,
        'product.sku': 1,
        totalMovements: 1,
        totalQuantity: 1,
        lastMovement: 1
      }
    }
  ]);
};

const StockMovement = mongoose.model<IStockMovementDocument, IStockMovementModelWithStatics>('StockMovement', stockMovementSchema);

export default StockMovement;