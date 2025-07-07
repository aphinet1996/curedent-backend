import mongoose, { Schema, Model } from 'mongoose';
import { IDrugDocument, IDrugMultilingualText } from '../types/drug.types';

// Interface สำหรับ static methods
interface IDrugModel extends Model<IDrugDocument> {
  findByClinic(clinicId: string, branchId?: string, includeArchived?: boolean): Promise<IDrugDocument[]>;
  findByCategory(clinicId: string, category: string, subcategory?: string, branchId?: string): Promise<IDrugDocument[]>;
  searchDrugs(clinicId: string, searchTerm: string, options?: any): Promise<IDrugDocument[]>;
}

// Schema สำหรับข้อมูลหลายภาษา
const multilingualTextSchema = new Schema<IDrugMultilingualText>({
    th: { type: String, trim: true },
    en: { type: String, trim: true }
}, { 
    _id: false,
    strict: false // อนุญาตให้เพิ่มฟิลด์ภาษาอื่นๆ ได้
});

// Schema สำหรับ Drug
const drugSchema = new Schema<IDrugDocument>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก'],
      index: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: false,
      index: true
    },
    
    drugCode: {
      type: String,
      required: [true, 'กรุณาระบุรหัสยา'],
      trim: true,
      uppercase: true,
      maxlength: [50, 'รหัสยาต้องไม่เกิน 50 ตัวอักษร']
    },
    drugName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อยา'],
      trim: true,
      maxlength: [200, 'ชื่อยาต้องไม่เกิน 200 ตัวอักษร']
    },
    category: {
      type: String,
      required: [true, 'กรุณาระบุหมวดหมู่ยา'],
      trim: true,
      maxlength: [100, 'หมวดหมู่ยาต้องไม่เกิน 100 ตัวอักษร']
    },
    subcategory: {
      type: String,
      required: [true, 'กรุณาระบุหมวดหมู่ย่อย'],
      trim: true,
      maxlength: [100, 'หมวดหมู่ย่อยต้องไม่เกิน 100 ตัวอักษร']
    },
    dosage: {
      type: String,
      required: [true, 'กรุณาระบุขนาดยา'],
      trim: true,
      maxlength: [100, 'ขนาดยาต้องไม่เกิน 100 ตัวอักษร']
    },
    unit: {
      type: String,
      required: [true, 'กรุณาระบุหน่วยยา'],
      trim: true,
      maxlength: [50, 'หน่วยยาต้องไม่เกิน 50 ตัวอักษร']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'กรุณาระบุราคาขาย'],
      min: [0, 'ราคาขายต้องไม่น้อยกว่า 0']
    },
    
    // ข้อมูลเสริม (optional)
    scientificName: {
      type: String,
      trim: true,
      maxlength: [300, 'ชื่อทางวิทยาศาสตร์ต้องไม่เกิน 300 ตัวอักษร']
    },
    printName: {
      type: String,
      trim: true,
      maxlength: [200, 'ชื่อสำหรับพิมพ์ต้องไม่เกิน 200 ตัวอักษร']
    },
    indications: {
      type: String,
      trim: true,
      maxlength: [1000, 'ข้อบ่งใช้ต้องไม่เกิน 1000 ตัวอักษร']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'รายละเอียดต้องไม่เกิน 2000 ตัวอักษร']
    },
    dosageMethod: {
      type: String,
      trim: true,
      maxlength: [100, 'วิธีใช้ต้องไม่เกิน 100 ตัวอักษร']
    },
    dosageTime: {
      type: String,
      trim: true,
      maxlength: [100, 'เวลาใช้ต้องไม่เกิน 100 ตัวอักษร']
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'คำแนะนำการใช้ต้องไม่เกิน 1000 ตัวอักษร']
    },
    purchasePrice: {
      type: Number,
      min: [0, 'ราคาซื้อต้องไม่น้อยกว่า 0']
    },
    
    // Multilingual Support - สำหรับฉลากยา
    multilingualData: {
      scientificName: multilingualTextSchema,
      printName: multilingualTextSchema,
      indications: multilingualTextSchema,
      instructions: multilingualTextSchema,
      unit: multilingualTextSchema,
      dosageMethod: multilingualTextSchema,
      dosageTime: multilingualTextSchema
    },
    
    // สถานะและการจัดการ
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้สร้าง']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้แก้ไข']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Compound unique index สำหรับรหัสยาในแต่ละคลินิก
drugSchema.index(
  { clinicId: 1, drugCode: 1 }, 
  { 
    unique: true,
    name: 'clinic_drug_code_unique'
  }
);

// Index สำหรับรหัสยาในแต่ละสาขา (ถ้ามี)
drugSchema.index(
  { clinicId: 1, branchId: 1, drugCode: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { branchId: { $exists: true } },
    name: 'clinic_branch_drug_code_unique'
  }
);

// Performance indexes
drugSchema.index({ clinicId: 1, category: 1, isActive: 1 });
drugSchema.index({ clinicId: 1, subcategory: 1, isActive: 1 });
drugSchema.index({ clinicId: 1, drugName: 1, isActive: 1 });
drugSchema.index({ clinicId: 1, isActive: 1, isArchived: 1 });

