import mongoose, { Schema } from 'mongoose';
import { IProductDocument, ProductStatus, ProductType } from '../types/product.types';

// Schema สำหรับ Product Unit
const productUnitSchema = new Schema({
  unit: {
    type: String,
    required: [true, 'กรุณาระบุหน่วย'],
    trim: true,
    uppercase: true
  },
  conversionRate: {
    type: Number,
    required: [true, 'กรุณาระบุอัตราแปลง'],
    min: [0.001, 'อัตราแปลงต้องมากกว่า 0']
  },
  isBaseUnit: {
    type: Boolean,
    default: false
  },
  barcode: {
    type: String,
    trim: true,
    // sparse: true
  }
}, { _id: false });

const productSchema = new Schema<IProductDocument>(
  {
    sku: {
      type: String,
      required: [true, 'กรุณาระบุรหัสสินค้า'],
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสินค้า'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'กรุณาระบุหมวดหมู่'],
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    units: {
      type: [productUnitSchema],
      required: [true, 'กรุณาระบุหน่วยสินค้า'],
      validate: {
        validator: function(units: any[]) {
          // ต้องมีหน่วยหลักเพียง 1 หน่วย
          const baseUnits = units.filter(u => u.isBaseUnit);
          return baseUnits.length === 1;
        },
        message: 'ต้องมีหน่วยหลัก (base unit) เพียง 1 หน่วยเท่านั้น'
      }
    },
    price: {
      type: Number,
      required: [true, 'กรุณาระบุราคาขาย'],
      min: [0, 'ราคาขายต้องไม่ติดลบ']
    },
    cost: {
      type: Number,
      required: [true, 'กรุณาระบุต้นทุน'],
      min: [0, 'ต้นทุนต้องไม่ติดลบ']
    },
    expiryDate: {
      type: Date
    },
    image: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(ProductType),
      required: [true, 'กรุณาระบุประเภทสินค้า']
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE
    },
    notes: {
      type: String,
      trim: true
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้สร้าง']
    },
    minStockLevel: {
      type: Number,
      min: [0, 'จำนวนขั้นต่ำต้องไม่ติดลบ'],
      default: 0
    },
    maxStockLevel: {
      type: Number,
      min: [0, 'จำนวนสูงสุดต้องไม่ติดลบ']
    },
    reorderLevel: {
      type: Number,
      min: [0, 'จุดสั่งซื้อต้องไม่ติดลบ']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ type: 1 });
productSchema.index({ status: 1 });
productSchema.index({ clinicId: 1, branchId: 1 });
productSchema.index({ 'units.barcode': 1 }, { sparse: true });

// Validation: maxStockLevel ต้องมากกว่า minStockLevel
productSchema.pre('save', function(next) {
  if (this.maxStockLevel && this.minStockLevel && this.maxStockLevel < this.minStockLevel) {
    next(new Error('จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ'));
  }
  
  // Validation: reorderLevel ควรอยู่ระหว่าง min และ max
  if (this.reorderLevel) {
    if (this.minStockLevel && this.reorderLevel < this.minStockLevel) {
      next(new Error('จุดสั่งซื้อต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ'));
    }
    if (this.maxStockLevel && this.reorderLevel > this.maxStockLevel) {
      next(new Error('จุดสั่งซื้อต้องน้อยกว่าหรือเท่ากับจำนวนสูงสุด'));
    }
  }
  
  next();
});

// Method เพื่อรับหน่วยหลัก
productSchema.methods.getBaseUnit = function() {
  return this.units.find((unit: any) => unit.isBaseUnit);
};

// Method เพื่อแปลงหน่วย
productSchema.methods.convertUnit = function(quantity: number, fromUnit: string, toUnit: string) {
  const from = this.units.find((u: any) => u.unit === fromUnit.toUpperCase());
  const to = this.units.find((u: any) => u.unit === toUnit.toUpperCase());
  
  if (!from || !to) {
    throw new Error('ไม่พบหน่วยที่ระบุ');
  }
  
  // แปลงเป็นหน่วยหลักก่อน แล้วแปลงเป็นหน่วยเป้าหมาย
  const quantityInBase = quantity * from.conversionRate;
  return quantityInBase / to.conversionRate;
};

const Product = mongoose.model<IProductDocument>('Product', productSchema);

export default Product;