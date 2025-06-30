import mongoose, { Schema, Model } from 'mongoose';
import { IDrugOptionsDocument, DrugOptionCategory } from '../types/drug.types';
import { IMultilingualOption } from '../types/patient.types';

// Interface สำหรับ static methods
interface IDrugOptionsModel extends Model<IDrugOptionsDocument> {
  getOptionsByClinic(clinicId: string, branchId?: string): Promise<IDrugOptionsDocument[]>;
  getOptionsByCategory(clinicId: string, category: DrugOptionCategory, branchId?: string): Promise<IDrugOptionsDocument[]>;
  getSubcategoriesByCategory(clinicId: string, categoryValue: string, branchId?: string): Promise<IDrugOptionsDocument[]>;
}

// Schema สำหรับตัวเลือกหลายภาษา (reuse จาก patient-options)
const multilingualOptionSchema = new Schema<IMultilingualOption>({
    th: {
        type: String,
        required: [true, 'กรุณาระบุข้อมูลภาษาไทย'],
        trim: true,
        maxlength: [200, 'ข้อมูลภาษาไทยต้องไม่เกิน 200 ตัวอักษร']
    },
    en: {
        type: String,
        trim: true,
        maxlength: [200, 'ข้อมูลภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร']
    }
}, { _id: false });