// Search indexes
drugSchema.index({
  drugCode: 'text',
  drugName: 'text',
  scientificName: 'text',
  category: 'text',
  subcategory: 'text'
}, {
  name: 'drug_search_text',
  weights: {
    drugCode: 10,
    drugName: 8,
    scientificName: 6,
    category: 4,
    subcategory: 2
  }
});

// Index สำหรับการจัดการ price range
drugSchema.index({ 
  clinicId: 1, 
  sellingPrice: 1, 
  isActive: 1 
});

// Static methods
// ค้นหายาในคลินิก/สาขา
drugSchema.statics.findByClinic = function(clinicId: string, branchId?: string, includeArchived = false) {
  const query: any = { clinicId };
  
  if (branchId) {
    query.branchId = branchId;
  }
  
  if (!includeArchived) {
    query.isArchived = false;
  }
  
  return this.find(query).sort({ drugName: 1 });
};

// ค้นหายาตามหมวดหมู่
drugSchema.statics.findByCategory = function(
  clinicId: string, 
  category: string, 
  subcategory?: string,
  branchId?: string
) {
  const query: any = { 
    clinicId, 
    category,
    isActive: true,
    isArchived: false
  };
  
  if (subcategory) {
    query.subcategory = subcategory;
  }
  
  if (branchId) {
    query.branchId = branchId;
  }
  
  return this.find(query).sort({ drugName: 1 });
};

// ค้นหายาที่ stock ต่ำ - REMOVED (ไว้เพิ่มทีหลัง)
// drugSchema.statics.findLowStock = function(clinicId: string, branchId?: string) { ... }

// ค้นหาแบบ full-text
drugSchema.statics.searchDrugs = function(
  clinicId: string, 
  searchTerm: string, 
  options: any = {}
) {
  const query: any = {
    clinicId,
    $text: { $search: searchTerm },
    isActive: true,
    isArchived: false
  };
  
  if (options.branchId) {
    query.branchId = options.branchId;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.priceRange) {
    if (options.priceRange.min !== undefined) {
      query.sellingPrice = { ...query.sellingPrice, $gte: options.priceRange.min };
    }
    if (options.priceRange.max !== undefined) {
      query.sellingPrice = { ...query.sellingPrice, $lte: options.priceRange.max };
    }
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Virtual fields
drugSchema.virtual('profitMargin').get(function() {
  if (this.purchasePrice && this.purchasePrice > 0) {
    return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
  }
  return null;
});

drugSchema.virtual('profitAmount').get(function() {
  if (this.purchasePrice) {
    return this.sellingPrice - this.purchasePrice;
  }
  return null;
});

// Stock-related virtual fields - REMOVED (ไว้เพิ่มทีหลัง)
// drugSchema.virtual('isLowStock').get(...);
// drugSchema.virtual('stockStatus').get(...);

// Pre-save middleware
drugSchema.pre('save', function(next) {
  // Auto-generate drugCode if not provided
  if (!this.drugCode && this.isNew) {
    // สร้างรหัสยาอัตโนมัติ เช่น DRUG001, DRUG002
    this.drugCode = `DRUG${Date.now().toString().slice(-6)}`;
  }
  
  // Validate selling price vs purchase price
  if (this.purchasePrice && this.sellingPrice < this.purchasePrice) {
    return next(new Error('ราคาขายต้องไม่น้อยกว่าราคาซื้อ'));
  }
  
  // Auto-set printName if not provided
  if (!this.printName) {
    this.printName = this.drugName;
  }
  
  next();
});

// Pre-remove middleware
drugSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // ตรวจสอบว่ายานี้ถูกใช้ในใบสั่งยาหรือไม่ (สำหรับอนาคต)
  // const Prescription = mongoose.model('Prescription');
  // const prescriptionsCount = await Prescription.countDocuments({
  //   'drugs.drugId': this._id
  // });
  
  // if (prescriptionsCount > 0) {
  //   throw new Error(`ไม่สามารถลบยานี้ได้ เนื่องจากมีการใช้งานในใบสั่งยา ${prescriptionsCount} รายการ`);
  // }
});

// Post-save middleware
drugSchema.post('save', function(doc) {
  console.log(`Drug ${doc.drugName} (${doc.drugCode}) saved successfully`);
});

// Instance methods
drugSchema.methods.archive = function() {
  this.isArchived = true;
  this.isActive = false;
  return this.save();
};

drugSchema.methods.restore = function() {
  this.isArchived = false;
  this.isActive = true;
  return this.save();
};

// Stock management methods - REMOVED (ไว้เพิ่มทีหลัง)
// drugSchema.methods.updateStock = function(...) { ... }

drugSchema.methods.setMultilingualData = function(
  field: keyof IDrugDocument['multilingualData'], 
  data: IDrugMultilingualText
) {
  if (!this.multilingualData) {
    this.multilingualData = {};
  }
  this.multilingualData[field] = data;
  return this.save();
};

export const Drug = mongoose.model<IDrugDocument, IDrugModel>('Drug', drugSchema);

export default Drug;