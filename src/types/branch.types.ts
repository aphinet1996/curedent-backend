import { Document, Types } from 'mongoose';
import mongoose from 'mongoose';

/**
 * สถานะของสาขา
 */
export enum BranchStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Branch attributes interface
 */
export interface IBranchAttributes {
  name: string;
  photo?: string;
  tel: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
  clinicId: Types.ObjectId | string;
  linkMap?: string;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Branch
 */
export interface IBranch extends IBranchAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Branch Model static methods
 */
export interface IBranchModel extends mongoose.Model<IBranchDocument> {
  findByClinic(clinicId: string): Promise<IBranchDocument[]>;
}

/**
 * Interface สำหรับ Branch เมื่อเก็บใน MongoDB
 */
export interface IBranchDocument extends Document, IBranchAttributes {
  _id: Types.ObjectId;
  fullAddress: string; // Virtual property
  // Helper methods สำหรับดึงข้อมูลจาก Room module
  getRoomsCount(): Promise<number>;
  getActiveRoomsCount(): Promise<number>;
  getRoomsByType(roomTypeId: string): Promise<any[]>;
  getAvailableRooms(): Promise<any[]>;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้างสาขาใหม่
 */
export interface CreateBranchInput {
  name: string;
  photo?: string;
  tel: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
  clinicId: string;
  linkMap?: string;
  status?: BranchStatus;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดตสาขา
 */
export interface UpdateBranchInput {
  name?: string;
  photo?: string;
  tel?: string;
  address?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zipcode?: string;
  linkMap?: string;
}

/**
 * Interface สำหรับการอัปเดตสถานะ
 */
export interface UpdateBranchStatusInput {
  status: BranchStatus;
}

/**
 * Interface สำหรับ Branch response
 */
export interface BranchResponse {
  id: string;
  name: string;
  photo?: string;
  tel: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
  clinicId: string;
  clinicName?: string;
  linkMap?: string;
  status: BranchStatus;
  fullAddress: string;
  // Optional room summary (ต้อง populate แยก)
  roomsSummary?: {
    totalRooms: number;
    activeRooms: number;
    availableRooms: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IBranch หรือ IBranchDocument เป็น BranchResponse
 */
export const toBranchResponse = (branch: IBranch | IBranchDocument, roomsSummary?: any): BranchResponse => {
  const id = typeof branch._id === 'string' ? branch._id : branch._id.toString();
  const clinicId = typeof branch.clinicId === 'string' ? branch.clinicId : branch.clinicId.toString();
  const clinicName = branch.clinicId && typeof branch.clinicId !== 'string' && 'name' in branch.clinicId 
    ? branch.clinicId.name as string
    : undefined;

  return {
    id,
    name: branch.name,
    photo: branch.photo,
    tel: branch.tel,
    address: branch.address,
    subdistrict: branch.subdistrict,
    district: branch.district,
    province: branch.province,
    zipcode: branch.zipcode,
    clinicId,
    clinicName,
    linkMap: branch.linkMap,
    status: branch.status,
    fullAddress: 'fullAddress' in branch 
      ? branch.fullAddress 
      : `${branch.address} ${branch.subdistrict} ${branch.district} ${branch.province} ${branch.zipcode}`,
    roomsSummary,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt
  };
};