// Schema สำหรับ Drug Options
const drugOptionsSchema = new Schema<IDrugOptionsDocument>(
  {
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: function(this: IDrugOptionsDocument) {
        return !this.isDefault;
      },
      validate: {
        validator: function(this: IDrugOptionsDocument, v: any) {
          // ถ้าเป็น default options ไม่ต้องมี clinicId
          if (this.isDefault) return true;
          // ถ้าไม่ใช่ default ต้องมี clinicId
          return v != null;
        },
        message: 'Default options ไม่ต้องระบุคลินิก, คลินิกเฉพาะต้องระบุคลินิก'
      }
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: false // Optional สำหรับอนาคตที่อาจมีหลายสาขา
    },
    category: {
      type: String,
      required: [true, 'กรุณาระบุประเภทของตัวเลือกยา'],
      enum: {
        values: ['drugCategory', 'drugSubcategory', 'unit', 'dosageMethod', 'dosageTime'],
        message: 'ประเภทของตัวเลือกยาไม่ถูกต้อง'
      }
    },
    values: {
        type: [multilingualOptionSchema],
        required: [true, 'กรุณาระบุค่าตัวเลือกยา'],
        validate: {
            validator: function(v: IMultilingualOption[]) {
                return v && v.length > 0;
            },
            message: 'ต้องมีค่าตัวเลือกยาอย่างน้อย 1 รายการ'
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
drugOptionsSchema.index(
  { clinicId: 1, category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isDefault: false } // ใช้เฉพาะ non-default options
  }
);

// Index สำหรับ default options
drugOptionsSchema.index(
  { category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isDefault: true } // ใช้เฉพาะ default options
  }
);

// Index สำหรับ branch-specific options (สำหรับอนาคต)
drugOptionsSchema.index(
  { clinicId: 1, branchId: 1, category: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { isDefault: false, branchId: { $exists: true } }
  }
);

// Additional indexes สำหรับ performance
drugOptionsSchema.index({ category: 1, isActive: 1 });
drugOptionsSchema.index({ isActive: 1 });
drugOptionsSchema.index({ isDefault: 1 });

// Compound index สำหรับ query ที่ใช้บ่อย
drugOptionsSchema.index({ 
  category: 1, 
  isDefault: 1, 
  isActive: 1 
});

// Index สำหรับ clinic-specific queries
drugOptionsSchema.index({ 
  clinicId: 1, 
  category: 1, 
  isActive: 1 
}, { 
  partialFilterExpression: { 
    isDefault: false 
  } 
});

// Text search index สำหรับค้นหาในภาษาต่างๆ
drugOptionsSchema.index({
  'values.th': 'text',
  'values.en': 'text'
});

// Static methods สำหรับดึงตัวเลือกทั้งหมดของคลินิก
drugOptionsSchema.statics.getOptionsByClinic = function(clinicId: string, branchId?: string) {
  const query: any = {
    $or: [
      { clinicId, isActive: true },
      { isDefault: true, isActive: true } // รวมข้อมูลเริ่มต้นของระบบ
    ]
  };

  // ถ้าระบุ branchId ให้รวมเฉพาะของสาขานั้นด้วย
  if (branchId) {
    query.$or.push({ clinicId, branchId, isActive: true });
  }

  return this.find(query).sort({ category: 1, isDefault: 1 });
};

// Static method สำหรับดึงตัวเลือกตามประเภท
drugOptionsSchema.statics.getOptionsByCategory = function(
  clinicId: string, 
  category: DrugOptionCategory, 
  branchId?: string
) {
  const query: any = {
    $or: [
      { clinicId, category, isActive: true },
      { isDefault: true, category, isActive: true }
    ]
  };

  // ถ้าระบุ branchId ให้รวมเฉพาะของสาขานั้นด้วย
  if (branchId) {
    query.$or.push({ clinicId, branchId, category, isActive: true });
  }

  return this.find(query).sort({ isDefault: 1 }); // ข้อมูลของคลินิก/สาขามาก่อนข้อมูลเริ่มต้น
};

// Static method สำหรับดึงตัวเลือกที่เกี่ยวข้องกับหมวดหมู่ย่อย
drugOptionsSchema.statics.getSubcategoriesByCategory = function(
  clinicId: string, 
  categoryValue: string,
  branchId?: string
) {
  // Cast this to the correct type to access other static methods
  const Model = this as IDrugOptionsModel;
  
  // นี่คือ placeholder สำหรับ logic ที่ซับซ้อนกว่า
  // ในอนาคตอาจต้องการ link หมวดหมู่ใหญ่กับหมวดหมู่ย่อย
  return Model.getOptionsByCategory(clinicId, 'drugSubcategory', branchId);
};

// Pre-save middleware เพื่อ validate logic
drugOptionsSchema.pre('save', function(next) {
  // ตรวจสอบว่า default options ไม่มี clinicId
  if (this.isDefault && this.clinicId) {
    return next(new Error('Default drug options ต้องไม่มี clinicId'));
  }
  
  // ตรวจสอบว่า non-default options ต้องมี clinicId
  if (!this.isDefault && !this.clinicId) {
    return next(new Error('คลินิกเฉพาะต้องระบุ clinicId'));
  }
  
  // ตรวจสอบว่า branch-specific options ต้องมี clinicId
  if (this.branchId && !this.clinicId) {
    return next(new Error('สาขาเฉพาะต้องระบุ clinicId'));
  }
  
  // ตรวจสอบว่า values ไม่ซ้ำกัน (เฉพาะภาษาไทย)
  const thValues = this.values.map(v => v.th.toLowerCase().trim());
  const uniqueThValues = [...new Set(thValues)];
  if (thValues.length !== uniqueThValues.length) {
    return next(new Error('ค่าตัวเลือกยาภาษาไทยต้องไม่ซ้ำกัน'));
  }
  
  next();
});

// Pre-remove middleware สำหรับตรวจสอบการใช้งาน
drugOptionsSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // ตรวจสอบว่ามียาที่ใช้ตัวเลือกนี้อยู่หรือไม่
  const Drug = mongoose.model('Drug');
  const categoryField = this.category === 'drugCategory' ? 'category' : 
                       this.category === 'drugSubcategory' ? 'subcategory' :
                       this.category === 'unit' ? 'unit' :
                       this.category === 'dosageMethod' ? 'dosageMethod' :
                       this.category === 'dosageTime' ? 'dosageTime' : null;

  if (categoryField) {
    const usedValues = this.values.map(v => v.th);
    const drugsUsingThisOption = await Drug.countDocuments({
      clinicId: this.clinicId,
      [categoryField]: { $in: usedValues },
      isArchived: false
    });

    if (drugsUsingThisOption > 0) {
      throw new Error(`ไม่สามารถลบตัวเลือกนี้ได้ เนื่องจากมียาที่ใช้ตัวเลือกนี้อยู่ ${drugsUsingThisOption} รายการ`);
    }
  }
});

// Post-save middleware
drugOptionsSchema.post('save', function(doc) {
  console.log(`Drug option ${doc.category} (${doc.isDefault ? 'default' : 'clinic'}) saved successfully`);
});

// Virtual สำหรับการนับจำนวน values
drugOptionsSchema.virtual('valuesCount').get(function() {
  return this.values ? this.values.length : 0;
});

export const DrugOptions = mongoose.model<IDrugOptionsDocument, IDrugOptionsModel>('DrugOptions', drugOptionsSchema);

export default DrugOptions;