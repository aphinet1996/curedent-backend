// import { Document, Types } from 'mongoose';

// /**
//  * ประเภทของสินค้า
//  */
// export enum ProductType {
//   EXTERNAL = 'external', // ขายหน้าร้าน
//   INTERNAL = 'internal'  // อุปกรณ์ใช้ภายใน
// }

// /**
//  * สถานะของสินค้า
//  */
// export enum ProductStatus {
//   ACTIVE = 'active',
//   INACTIVE = 'inactive',
//   OUT_OF_STOCK = 'out_of_stock',
//   DISCONTINUED = 'discontinued'
// }

// /**
//  * หน่วยของสินค้า
//  */
// export interface IProductUnit {
//   unit: string;          // เช่น PCS, BOX, PAC
//   conversionRate: number; // อัตราแปลง เช่น 1 BOX = 10 PCS
//   isBaseUnit: boolean;   // เป็นหน่วยหลักหรือไม่
//   barcode?: string;      // barcode สำหรับหน่วยนี้
// }

// /**
//  * Product attributes interface
//  */
// export interface IProductAttributes {
//   sku: string;
//   name: string;
//   category: string;
//   brand?: string;
//   size?: string;
//   units: IProductUnit[];
//   price: number;         // ราคาขาย (ต่อหน่วยหลัก)
//   cost: number;          // ต้นทุน (ต่อหน่วยหลัก)
//   expiryDate?: Date;
//   image?: string;
//   type: ProductType;
//   status: ProductStatus;
//   notes?: string;
//   clinicId: Types.ObjectId | string;
//   branchId: Types.ObjectId | string;
//   createdBy: Types.ObjectId | string;
//   minStockLevel?: number; // จำนวนขั้นต่ำ (หน่วยหลัก)
//   maxStockLevel?: number; // จำนวนสูงสุด (หน่วยหลัก)
//   reorderLevel?: number;  // จุดสั่งซื้อ (หน่วยหลัก)
//   createdAt: Date;
//   updatedAt: Date;
// }

// /**
//  * Interface หลักสำหรับ Product
//  */
// export interface IProduct extends IProductAttributes {
//   _id: string | Types.ObjectId;
// }

// /**
//  * Interface สำหรับ Product เมื่อเก็บใน MongoDB
//  */
// export interface IProductDocument extends Document, IProductAttributes {
//   _id: Types.ObjectId;
// }

// /**
//  * Stock attributes interface
//  */
// export interface IStockAttributes {
//   productId: Types.ObjectId | string;
//   branchId: Types.ObjectId | string;
//   quantity: number;      // จำนวนในหน่วยหลัก
//   reservedQuantity: number; // จำนวนที่จองไว้
//   availableQuantity: number; // จำนวนที่พร้อมใช้
//   lastUpdated: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// /**
//  * Interface หลักสำหรับ Stock
//  */
// export interface IStock extends IStockAttributes {
//   _id: string | Types.ObjectId;
// }

// /**
//  * Interface สำหรับ Stock เมื่อเก็บใน MongoDB
//  */
// export interface IStockDocument extends Document, IStockAttributes {
//   _id: Types.ObjectId;
// }

// /**
//  * ประเภทการเคลื่อนไหว Stock
//  */
// export enum StockMovementType {
//   IN = 'in',               // รับเข้า
//   OUT = 'out',             // จ่ายออก
//   ADJUSTMENT = 'adjustment', // ปรับปรุง
//   TRANSFER = 'transfer',    // โอนย้าย
//   RETURN = 'return',       // คืน
//   DAMAGED = 'damaged',     // เสียหาย
//   EXPIRED = 'expired'      // หมดอายุ
// }

// /**
//  * Stock Movement attributes interface
//  */
// export interface IStockMovementAttributes {
//   productId: Types.ObjectId | string;
//   branchId: Types.ObjectId | string;
//   movementType: StockMovementType;
//   quantity: number;        // จำนวนที่เคลื่อนไหว
//   unit: string;           // หน่วยที่ใช้
//   quantityInBaseUnit: number; // จำนวนในหน่วยหลัก
//   balanceBefore: number;  // ยอดก่อน
//   balanceAfter: number;   // ยอดหลัง
//   referenceType?: string; // ประเภทเอกสารอ้างอิง
//   referenceId?: string;   // ID เอกสารอ้างอิง
//   reason?: string;        // เหตุผล
//   notes?: string;
//   performedBy: Types.ObjectId | string;
//   performedAt: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// /**
//  * Interface หลักสำหรับ Stock Movement
//  */
// export interface IStockMovement extends IStockMovementAttributes {
//   _id: string | Types.ObjectId;
// }

// /**
//  * Interface สำหรับ Stock Movement เมื่อเก็บใน MongoDB
//  */
// export interface IStockMovementDocument extends Document, IStockMovementAttributes {
//   _id: Types.ObjectId;
// }

