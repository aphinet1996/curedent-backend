// services/clinic.service.ts
import { FilterQuery } from 'mongoose';
import Clinic from '../models/clinic.model';
import User from '../models/user.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IClinicDocument,
  CreateClinicInput,
  UpdateClinicInput,
  UpdateClinicStatusInput,
  ClinicStatus,
} from '../types/clinic.types';
import { UserRole } from '../types/user.types';

export class ClinicService {
  /**
   * ค้นหาคลินิกโดยใช้ ID
   */
  async findById(id: string): Promise<IClinicDocument | null> {
    try {
      return await Clinic.findById(id);
    } catch (error) {
      logger.error(`Error finding clinic by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูลคลินิกทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IClinicDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ clinics: IClinicDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const clinics = await Clinic.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      const total = await Clinic.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        clinics,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all clinics: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลคลินิก', 500);
    }
  }

  /**
   * สร้างคลินิกใหม่
   */
  async createClinic(clinicData: CreateClinicInput): Promise<IClinicDocument> {
    try {
      // ตรวจสอบว่ามีคลินิกชื่อนี้แล้วหรือไม่
      const existingClinic = await Clinic.findOne({ name: clinicData.name });
      if (existingClinic) {
        throw new AppError('มีคลินิกชื่อนี้แล้ว', 400);
      }

      // สร้างคลินิกใหม่
      const newClinic = await Clinic.create({
        ...clinicData,
        status: clinicData.status || ClinicStatus.ACTIVE,
      });

      return newClinic;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating clinic: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างคลินิก', 500);
    }
  }

  /**
   * อัปเดตข้อมูลคลินิก
   */
  async updateClinic(
    clinicId: string,
    updateData: UpdateClinicInput
  ): Promise<IClinicDocument | null> {
    try {
      // ตรวจสอบว่ามีคลินิกนี้หรือไม่
      const clinic = await this.findById(clinicId);
      if (!clinic) {
        throw new AppError('ไม่พบคลินิกนี้', 404);
      }

      // ตรวจสอบว่ามีคลินิกชื่อนี้แล้วหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
      if (updateData.name && updateData.name !== clinic.name) {
        const existingClinic = await Clinic.findOne({ 
          name: updateData.name,
          _id: { $ne: clinicId } // ไม่รวมคลินิกปัจจุบัน
        });

        if (existingClinic) {
          throw new AppError('มีคลินิกชื่อนี้แล้ว', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return updatedClinic;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating clinic: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตคลินิก', 500);
    }
  }

  /**
   * อัปเดตสถานะของคลินิก
   */
  async updateClinicStatus(
    clinicId: string,
    { status }: UpdateClinicStatusInput
  ): Promise<IClinicDocument | null> {
    try {
      // ตรวจสอบว่ามีคลินิกนี้หรือไม่
      const clinic = await this.findById(clinicId);
      if (!clinic) {
        throw new AppError('ไม่พบคลินิกนี้', 404);
      }

      // อัปเดตสถานะ
      const updatedClinic = await Clinic.findByIdAndUpdate(
        clinicId,
        { $set: { status } },
        { new: true }
      );

      return updatedClinic;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating clinic status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะคลินิก', 500);
    }
  }

  /**
   * สร้างผู้ใช้สำหรับคลินิก (owner หรือ admin)
   */
  async createClinicUser(clinicId: string, userData: any, role: UserRole.OWNER | UserRole.ADMIN): Promise<any> {
    try {
      // ตรวจสอบว่ามีคลินิกนี้หรือไม่
      const clinic = await this.findById(clinicId);
      if (!clinic) {
        throw new AppError('ไม่พบคลินิกนี้', 404);
      }

      // เพิ่มข้อมูลคลินิกและสิทธิ์
      userData.clinicId = clinicId;
      userData.roles = [role];

      // สร้างผู้ใช้ (ใช้ UserService จริงๆ แต่เพื่อเป็นตัวอย่าง)
      const newUser = await User.create(userData);

      return newUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating clinic user: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างผู้ใช้สำหรับคลินิก', 500);
    }
  }
}

export default ClinicService;