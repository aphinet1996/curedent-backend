import { Document, Types } from 'mongoose';

/**
 * สถานะของคลินิก
 */
export enum ClinicStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Clinic attributes interface
 */
export interface IClinicAttributes {
  name: string;
  contactEmail: string;
  contactPhone: string;
  taxId?: string;
  status: ClinicStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Clinic
 */
export interface IClinic extends IClinicAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Clinic เมื่อเก็บในฐานข้อมูล MongoDB
 */
export interface IClinicDocument extends Document, IClinicAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้างคลินิกใหม่
 */
export interface CreateClinicInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
  taxId?: string;
  status?: ClinicStatus;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดตคลินิก
 */
export interface UpdateClinicInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  taxId?: string;
}

/**
 * Interface สำหรับการอัปเดตสถานะคลินิก
 */
export interface UpdateClinicStatusInput {
  status: ClinicStatus;
}

/**
 * Interface สำหรับ Clinic response
 */
export interface ClinicResponse {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  taxId?: string;
  status: ClinicStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IClinic หรือ IClinicDocument เป็น ClinicResponse
 */
export const toClinicResponse = (clinic: IClinic | IClinicDocument): ClinicResponse => {
  return {
    id: clinic._id.toString(),
    name: clinic.name,
    contactEmail: clinic.contactEmail,
    contactPhone: clinic.contactPhone,
    taxId: clinic.taxId,
    status: clinic.status,
    createdAt: clinic.createdAt,
    updatedAt: clinic.updatedAt
  };
};