// /**
//  * Interface สำหรับสร้าง Product
//  */
// export interface CreateProductInput {
//   sku: string;
//   name: string;
//   category: string;
//   brand?: string;
//   size?: string;
//   units: IProductUnit[];
//   price: number;
//   cost: number;
//   expiryDate?: Date | string;
//   image?: string;
//   type: ProductType;
//   notes?: string;
//   clinicId: string;
//   branchId: string;
//   minStockLevel?: number;
//   maxStockLevel?: number;
//   reorderLevel?: number;
// }

// /**
//  * Interface สำหรับอัปเดต Product
//  */
// export interface UpdateProductInput {
//   name?: string;
//   category?: string;
//   brand?: string;
//   size?: string;
//   units?: IProductUnit[];
//   price?: number;
//   cost?: number;
//   expiryDate?: Date | string;
//   image?: string;
//   type?: ProductType;
//   status?: ProductStatus;
//   notes?: string;
//   minStockLevel?: number;
//   maxStockLevel?: number;
//   reorderLevel?: number;
// }

// /**
//  * Interface สำหรับปรับ Stock
//  */
// export interface AdjustStockInput {
//   productId: string;
//   branchId: string;
//   quantity: number;
//   unit: string;
//   movementType: StockMovementType;
//   reason?: string;
//   notes?: string;
//   referenceType?: string;
//   referenceId?: string;
// }

// /**
//  * Interface สำหรับ Product response
//  */
// export interface ProductResponse {
//   id: string;
//   sku: string;
//   name: string;
//   category: string;
//   brand?: string;
//   size?: string;
//   units: IProductUnit[];
//   price: number;
//   cost: number;
//   expiryDate?: Date;
//   image?: string;
//   type: ProductType;
//   status: ProductStatus;
//   notes?: string;
//   clinicId: string;
//   clinicName?: string;
//   branchId: string;
//   branchName?: string;
//   stock?: StockResponse;
//   minStockLevel?: number;
//   maxStockLevel?: number;
//   reorderLevel?: number;
//   createdBy: string;
//   createdByName?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// /**
//  * Interface สำหรับ Stock response
//  */
// export interface StockResponse {
//   id: string;
//   productId: string;
//   branchId: string;
//   quantity: number;
//   reservedQuantity: number;
//   availableQuantity: number;
//   // Stock by units
//   stockByUnit?: Array<{
//     unit: string;
//     quantity: number;
//     availableQuantity: number;
//   }>;
//   lastUpdated: Date;
// }

// /**
//  * Function สำหรับแปลง IProduct เป็น ProductResponse
//  */
// export const toProductResponse = (product: IProduct | IProductDocument, stock?: IStock): ProductResponse => {
//   const id = typeof product._id === 'string' ? product._id : product._id.toString();
  
//   const getPopulatedData = (obj: any) => {
//     if (typeof obj === 'string') return { id: obj, name: undefined };
//     if (obj && obj._id) return { id: obj._id.toString(), name: obj.name };
//     return { id: obj?.toString() || '', name: undefined };
//   };

//   const clinic = getPopulatedData(product.clinicId);
//   const branch = getPopulatedData(product.branchId);
//   const createdBy = getPopulatedData(product.createdBy);

//   return {
//     id,
//     sku: product.sku,
//     name: product.name,
//     category: product.category,
//     brand: product.brand,
//     size: product.size,
//     units: product.units,
//     price: product.price,
//     cost: product.cost,
//     expiryDate: product.expiryDate,
//     image: product.image,
//     type: product.type,
//     status: product.status,
//     notes: product.notes,
//     clinicId: clinic.id,
//     clinicName: clinic.name,
//     branchId: branch.id,
//     branchName: branch.name,
//     stock: stock ? toStockResponse(stock, product.units) : undefined,
//     minStockLevel: product.minStockLevel,
//     maxStockLevel: product.maxStockLevel,
//     reorderLevel: product.reorderLevel,
//     createdBy: createdBy.id,
//     createdByName: createdBy.name,
//     createdAt: product.createdAt,
//     updatedAt: product.updatedAt
//   };
// };

// /**
//  * Function สำหรับแปลง IStock เป็น StockResponse
//  */
// export const toStockResponse = (stock: IStock | IStockDocument, units?: IProductUnit[]): StockResponse => {
//   const id = typeof stock._id === 'string' ? stock._id : stock._id.toString();
//   const productId = typeof stock.productId === 'string' ? stock.productId : stock.productId.toString();
//   const branchId = typeof stock.branchId === 'string' ? stock.branchId : stock.branchId.toString();

//   // คำนวณ stock ตามแต่ละหน่วย
//   let stockByUnit;
//   if (units) {
//     stockByUnit = units.map(unit => ({
//       unit: unit.unit,
//       quantity: Math.floor(stock.quantity / unit.conversionRate),
//       availableQuantity: Math.floor(stock.availableQuantity / unit.conversionRate)
//     }));
//   }

