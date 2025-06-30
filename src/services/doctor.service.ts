import { FilterQuery } from 'mongoose';
import Doctor from '../models/doctor.model';
import Branch from '../models/branch.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IDoctorDocument,
  CreateDoctorInput,
  UpdateDoctorInput,
} from '../types/doctor.types';

export class DoctorService {
  /**
   * ค้นหาหมอโดยใช้ ID
   */
  async findById(id: string): Promise<IDoctorDocument | null> {
    try {
      return await Doctor.findById(id)
        .populate('clinicId', 'name')
        .populate('branches.branchId', 'name');
    } catch (error) {
      logger.error(`Error finding doctor by ID: ${error}`);
      return null;
    }
  }

  async findAllLean(
    filter: FilterQuery<IDoctorDocument> = { isActive: true },
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ doctors: IDoctorDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const doctors = await Doctor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await Doctor.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);
      return { doctors, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding all doctors lean: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลหมอ', 500);
    }
  }

  /**
   * ดึงข้อมูลหมอทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IDoctorDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ doctors: IDoctorDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const doctors = await Doctor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      const total = await Doctor.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        doctors,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all doctors: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลหมอ', 500);
    }
  }

  /**
   * ตรวจสอบความซ้ำของสีในคลินิกเดียวกัน
   */
  async checkColorUnique(clinicId: string, color: string, excludeDoctorId?: string): Promise<boolean> {
    try {
      const query: any = {
        clinicId,
        color,
        isActive: true
      };

      if (excludeDoctorId) {
        query._id = { $ne: excludeDoctorId };
      }

      const existingDoctor = await Doctor.findOne(query);
      return !existingDoctor; // return true ถ้าไม่มีหมอที่ใช้สีนี้แล้ว
    } catch (error) {
      logger.error(`Error checking color uniqueness: ${error}`);
      return false;
    }
  }

  /**
   * สร้างหมอใหม่
   */
  async createDoctor(doctorData: CreateDoctorInput): Promise<IDoctorDocument> {
    try {
      // แปลง birthday เป็น Date ถ้าเป็น string
      if (doctorData.birthday && typeof doctorData.birthday === 'string') {
        doctorData.birthday = new Date(doctorData.birthday);
      }

      // ตรวจสอบความซ้ำของสีในคลินิกเดียวกัน (optional - ถ้าต้องการให้สีไม่ซ้ำกัน)
      // const isColorUnique = await this.checkColorUnique(doctorData.clinicId, doctorData.color);
      // if (!isColorUnique) {
      //   throw new AppError('สีนี้ถูกใช้โดยหมอคนอื่นในคลินิกเดียวกันแล้ว', 400);
      // }

      if (doctorData.branches && doctorData.branches.length > 0) {
        const branchIds = doctorData.branches.map(branch => branch.branchId);
        const existingBranches = await Branch.find({ _id: { $in: branchIds } });

        if (existingBranches.length !== branchIds.length) {
          throw new AppError('สาขาที่ระบุไม่มีอยู่ในระบบ', 400);
        }
      }

      // สร้างหมอใหม่
      const newDoctor = await Doctor.create({
        ...doctorData,
        isActive: doctorData.isActive !== undefined ? doctorData.isActive : true,
      });

      // ดึงข้อมูลพร้อม populate
      const doctor = await this.findById(newDoctor._id.toString());
      return doctor!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating doctor: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูลหมอ', 500);
    }
  }

  /**
   * อัปเดตข้อมูลหมอ
   */
  async updateDoctor(
    doctorId: string,
    updateData: UpdateDoctorInput
  ): Promise<IDoctorDocument | null> {
    try {
      // ตรวจสอบว่ามีหมอนี้หรือไม่
      const doctor = await this.findById(doctorId);
      if (!doctor) {
        throw new AppError('ไม่พบข้อมูลหมอนี้', 404);
      }

      // แปลง birthday เป็น Date ถ้าเป็น string
      if (updateData.birthday && typeof updateData.birthday === 'string') {
        updateData.birthday = new Date(updateData.birthday);
      }

      // ตรวจสอบความซ้ำของสีในคลินิกเดียวกัน (ถ้ามีการเปลี่ยนสี)
      // if (updateData.color && updateData.color !== doctor.color) {
      //   const isColorUnique = await this.checkColorUnique(
      //     doctor.clinicId.toString(),
      //     updateData.color,
      //     doctorId
      //   );
      //   if (!isColorUnique) {
      //     throw new AppError('สีนี้ถูกใช้โดยหมอคนอื่นในคลินิกเดียวกันแล้ว', 400);
      //   }
      // }

      if (updateData.branches && updateData.branches.length > 0) {
        const branchIds = updateData.branches.map(branch => branch.branchId);
        const existingBranches = await Branch.find({ _id: { $in: branchIds } });

        if (existingBranches.length !== branchIds.length) {
          throw new AppError('มีสาขาที่ระบุไม่มีอยู่ในระบบ', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      return updatedDoctor;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating doctor: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตข้อมูลหมอ', 500);
    }
  }

  /**
   * อัปเดตสีของหมอ
   */
  async updateDoctorColor(doctorId: string, color: string): Promise<IDoctorDocument | null> {
    try {
      const doctor = await this.findById(doctorId);
      if (!doctor) {
        throw new AppError('ไม่พบข้อมูลหมอนี้', 404);
      }

      // ตรวจสอบความซ้ำของสีในคลินิกเดียวกัน (optional)
      // const isColorUnique = await this.checkColorUnique(
      //   doctor.clinicId.toString(),
      //   color,
      //   doctorId
      // );
      // if (!isColorUnique) {
      //   throw new AppError('สีนี้ถูกใช้โดยหมอคนอื่นในคลินิกเดียวกันแล้ว', 400);
      // }

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { $set: { color } },
        { new: true }
      ).populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      return updatedDoctor;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating doctor color: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสีหมอ', 500);
    }
  }

  /**
   * ลบหมอ
   */
  async deleteDoctor(doctorId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามีหมอนี้หรือไม่
      const doctor = await this.findById(doctorId);
      if (!doctor) {
        throw new AppError('ไม่พบข้อมูลหมอนี้', 404);
      }

      // ลบหมอ (หรืออาจจะเปลี่ยนเป็น soft delete โดยเซ็ต isActive = false)
      await Doctor.findByIdAndDelete(doctorId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting doctor: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูลหมอ', 500);
    }
  }

  /**
   * อัปเดตสถานะหมอ
   */
  async updateDoctorStatus(doctorId: string, isActive: boolean): Promise<IDoctorDocument | null> {
    try {
      const doctor = await this.findById(doctorId);
      if (!doctor) {
        throw new AppError('ไม่พบข้อมูลหมอนี้', 404);
      }

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        doctorId,
        { $set: { isActive } },
        { new: true }
      ).populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      return updatedDoctor;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating doctor status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะหมอ', 500);
    }
  }

  /**
   * ดึงสีที่ใช้แล้วในคลินิก (สำหรับใช้ในการแนะนำสีที่ยังไม่ถูกใช้)
   */
  async getUsedColorsInClinic(clinicId: string): Promise<string[]> {
    try {
      const doctors = await Doctor.find(
        { clinicId, isActive: true },
        { color: 1, _id: 0 }
      ).distinct('color');
      
      return doctors;
    } catch (error) {
      logger.error(`Error getting used colors in clinic: ${error}`);
      return [];
    }
  }

  /**
   * สุ่มสีที่ยังไม่ถูกใช้ในคลินิก
   */
  async getAvailableColorForClinic(clinicId: string): Promise<string> {
    try {
      const usedColors = await this.getUsedColorsInClinic(clinicId);
      
      // สีที่แนะนำ (สามารถเพิ่มเติมได้)
      const recommendedColors = [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#8B5CF6', // Purple
        '#F97316', // Orange
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F43F5E', // Rose
        '#A855F7', // Violet
        '#22C55E', // Emerald
        '#EAB308', // Amber
        '#64748B', // Slate
        '#78716C', // Stone
        '#DC2626', // Red 600
        '#059669', // Emerald 600
        '#7C3AED'  // Violet 600
      ];

      // หาสีที่ยังไม่ถูกใช้
      const availableColors = recommendedColors.filter(color => !usedColors.includes(color));
      
      if (availableColors.length > 0) {
        // สุ่มสีจากสีที่ยังไม่ถูกใช้
        return availableColors[Math.floor(Math.random() * availableColors.length)];
      } else {
        // ถ้าใช้หมดแล้ว ให้สุ่มสีใหม่
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        return randomColor.toUpperCase();
      }
    } catch (error) {
      logger.error(`Error getting available color for clinic: ${error}`);
      return '#3B82F6'; // default color
    }
  }
}

export default DoctorService;