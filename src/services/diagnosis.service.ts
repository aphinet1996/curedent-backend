import { FilterQuery } from 'mongoose';
import Diagnosis from '../models/diagnosis.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IDiagnosisDocument,
  CreateDiagnosisInput,
  UpdateDiagnosisInput,
} from '../types/diagnosis.types';

export class DiagnosisService {
  /**
   * ค้นหาการวินิจฉัยโดยใช้ ID
   */
  async findById(id: string): Promise<IDiagnosisDocument | null> {
    try {
      return await Diagnosis.findById(id);
    } catch (error) {
      logger.error(`Error finding diagnosis by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูลการวินิจฉัยทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IDiagnosisDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ diagnoses: IDiagnosisDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const diagnoses = await Diagnosis.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      const total = await Diagnosis.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        diagnoses,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all diagnoses: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการวินิจฉัย', 500);
    }
  }

  /**
   * สร้างการวินิจฉัยใหม่
   */
  async createDiagnosis(diagnosisData: CreateDiagnosisInput): Promise<IDiagnosisDocument> {
    try {
      // ตรวจสอบว่ามีการวินิจฉัยในคลินิกที่มีชื่อเดียวกันหรือไม่
      const existingDiagnosis = await Diagnosis.findOne({
        name: diagnosisData.name,
        clinicId: diagnosisData.clinicId
      });

      if (existingDiagnosis) {
        throw new AppError('มีการวินิจฉัยชื่อนี้ในคลินิกนี้แล้ว', 400);
      }

      // สร้างการวินิจฉัยใหม่
      const newDiagnosis = await Diagnosis.create(diagnosisData);

      return newDiagnosis;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating diagnosis: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างการวินิจฉัย', 500);
    }
  }

  /**
   * อัปเดตข้อมูลการวินิจฉัย
   */
  async updateDiagnosis(
    diagnosisId: string,
    updateData: UpdateDiagnosisInput
  ): Promise<IDiagnosisDocument | null> {
    try {
      // ตรวจสอบว่ามีการวินิจฉัยนี้หรือไม่
      const diagnosis = await this.findById(diagnosisId);
      if (!diagnosis) {
        throw new AppError('ไม่พบการวินิจฉัยนี้', 404);
      }

      // ตรวจสอบว่ามีการวินิจฉัยในคลินิกที่มีชื่อเดียวกันหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
      if (updateData.name && updateData.name !== diagnosis.name) {
        const existingDiagnosis = await Diagnosis.findOne({
          name: updateData.name,
          clinicId: diagnosis.clinicId,
          _id: { $ne: diagnosisId } // ไม่รวมการวินิจฉัยปัจจุบัน
        });

        if (existingDiagnosis) {
          throw new AppError('มีการวินิจฉัยชื่อนี้ในคลินิกนี้แล้ว', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedDiagnosis = await Diagnosis.findByIdAndUpdate(
        diagnosisId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return updatedDiagnosis;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating diagnosis: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตการวินิจฉัย', 500);
    }
  }

  /**
   * ลบการวินิจฉัย
   */
  async deleteDiagnosis(diagnosisId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามีการวินิจฉัยนี้หรือไม่
      const diagnosis = await this.findById(diagnosisId);
      if (!diagnosis) {
        throw new AppError('ไม่พบการวินิจฉัยนี้', 404);
      }

      // ลบการวินิจฉัย
      await Diagnosis.findByIdAndDelete(diagnosisId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting diagnosis: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบการวินิจฉัย', 500);
    }
  }
}

export default DiagnosisService;