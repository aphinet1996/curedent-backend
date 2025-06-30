import mongoose, { Schema, Model } from 'mongoose';
import { IStockDocument, IStockModel } from '../types/stock.types';

// Interface สำหรับ Model ที่รวม static methods
interface IStockModelWithStatics extends Model<IStockDocument>, IStockModel {}

const stockSchema = new Schema<IStockDocument>(
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
    quantity: {
      type: Number,
      required: [true, 'กรุณาระบุจำนวน'],
      min: [0, 'จำนวนต้องไม่ติดลบ'],
      default: 0
    },
    reservedQuantity: {
      type: Number,
      min: [0, 'จำนวนที่จองต้องไม่ติดลบ'],
      default: 0
    },
    availableQuantity: {
      type: Number,
      min: [0, 'จำนวนที่พร้อมใช้ต้องไม่ติดลบ'],
      default: 0
    },
    lastUpdated: {
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
stockSchema.index({ productId: 1, branchId: 1 }, { unique: true });
stockSchema.index({ productId: 1 });
stockSchema.index({ branchId: 1 });
stockSchema.index({ quantity: 1 });
stockSchema.index({ availableQuantity: 1 });

// Virtual สำหรับข้อมูล Product
stockSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual สำหรับข้อมูล Branch
stockSchema.virtual('branch', {
  ref: 'Branch',
  localField: 'branchId',
  foreignField: '_id',
  justOne: true
});

// Middleware เพื่อคำนวณ availableQuantity ก่อนบันทึก
stockSchema.pre('save', function(next) {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  this.lastUpdated = new Date();
  next();
});

// Validation: reservedQuantity ไม่ควรมากกว่า quantity
stockSchema.pre('save', function(next) {
  if (this.reservedQuantity > this.quantity) {
    next(new Error('จำนวนที่จองไม่สามารถมากกว่าจำนวนคงเหลือได้'));
  }
  next();
});

// Method เพื่อจอง stock
stockSchema.methods.reserve = function(quantity: number) {
  if (quantity > this.availableQuantity) {
    throw new Error('จำนวนที่ต้องการจองมากกว่าจำนวนที่พร้อมใช้');
  }
  this.reservedQuantity += quantity;
  this.availableQuantity = this.quantity - this.reservedQuantity;
  return this.save();
};

// Method เพื่อยกเลิกการจอง stock
stockSchema.methods.unreserve = function(quantity: number) {
  if (quantity > this.reservedQuantity) {
    throw new Error('จำนวนที่ต้องการยกเลิกการจองมากกว่าจำนวนที่จองไว้');
  }
  this.reservedQuantity -= quantity;
  this.availableQuantity = this.quantity - this.reservedQuantity;
  return this.save();
};

// Method เพื่อเพิ่ม stock
stockSchema.methods.addStock = function(quantity: number) {
  this.quantity += quantity;
  this.availableQuantity = this.quantity - this.reservedQuantity;
  this.lastUpdated = new Date();
  return this.save();
};

// Method เพื่อลด stock
stockSchema.methods.removeStock = function(quantity: number) {
  if (quantity > this.availableQuantity) {
    throw new Error('จำนวนที่ต้องการเบิกมากกว่าจำนวนที่พร้อมใช้');
  }
  this.quantity -= quantity;
  this.availableQuantity = this.quantity - this.reservedQuantity;
  this.lastUpdated = new Date();
  return this.save();
};

// Method เพื่อตั้งค่า stock เป็นจำนวนใหม่
stockSchema.methods.setStock = function(quantity: number) {
  if (quantity < this.reservedQuantity) {
    throw new Error('จำนวนใหม่ไม่สามารถน้อยกว่าจำนวนที่จองไว้ได้');
  }
  this.quantity = quantity;
  this.availableQuantity = this.quantity - this.reservedQuantity;
  this.lastUpdated = new Date();
  return this.save();
};

// Static method เพื่อหา stock ที่ใกล้หมด
stockSchema.statics.findLowStock = function(branchId?: string, threshold?: number) {
  const match: any = {
    $expr: {
      $lte: ['$availableQuantity', { $ifNull: ['$product.reorderLevel', threshold || 0] }]
    }
  };
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  return this.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    { $match: match },
    {
      $project: {
        productId: 1,
        branchId: 1,
        quantity: 1,
        availableQuantity: 1,
        'product.name': 1,
        'product.sku': 1,
        'product.reorderLevel': 1,
        'product.units': 1
      }
    }
  ]);
};

// Static method เพื่อหาสินค้าที่หมด
stockSchema.statics.findOutOfStock = function(branchId?: string) {
  const match: any = { availableQuantity: 0 };
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  return this.find(match)
    .populate('productId', 'name sku units')
    .populate('branchId', 'name');
};

// Static method เพื่อคำนวณมูลค่า stock
stockSchema.statics.calculateStockValue = function(branchId?: string) {
  const match: any = {};
  
  if (branchId) {
    match.branchId = new mongoose.Types.ObjectId(branchId);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$branchId',
        totalValue: {
          $sum: { $multiply: ['$quantity', '$product.cost'] }
        },
        totalProducts: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

const Stock = mongoose.model<IStockDocument, IStockModelWithStatics>('Stock', stockSchema);

export default Stock;