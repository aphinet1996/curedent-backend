import { Document, Types } from 'mongoose';

/**
 * สถานะของการชำระเงิน
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

/**
 * ประเภทการชำระเงิน
 */
export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  QR_CODE = 'qr_code',
  INSTALLMENT = 'installment'
}

/**
 * รายการบริการ/การรักษา
 */
export interface IServiceItem {
  serviceId: Types.ObjectId | string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  doctorId?: Types.ObjectId | string;
  notes?: string;
}

/**
 * Payment attributes interface
 */
export interface IPaymentAttributes {
  paymentNumber: string; // เลขที่ใบเสร็จ (auto generate)
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  clinicId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  doctorId?: Types.ObjectId | string;
  services: IServiceItem[];
  subtotal: number; // ยอดรวมก่อนส่วนลด
  discount: number; // ส่วนลด
  tax: number; // ภาษี
  total: number; // ยอดรวมสุดท้าย
  paidAmount: number; // ยอดที่ชำระแล้ว
  remainingAmount: number; // ยอดคงเหลือ
  status: PaymentStatus;
  dueDate?: Date; // วันครบกำหนดชำระ (สำหรับผ่อน)
  notes?: string;
  createdBy: Types.ObjectId | string; // ผู้สร้างบิล
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Payment
 */
export interface IPayment extends IPaymentAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Payment เมื่อเก็บใน MongoDB
 */
export interface IPaymentDocument extends Document, IPaymentAttributes {
  _id: Types.ObjectId;
}

/**
 * Payment Transaction attributes interface
 */
export interface IPaymentTransactionAttributes {
  paymentId: Types.ObjectId | string;
  transactionNumber: string; // เลขที่ธุรกรรม (auto generate)
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string; // เลขอ้างอิง (เช่น slip number, card transaction id)
  notes?: string;
  processedBy: Types.ObjectId | string; // ผู้ดำเนินการ
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Payment Transaction
 */
export interface IPaymentTransaction extends IPaymentTransactionAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Payment Transaction เมื่อเก็บใน MongoDB
 */
export interface IPaymentTransactionDocument extends Document, IPaymentTransactionAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับสร้าง Payment ใหม่
 */
export interface CreatePaymentInput {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  clinicId: string;
  branchId: string;
  doctorId?: string;
  services: IServiceItem[];
  discount?: number;
  tax?: number;
  dueDate?: Date | string;
  notes?: string;
}

/**
 * Interface สำหรับอัปเดต Payment
 */
export interface UpdatePaymentInput {
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  services?: IServiceItem[];
  discount?: number;
  tax?: number;
  dueDate?: Date | string;
  notes?: string;
}

/**
 * Interface สำหรับสร้าง Payment Transaction
 */
export interface CreatePaymentTransactionInput {
  paymentId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  processedAt?: Date | string;
}

/**
 * Interface สำหรับ Payment response
 */
export interface PaymentResponse {
  id: string;
  paymentNumber: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  clinicId: string;
  clinicName?: string;
  branchId: string;
  branchName?: string;
  doctorId?: string;
  doctorName?: string;
  services: IServiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  dueDate?: Date;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  transactions?: PaymentTransactionResponse[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface สำหรับ Payment Transaction response
 */
export interface PaymentTransactionResponse {
  id: string;
  paymentId: string;
  transactionNumber: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  processedBy: string;
  processedByName?: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IPayment เป็น PaymentResponse
 */
export const toPaymentResponse = (payment: IPayment | IPaymentDocument, transactions?: IPaymentTransaction[]): PaymentResponse => {
  const id = typeof payment._id === 'string' ? payment._id : payment._id.toString();
  
  // Helper functions สำหรับ populated data
  const getPopulatedData = (obj: any) => {
    if (typeof obj === 'string') return { id: obj, name: undefined };
    if (obj && obj._id) return { id: obj._id.toString(), name: obj.name };
    return { id: obj?.toString() || '', name: undefined };
  };

  const clinic = getPopulatedData(payment.clinicId);
  const branch = getPopulatedData(payment.branchId);
  const doctor = getPopulatedData(payment.doctorId);
  const createdBy = getPopulatedData(payment.createdBy);

  return {
    id,
    paymentNumber: payment.paymentNumber,
    patientName: payment.patientName,
    patientPhone: payment.patientPhone,
    patientEmail: payment.patientEmail,
    clinicId: clinic.id,
    clinicName: clinic.name,
    branchId: branch.id,
    branchName: branch.name,
    doctorId: doctor.id,
    doctorName: doctor.name,
    services: payment.services,
    subtotal: payment.subtotal,
    discount: payment.discount,
    tax: payment.tax,
    total: payment.total,
    paidAmount: payment.paidAmount,
    remainingAmount: payment.remainingAmount,
    status: payment.status,
    dueDate: payment.dueDate,
    notes: payment.notes,
    createdBy: createdBy.id,
    createdByName: createdBy.name,
    transactions: transactions?.map(t => toPaymentTransactionResponse(t)),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  };
};

/**
 * Function สำหรับแปลง IPaymentTransaction เป็น PaymentTransactionResponse
 */
export const toPaymentTransactionResponse = (transaction: IPaymentTransaction | IPaymentTransactionDocument): PaymentTransactionResponse => {
  const id = typeof transaction._id === 'string' ? transaction._id : transaction._id.toString();
  const paymentId = typeof transaction.paymentId === 'string' ? transaction.paymentId : transaction.paymentId.toString();
  
  const getPopulatedData = (obj: any) => {
    if (typeof obj === 'string') return { id: obj, name: undefined };
    if (obj && obj._id) return { id: obj._id.toString(), name: obj.name };
    return { id: obj?.toString() || '', name: undefined };
  };

  const processedBy = getPopulatedData(transaction.processedBy);

  return {
    id,
    paymentId,
    transactionNumber: transaction.transactionNumber,
    amount: transaction.amount,
    method: transaction.method,
    referenceNumber: transaction.referenceNumber,
    notes: transaction.notes,
    processedBy: processedBy.id,
    processedByName: processedBy.name,
    processedAt: transaction.processedAt,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
};