import { Document, Types, Model } from 'mongoose';

/**
 * ประเภทการเคลื่อนไหว Stock
 */
export enum StockMovementType {
  IN = 'in',               // รับเข้า
  OUT = 'out',             // จ่ายออก
  ADJUSTMENT = 'adjustment', // ปรับปรุง
  TRANSFER_IN = 'transfer_in',    // โอนเข้า
  TRANSFER_OUT = 'transfer_out',  // โอนออก
  RETURN = 'return',       // คืน
  DAMAGED = 'damaged',     // เสียหาย
  EXPIRED = 'expired',     // หมดอายุ
  SALE = 'sale',          // ขาย
  PURCHASE = 'purchase'   // ซื้อ
}

/**
 * สถานะการโอน Stock
 */
export enum TransferStatus {
  PENDING = 'pending',     // รอการยืนยัน
  IN_TRANSIT = 'in_transit', // อยู่ระหว่างการส่ง
  COMPLETED = 'completed', // เสร็จสิ้น
  CANCELLED = 'cancelled'  // ยกเลิก
}

/**
 * Stock attributes interface
 */
export interface IStockAttributes {
  productId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  quantity: number;      // จำนวนในหน่วยหลัก
  reservedQuantity: number; // จำนวนที่จองไว้
  availableQuantity: number; // จำนวนที่พร้อมใช้
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Stock
 */
export interface IStock extends IStockAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Stock เมื่อเก็บใน MongoDB
 */
export interface IStockDocument extends Document, IStockAttributes {
  _id: Types.ObjectId;
  
  // Methods from stock.model.ts
  reserve(quantity: number): Promise<IStockDocument>;
  unreserve(quantity: number): Promise<IStockDocument>;
  addStock(quantity: number): Promise<IStockDocument>;
  removeStock(quantity: number): Promise<IStockDocument>;
  setStock(quantity: number): Promise<IStockDocument>;
}

/**
 * Interface สำหรับ Stock Model (static methods)
 */
export interface IStockModel extends Model<IStockDocument> {
  findLowStock(branchId?: string, threshold?: number): Promise<any[]>;
  findOutOfStock(branchId?: string): Promise<IStockDocument[]>;
  calculateStockValue(branchId?: string): Promise<any[]>;
}

/**
 * Stock Movement attributes interface
 */
export interface IStockMovementAttributes {
  productId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  movementType: StockMovementType;
  quantity: number;        // จำนวนที่เคลื่อนไหว
  unit: string;           // หน่วยที่ใช้
  quantityInBaseUnit: number; // จำนวนในหน่วยหลัก
  balanceBefore: number;  // ยอดก่อน
  balanceAfter: number;   // ยอดหลัง
  referenceType?: string; // ประเภทเอกสารอ้างอิง
  referenceId?: string;   // ID เอกสารอ้างอิง
  transferId?: Types.ObjectId | string; // ID การโอน (ถ้าเป็น transfer)
  reason?: string;        // เหตุผล
  notes?: string;
  cost?: number;         // ต้นทุนต่อหน่วย (สำหรับ purchase)
  totalCost?: number;    // ต้นทุนรวม
  performedBy: Types.ObjectId | string;
  performedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Stock Movement
 */
export interface IStockMovement extends IStockMovementAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Stock Movement เมื่อเก็บใน MongoDB
 */
export interface IStockMovementDocument extends Document, IStockMovementAttributes {
  _id: Types.ObjectId;
  
