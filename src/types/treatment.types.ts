import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';

/**
 * ประเภทค่าธรรมเนียม (เปอร์เซ็นต์ หรือ จำนวนเงินคงที่)
 */
export enum FeeType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

/**
 * Interface สำหรับค่าธรรมเนียม
 */
export interface IFee {
  amount: number;
  type: FeeType;
}

/**
 * Treatment attributes interface
 */
export interface ITreatmentAttributes {
  name: string;
  price: number;
  includeVat: boolean;
  doctorFee?: IFee;
  assistantFee?: IFee;
  clinicId: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Treatment
 */
export interface ITreatment extends ITreatmentAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Treatment เมื่อเก็บใน MongoDB
 */
export interface ITreatmentDocument extends Document, ITreatmentAttributes {
  _id: Types.ObjectId;
  calculateDoctorFee(): number;
  calculateAssistantFee(): number;
  calculateTotalPrice(): number;
  calculateVatAmount(): number;
  calculatePriceExcludingVat(): number;
}

/**
 * Interface สำหรับ Treatment Model static methods
 */
export interface ITreatmentModel extends mongoose.Model<ITreatmentDocument> {
  findByClinic(clinicId: string): Promise<ITreatmentDocument[]>;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Treatment ใหม่
 */
export interface CreateTreatmentInput {
  name: string;
  price: number;
  includeVat?: boolean;
  doctorFee?: IFee;
  assistantFee?: IFee;
  clinicId: string;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Treatment
 */
export interface UpdateTreatmentInput {
  name?: string;
  price?: number;
  includeVat?: boolean;
  doctorFee?: IFee;
  assistantFee?: IFee;
}

/**
 * Interface สำหรับ Treatment response
 */
export interface TreatmentResponse {
  id: string;
  name: string;
  price: number;
  includeVat: boolean;
  doctorFee?: IFee;
  assistantFee?: IFee;
  clinicId: string;
  clinicName?: string;
  // Calculated fields
  calculations?: {
    doctorFeeAmount: number;
    assistantFeeAmount: number;
    vatAmount: number;
    priceExcludingVat: number;
    totalPrice: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง ITreatment หรือ ITreatmentDocument เป็น TreatmentResponse
 */
export const toTreatmentResponse = (treatment: ITreatment | ITreatmentDocument, includeCalculations = false): TreatmentResponse => {
  const id = typeof treatment._id === 'string' ? treatment._id : treatment._id.toString();
  const clinicId = typeof treatment.clinicId === 'string' ? treatment.clinicId : treatment.clinicId.toString();
  const clinicName = treatment.clinicId && typeof treatment.clinicId !== 'string' && 'name' in treatment.clinicId 
    ? treatment.clinicId.name as string
    : undefined;
  
  const response: TreatmentResponse = {
    id,
    name: treatment.name,
    price: treatment.price,
    includeVat: treatment.includeVat,
    doctorFee: treatment.doctorFee,
    assistantFee: treatment.assistantFee,
    clinicId,
    clinicName,
    createdAt: treatment.createdAt,
    updatedAt: treatment.updatedAt
  };

  // เพิ่มการคำนวณถ้าเป็น Document และต้องการ
  if (includeCalculations && 'calculateDoctorFee' in treatment) {
    response.calculations = {
      doctorFeeAmount: treatment.calculateDoctorFee(),
      assistantFeeAmount: treatment.calculateAssistantFee(),
      vatAmount: treatment.calculateVatAmount(),
      priceExcludingVat: treatment.calculatePriceExcludingVat(),
      totalPrice: treatment.calculateTotalPrice()
    };
  }
  
  return response;
};