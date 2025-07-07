// types/drug.types.ts
import { Document, Types } from 'mongoose';
import { IMultilingualOption } from './patient.types';

// Drug Option Categories ที่คลินิกสามารถปรับแต่งได้
export type DrugOptionCategory = 
  | 'drugCategory'      // หมวดหมู่ยา
  | 'drugSubcategory'   // หมวดหมู่ย่อย
  | 'unit'              // หน่วย
  | 'dosageMethod'      // วิธีใช้
  | 'dosageTime';       // เวลาใช้

// Interface สำหรับข้อมูลหลายภาษาแบบ extended
export interface IDrugMultilingualText {
  th?: string;
  en?: string;
  [key: string]: string | undefined;
}

// Interface สำหรับ Drug Options Document
export interface IDrugOptionsDocument extends Document {
  clinicId?: Types.ObjectId | string;
  branchId?: Types.ObjectId | string;
  category: DrugOptionCategory;
  values: IMultilingualOption[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface สำหรับ Drug Label Settings (ตั้งค่าฉลากยา)
export interface IDrugLabelSettings {
  drugId: Types.ObjectId | string;
  languages: string[];
  customLabels: {
    scientificName?: IDrugMultilingualText;
    printName?: IDrugMultilingualText;
    indications?: IDrugMultilingualText;
    instructions?: IDrugMultilingualText;
    unit?: IDrugMultilingualText;
    dosageMethod?: IDrugMultilingualText;
    dosageTime?: IDrugMultilingualText;
  };
  isActive: boolean;
}

// Interface สำหรับ Drug Document
export interface IDrugDocument extends Document {
  clinicId: Types.ObjectId | string;
  branchId?: Types.ObjectId | string;
  
  // ข้อมูลพื้นฐาน (required)
  drugCode: string;           // รหัสยา *
  drugName: string;           // ชื่อยา *
  category: string;           // หมวดหมู่ยา * +
  subcategory: string;        // หมวดหมู่ย่อย * +
  dosage: string;             // ขนาด *
  unit: string;               // หน่วย * +
  sellingPrice: number;       // ราคาขาย *
  
  // ข้อมูลเสริม (optional)
  scientificName?: string;    // ชื่อทางวิทยาศาสตร์
  printName?: string;         // ชื่อสำหรับพิมพ์
  indications?: string;       // ข้อบ่งใช้
  description?: string;       // รายละเอียด
  dosageMethod?: string;      // วิธีใช้ +
  dosageTime?: string;        // เวลาใช้ +
  instructions?: string;      // คำแนะนำการใช้
  purchasePrice?: number;     // ราคาซื้อ
  
  // Multilingual Support - จะมีข้อมูลเมื่อผู้ใช้ตั้งค่าฉลากยา
  multilingualData?: {
    scientificName?: IDrugMultilingualText;
    printName?: IDrugMultilingualText;
    indications?: IDrugMultilingualText;
    instructions?: IDrugMultilingualText;
    unit?: IDrugMultilingualText;
    dosageMethod?: IDrugMultilingualText;
    dosageTime?: IDrugMultilingualText;
  };
  
  // สถานะและการจัดการ
  isActive: boolean;
  isArchived: boolean;
  
  // Metadata
  createdBy: Types.ObjectId | string;
  updatedBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface สำหรับ Drug Dropdown Options
export interface IDrugDropdownOptions {
  drugCategories: IMultilingualOption[];
  drugSubcategories: IMultilingualOption[];
  units: IMultilingualOption[];
  dosageMethods: IMultilingualOption[];
  dosageTimes: IMultilingualOption[];
}

// Interface สำหรับการค้นหาและ filter
export interface IDrugSearchFilter {
  clinicId?: string;
  branchId?: string;
  category?: string;
  subcategory?: string;
  drugCode?: string;
  drugName?: string;
  isActive?: boolean;
  isArchived?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  searchTerm?: string;
}

// Interface สำหรับการสร้าง/อัปเดต Drug
export interface IDrugCreateInput {
  clinicId?: string;
  branchId?: string;
  drugCode: string;
  drugName: string;
  category: string;
  subcategory: string;
  dosage: string;
  unit: string;
  sellingPrice: number;
  scientificName?: string;
  printName?: string;
  indications?: string;
  description?: string;
  dosageMethod?: string;
  dosageTime?: string;
  instructions?: string;
  purchasePrice?: number;
}

export interface IDrugUpdateInput extends Partial<IDrugCreateInput> {
  isActive?: boolean;
  isArchived?: boolean;
}

// Interface สำหรับ Bulk Operations
export interface IDrugBulkOperation {
  action: 'create' | 'update' | 'delete' | 'archive' | 'activate';
  drugIds?: string[];
  data?: IDrugCreateInput | IDrugUpdateInput;
  filter?: IDrugSearchFilter;
}

// Interface สำหรับ Drug Label Configuration
export interface IDrugLabelConfig {
  drugId: Types.ObjectId | string;
  languages: string[];
  showFields: {
    scientificName: boolean;
    printName: boolean;
    indications: boolean;
    instructions: boolean;
    dosageMethod: boolean;
    dosageTime: boolean;
  };
  customTranslations?: {
    [fieldName: string]: IDrugMultilingualText;
  };
}

// Interface สำหรับ Export/Import
export interface IDrugExportFormat {
  format: 'csv' | 'excel' | 'json';
  includeFields: string[];
  includeMultilingual?: boolean;
  includeArchived?: boolean;
}

export interface IDrugImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

// Response types
export interface IDrugResponse {
  status: 'success' | 'error';
  data?: {
    drug?: IDrugDocument;
    drugs?: IDrugDocument[];
    options?: IDrugDropdownOptions;
    total?: number;
    page?: number;
    limit?: number;
  };
  message?: string;
}

export interface IDrugOptionsResponse {
  status: 'success' | 'error';
  data?: {
    category?: string;
    values?: IMultilingualOption[];
    options?: IDrugDropdownOptions;
  };
  message?: string;
}