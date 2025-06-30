import { Document, Types } from 'mongoose';

/**
 * Diagnosis attributes interface
 */
export interface IDiagnosisAttributes {
  name: string;
  clinicId: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Diagnosis
 */
export interface IDiagnosis extends IDiagnosisAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Diagnosis เมื่อเก็บใน MongoDB
 */
export interface IDiagnosisDocument extends Document, IDiagnosisAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Diagnosis ใหม่
 */
export interface CreateDiagnosisInput {
  name: string;
  clinicId: string;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Diagnosis
 */
export interface UpdateDiagnosisInput {
  name?: string;
}

/**
 * Interface สำหรับ Diagnosis response
 */
export interface DiagnosisResponse {
  id: string;
  name: string;
  clinicId: string;
  clinicName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IDiagnosis หรือ IDiagnosisDocument เป็น DiagnosisResponse
 */
export const toDiagnosisResponse = (diagnosis: IDiagnosis | IDiagnosisDocument): DiagnosisResponse => {
  const id = typeof diagnosis._id === 'string' ? diagnosis._id : diagnosis._id.toString();
  const clinicId = typeof diagnosis.clinicId === 'string' ? diagnosis.clinicId : diagnosis.clinicId.toString();
  const clinicName = diagnosis.clinicId && typeof diagnosis.clinicId !== 'string' && 'name' in diagnosis.clinicId 
    ? diagnosis.clinicId.name as string
    : undefined;
  
  return {
    id,
    name: diagnosis.name,
    clinicId,
    clinicName,
    createdAt: diagnosis.createdAt,
    updatedAt: diagnosis.updatedAt
  };
};