  // Methods from stock-movement.model.ts
  isStockIncrease(): boolean;
  isStockDecrease(): boolean;
}

/**
 * Interface สำหรับ Stock Movement Model (static methods)
 */
export interface IStockMovementModel extends Model<IStockMovementDocument> {
  getMovementStats(productId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
  getMovementsByPeriod(branchId?: string, startDate?: Date, endDate?: Date, movementTypes?: StockMovementType[]): Promise<IStockMovementDocument[]>;
  getMonthlyMovements(year: number, branchId?: string): Promise<any[]>;
  getMostActiveProducts(limit?: number, branchId?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
}

/**
 * Stock Transfer attributes interface
 */
export interface IStockTransferAttributes {
  transferNumber: string;
  productId: Types.ObjectId | string;
  fromBranchId: Types.ObjectId | string;
  toBranchId: Types.ObjectId | string;
  quantity: number;
  unit: string;
  quantityInBaseUnit: number;
  status: TransferStatus;
  requestedBy: Types.ObjectId | string;
  requestedAt: Date;
  approvedBy?: Types.ObjectId | string;
  approvedAt?: Date;
  sentBy?: Types.ObjectId | string;
  sentAt?: Date;
  receivedBy?: Types.ObjectId | string;
  receivedAt?: Date;
  notes?: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Stock Transfer
 */
export interface IStockTransfer extends IStockTransferAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Stock Transfer เมื่อเก็บใน MongoDB
 */
export interface IStockTransferDocument extends Document, IStockTransferAttributes {
  _id: Types.ObjectId;
  
  // Virtual properties from stock-transfer.model.ts
  transferDuration?: number;
  totalProcessTime?: number;
  
  // Methods from stock-transfer.model.ts
  approve(approvedBy: string, notes?: string): Promise<IStockTransferDocument>;
  send(sentBy: string, notes?: string): Promise<IStockTransferDocument>;
  receive(receivedBy: string, notes?: string): Promise<IStockTransferDocument>;
  cancel(reason: string): Promise<IStockTransferDocument>;
  canEdit(): boolean;
  canCancel(): boolean;
}

/**
 * Interface สำหรับ Stock Transfer Model (static methods)
 */
export interface IStockTransferModel extends Model<IStockTransferDocument> {
  getTransferStats(startDate?: Date, endDate?: Date, branchId?: string): Promise<any[]>;
  findPendingTooLong(hours?: number): Promise<IStockTransferDocument[]>;
  findCompletedLate(expectedHours?: number): Promise<IStockTransferDocument[]>;
  getMonthlyTransfers(year: number, branchId?: string): Promise<any[]>;
}

/**
 * Interface สำหรับปรับ Stock
 */
export interface AdjustStockInput {
  productId: string;
  branchId: string;
  quantity: number;
  unit: string;
  movementType: StockMovementType;
  reason?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
  cost?: number; // สำหรับ purchase
}

/**
 * Interface สำหรับโอน Stock
 */
export interface TransferStockInput {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  unit: string;
  reason: string;
  notes?: string;
}

/**
 * Interface สำหรับการรับสินค้าโอน
 */
export interface ReceiveTransferInput {
  transferId: string;
  receivedQuantity?: number; // จำนวนที่รับจริง (อาจน้อยกว่าที่ส่ง)
  notes?: string;
}

/**
 * Interface สำหรับ Stock response
 */
export interface StockResponse {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  branchId: string;
  branchName?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  // Stock by units
  stockByUnit?: Array<{
    unit: string;
    quantity: number;
    availableQuantity: number;
  }>;
  lastUpdated: Date;
}

/**
 * Interface สำหรับ Stock Movement response
 */
export interface StockMovementResponse {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  branchId: string;
  branchName?: string;
  movementType: StockMovementType;
  quantity: number;
  unit: string;
  quantityInBaseUnit: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  transferId?: string;
  reason?: string;
  notes?: string;
  cost?: number;
  totalCost?: number;
  performedBy: string;
  performedByName?: string;
  performedAt: Date;
}

/**
 * Interface สำหรับ Stock Transfer response
 */
export interface StockTransferResponse {
  id: string;
  transferNumber: string;
  productId: string;
  productName?: string;
  productSku?: string;
  fromBranchId: string;
  fromBranchName?: string;
  toBranchId: string;
  toBranchName?: string;
  quantity: number;
  unit: string;
  quantityInBaseUnit: number;
  status: TransferStatus;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  sentBy?: string;
  sentByName?: string;
  sentAt?: Date;
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: Date;
  notes?: string;
  reason: string;
}

/**
 * Interface สำหรับ Stock Summary
 */
export interface StockSummaryResponse {
  branchId: string;
  branchName?: string;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number; // มูลค่ารวมของ stock
}

/**
 * Function สำหรับแปลง IStock เป็น StockResponse
 */
export const toStockResponse = (
  stock: IStock | IStockDocument,
  productUnits?: Array<{ unit: string; conversionRate: number; isBaseUnit: boolean }>,
  productInfo?: { name?: string; sku?: string },
  branchInfo?: { name?: string }
): StockResponse => {
  const id = typeof stock._id === 'string' ? stock._id : stock._id.toString();
  const productId = typeof stock.productId === 'string' ? stock.productId : stock.productId.toString();
  const branchId = typeof stock.branchId === 'string' ? stock.branchId : stock.branchId.toString();

  // คำนวณ stock ตามแต่ละหน่วย
  let stockByUnit;
  if (productUnits) {
    stockByUnit = productUnits.map(unit => ({
      unit: unit.unit,
      quantity: Math.floor(stock.quantity / unit.conversionRate),
      availableQuantity: Math.floor(stock.availableQuantity / unit.conversionRate)
    }));
  }

  return {
    id,
    productId,
    productName: productInfo?.name,
    productSku: productInfo?.sku,
    branchId,
    branchName: branchInfo?.name,
    quantity: stock.quantity,
    reservedQuantity: stock.reservedQuantity,
    availableQuantity: stock.availableQuantity,
    stockByUnit,
    lastUpdated: stock.lastUpdated
  };
};

/**
 * Function สำหรับแปลง IStockMovement เป็น StockMovementResponse
 */
export const toStockMovementResponse = (
  movement: IStockMovement | IStockMovementDocument,
  productInfo?: { name?: string; sku?: string },
  branchInfo?: { name?: string },
  performedByInfo?: { name?: string }
): StockMovementResponse => {
  const id = typeof movement._id === 'string' ? movement._id : movement._id.toString();
  const productId = typeof movement.productId === 'string' ? movement.productId : movement.productId.toString();
  const branchId = typeof movement.branchId === 'string' ? movement.branchId : movement.branchId.toString();
  const performedBy = typeof movement.performedBy === 'string' ? movement.performedBy : movement.performedBy.toString();
  const transferId = movement.transferId ? 
    (typeof movement.transferId === 'string' ? movement.transferId : movement.transferId.toString()) : 
    undefined;

  return {
    id,
    productId,
    productName: productInfo?.name,
    productSku: productInfo?.sku,
    branchId,
    branchName: branchInfo?.name,
    movementType: movement.movementType,
    quantity: movement.quantity,
    unit: movement.unit,
    quantityInBaseUnit: movement.quantityInBaseUnit,
    balanceBefore: movement.balanceBefore,
    balanceAfter: movement.balanceAfter,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    transferId,
    reason: movement.reason,
    notes: movement.notes,
    cost: movement.cost,
    totalCost: movement.totalCost,
    performedBy,
    performedByName: performedByInfo?.name,
    performedAt: movement.performedAt
  };
};

/**
 * Function สำหรับแปลง IStockTransfer เป็น StockTransferResponse
 */
export const toStockTransferResponse = (
  transfer: IStockTransfer | IStockTransferDocument,
  productInfo?: { name?: string; sku?: string },
  fromBranchInfo?: { name?: string },
  toBranchInfo?: { name?: string },
  requestedByInfo?: { name?: string },
  approvedByInfo?: { name?: string },
  sentByInfo?: { name?: string },
  receivedByInfo?: { name?: string }
): StockTransferResponse => {
  const id = typeof transfer._id === 'string' ? transfer._id : transfer._id.toString();
  const productId = typeof transfer.productId === 'string' ? transfer.productId : transfer.productId.toString();
  const fromBranchId = typeof transfer.fromBranchId === 'string' ? transfer.fromBranchId : transfer.fromBranchId.toString();
  const toBranchId = typeof transfer.toBranchId === 'string' ? transfer.toBranchId : transfer.toBranchId.toString();
  const requestedBy = typeof transfer.requestedBy === 'string' ? transfer.requestedBy : transfer.requestedBy.toString();
  const approvedBy = transfer.approvedBy ? 
    (typeof transfer.approvedBy === 'string' ? transfer.approvedBy : transfer.approvedBy.toString()) : 
    undefined;
  const sentBy = transfer.sentBy ? 
    (typeof transfer.sentBy === 'string' ? transfer.sentBy : transfer.sentBy.toString()) : 
    undefined;
  const receivedBy = transfer.receivedBy ? 
    (typeof transfer.receivedBy === 'string' ? transfer.receivedBy : transfer.receivedBy.toString()) : 
    undefined;

  return {
    id,
    transferNumber: transfer.transferNumber,
    productId,
    productName: productInfo?.name,
    productSku: productInfo?.sku,
    fromBranchId,
    fromBranchName: fromBranchInfo?.name,
    toBranchId,
    toBranchName: toBranchInfo?.name,
    quantity: transfer.quantity,
    unit: transfer.unit,
    quantityInBaseUnit: transfer.quantityInBaseUnit,
    status: transfer.status,
    requestedBy,
    requestedByName: requestedByInfo?.name,
    requestedAt: transfer.requestedAt,
    approvedBy,
    approvedByName: approvedByInfo?.name,
    approvedAt: transfer.approvedAt,
    sentBy,
    sentByName: sentByInfo?.name,
    sentAt: transfer.sentAt,
    receivedBy,
    receivedByName: receivedByInfo?.name,
    receivedAt: transfer.receivedAt,
    notes: transfer.notes,
    reason: transfer.reason
  };
};