//   return {
//     id,
//     productId,
//     branchId,
//     quantity: stock.quantity,
//     reservedQuantity: stock.reservedQuantity,
//     availableQuantity: stock.availableQuantity,
//     stockByUnit,
//     lastUpdated: stock.lastUpdated
//   };
// };

import { Document, Types } from 'mongoose';
// Import StockMovementType from stock.types.ts to avoid duplication
export { StockMovementType } from './stock.types';

/**
 * ประเภทของสินค้า
 */
export enum ProductType {
  EXTERNAL = 'external', // ขายหน้าร้าน
  INTERNAL = 'internal'  // อุปกรณ์ใช้ภายใน
}

/**
 * สถานะของสินค้า
 */
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

/**
 * หน่วยของสินค้า
 */
export interface IProductUnit {
  unit: string;          // เช่น PCS, BOX, PAC
  conversionRate: number; // อัตราแปลง เช่น 1 BOX = 10 PCS
  isBaseUnit: boolean;   // เป็นหน่วยหลักหรือไม่
  barcode?: string;      // barcode สำหรับหน่วยนี้
}

/**
 * Product attributes interface
 */
export interface IProductAttributes {
  sku: string;
  name: string;
  category: string;
  brand?: string;
  size?: string;
  units: IProductUnit[];
  price: number;         // ราคาขาย (ต่อหน่วยหลัก)
  cost: number;          // ต้นทุน (ต่อหน่วยหลัก)
  expiryDate?: Date;
  image?: string;
  type: ProductType;
  status: ProductStatus;
  notes?: string;
  clinicId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
  minStockLevel?: number; // จำนวนขั้นต่ำ (หน่วยหลัก)
  maxStockLevel?: number; // จำนวนสูงสุด (หน่วยหลัก)
  reorderLevel?: number;  // จุดสั่งซื้อ (หน่วยหลัก)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Product
 */
export interface IProduct extends IProductAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Product เมื่อเก็บใน MongoDB
 */
export interface IProductDocument extends Document, IProductAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับสร้าง Product
 */
export interface CreateProductInput {
  sku: string;
  name: string;
  category: string;
  brand?: string;
  size?: string;
  units: IProductUnit[];
  price: number;
  cost: number;
  expiryDate?: Date | string;
  image?: string;
  type: ProductType;
  notes?: string;
  clinicId: string;
  branchId: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
}

/**
 * Interface สำหรับอัปเดต Product
 */
export interface UpdateProductInput {
  name?: string;
  category?: string;
  brand?: string;
  size?: string;
  units?: IProductUnit[];
  price?: number;
  cost?: number;
  expiryDate?: Date | string;
  image?: string;
  type?: ProductType;
  status?: ProductStatus;
  notes?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
}

/**
 * Interface สำหรับ Product response
 */
export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  size?: string;
  units: IProductUnit[];
  price: number;
  cost: number;
  expiryDate?: Date;
  image?: string;
  type: ProductType;
  status: ProductStatus;
  notes?: string;
  clinicId: string;
  clinicName?: string;
  branchId: string;
  branchName?: string;
  stock?: import('./stock.types').StockResponse;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IProduct เป็น ProductResponse
 */
export const toProductResponse = (
  product: IProduct | IProductDocument, 
  stock?: import('./stock.types').IStock
): ProductResponse => {
  const id = typeof product._id === 'string' ? product._id : product._id.toString();
  
  const getPopulatedData = (obj: any) => {
    if (typeof obj === 'string') return { id: obj, name: undefined };
    if (obj && obj._id) return { id: obj._id.toString(), name: obj.name };
    return { id: obj?.toString() || '', name: undefined };
  };

  const clinic = getPopulatedData(product.clinicId);
  const branch = getPopulatedData(product.branchId);
  const createdBy = getPopulatedData(product.createdBy);

  // Import toStockResponse function synchronously
  let stockResponse: import('./stock.types').StockResponse | undefined;
  if (stock) {
    // We'll handle this in the controller where we can use async/await properly
    const { toStockResponse } = require('./stock.types');
    stockResponse = toStockResponse(stock, product.units);
  }

  return {
    id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    size: product.size,
    units: product.units,
    price: product.price,
    cost: product.cost,
    expiryDate: product.expiryDate,
    image: product.image,
    type: product.type,
    status: product.status,
    notes: product.notes,
    clinicId: clinic.id,
    clinicName: clinic.name,
    branchId: branch.id,
    branchName: branch.name,
    stock: stockResponse,
    minStockLevel: product.minStockLevel,
    maxStockLevel: product.maxStockLevel,
    reorderLevel: product.reorderLevel,
    createdBy: createdBy.id,
    createdByName: createdBy.name,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
};