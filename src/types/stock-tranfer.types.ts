import { Types } from 'mongoose';

/**
 * สถานะของการโอนย้าย Stock
 */
export enum TransferStatus {
  DRAFT = 'draft',           // ร่าง
  PENDING = 'pending',       // รออนุมัติ
  APPROVED = 'approved',     // อนุมัติแล้ว
  IN_TRANSIT = 'in_transit', // กำลังขนส่ง
  COMPLETED = 'completed',   // เสร็จสิ้น
  CANCELLED = 'cancelled'    // ยกเลิก
}

/**
 * รายการสินค้าที่โอน
 */
export interface ITransferItem {
  productId: Types.ObjectId | string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  quantityInBaseUnit: number;
  notes?: string;
}

/**
 * Stock Transfer attributes interface
 */
export interface IStockTransferAttributes {
  transferNumber: string;
  fromBranchId: Types.ObjectId | string;
  toBranchId: Types.ObjectId | string;
  items: ITransferItem[];
  status: TransferStatus;
  requestedBy: Types.ObjectId | string;
  requestedAt: Date;
  approvedBy?: Types.ObjectId | string;
  approvedAt?: Date;
  transferredBy?: Types.ObjectId | string;
  transferredAt?: Date;
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
}

/**
 * Interface สำหรับสร้าง Stock Transfer
 */
export interface CreateStockTransferInput {
  fromBranchId: string;
  toBranchId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  reason: string;
  notes?: string;
}

/**
 * Interface สำหรับ Stock Reservation (จองสินค้า)
 */
export interface IStockReservationAttributes {
  productId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  quantity: number;
  referenceType: string; // เช่น 'payment', 'transfer'
  referenceId: string;
  reservedBy: Types.ObjectId | string;
  reservedAt: Date;
  expiresAt: Date; // วันหมดอายุการจอง
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  fulfilledAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Stock Reservation
 */
export interface IStockReservation extends IStockReservationAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Stock Reservation เมื่อเก็บใน MongoDB
 */
export interface IStockReservationDocument extends Document, IStockReservationAttributes {
  _id: Types.ObjectId;
}