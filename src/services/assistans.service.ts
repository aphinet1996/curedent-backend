import { FilterQuery } from 'mongoose';
import Assistant from '../models/assistant.model';
import Branch from '../models/branch.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IAssistantDocument,
  CreateAssistantInput,
  UpdateAssistantInput,
} from '../types/assistant.types';

export class AssistantService {
  /**
   * ค้นหา assistant โดยใช้ ID
   */
  async findById(id: string): Promise<IAssistantDocument | null> {
    try {
      return await Assistant.findById(id)
        .populate('clinicId', 'name')
        .populate('branches.branchId', 'name');
    } catch (error) {
      logger.error(`Error finding assistant by ID: ${error}`);
      return null;
    }
  }

  async findAllLean(
    filter: FilterQuery<IAssistantDocument> = { isActive: true },
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ assistants: IAssistantDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const assistants = await Assistant.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await Assistant.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);
      return { assistants, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding all assistants lean: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล assistant', 500);
    }
  }

  /**
   * ดึงข้อมูล assistant ทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IAssistantDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ assistants: IAssistantDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const assistants = await Assistant.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      const total = await Assistant.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        assistants,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all assistants: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล assistant', 500);
    }
  }

  /**
   * สร้าง assistant ใหม่
   */
  async createAssistant(assistantData: CreateAssistantInput): Promise<IAssistantDocument> {
    try {
      // แปลง birthday เป็น Date ถ้าเป็น string
      if (assistantData.birthday && typeof assistantData.birthday === 'string') {
        assistantData.birthday = new Date(assistantData.birthday);
      }

      if (assistantData.branches && assistantData.branches.length > 0) {
        const branchIds = assistantData.branches.map(branch => branch.branchId);
        const existingBranches = await Branch.find({ _id: { $in: branchIds } });

        if (existingBranches.length !== branchIds.length) {
          throw new AppError('สาขาที่ระบุไม่มีอยู่ในระบบ', 400);
        }
      }

      // สร้าง assistant ใหม่
      const newAssistant = await Assistant.create({
        ...assistantData,
        isActive: assistantData.isActive !== undefined ? assistantData.isActive : true,
      });

      // ดึงข้อมูลพร้อม populate
      const assistant = await this.findById(newAssistant._id.toString());
      return assistant!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating assistant: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูล assistant', 500);
    }
  }

  /**
   * อัปเดตข้อมูล assistant
   */
  async updateAssistant(
    assistantId: string,
    updateData: UpdateAssistantInput
  ): Promise<IAssistantDocument | null> {
    try {
      // ตรวจสอบว่ามี assistant นี้หรือไม่
      const assistant = await this.findById(assistantId);
      if (!assistant) {
        throw new AppError('ไม่พบข้อมูล assistant นี้', 404);
      }

      // แปลง birthday เป็น Date ถ้าเป็น string
      if (updateData.birthday && typeof updateData.birthday === 'string') {
        updateData.birthday = new Date(updateData.birthday);
      }

      if (updateData.branches && updateData.branches.length > 0) {
        const branchIds = updateData.branches.map(branch => branch.branchId);
        const existingBranches = await Branch.find({ _id: { $in: branchIds } });

        if (existingBranches.length !== branchIds.length) {
          throw new AppError('มีสาขาที่ระบุไม่มีอยู่ในระบบ', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedAssistant = await Assistant.findByIdAndUpdate(
        assistantId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      return updatedAssistant;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating assistant: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล assistant', 500);
    }
  }

  /**
   * ลบ assistant
   */
  async deleteAssistant(assistantId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามี assistant นี้หรือไม่
      const assistant = await this.findById(assistantId);
      if (!assistant) {
        throw new AppError('ไม่พบข้อมูล assistant นี้', 404);
      }

      // ลบ assistant (หรืออาจจะเปลี่ยนเป็น soft delete โดยเซ็ต isActive = false)
      await Assistant.findByIdAndDelete(assistantId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting assistant: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูล assistant', 500);
    }
  }

  /**
   * อัปเดตสถานะ assistant
   */
  async updateAssistantStatus(assistantId: string, isActive: boolean): Promise<IAssistantDocument | null> {
    try {
      const assistant = await this.findById(assistantId);
      if (!assistant) {
        throw new AppError('ไม่พบข้อมูล assistant นี้', 404);
      }

      const updatedAssistant = await Assistant.findByIdAndUpdate(
        assistantId,
        { $set: { isActive } },
        { new: true }
      ).populate('clinicId', 'name')
        .populate('branches.branchId', 'name');

      return updatedAssistant;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating assistant status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะ assistant', 500);
    }
  }

  /**
   * ดึงข้อมูล assistant ตามประเภทการจ้างงาน
   */
  async findByEmploymentType(
    employmentType: string,
    clinicId?: string
  ): Promise<IAssistantDocument[]> {
    try {
      const filter: FilterQuery<IAssistantDocument> = {
        employmentType,
        isActive: true
      };

      if (clinicId) {
        filter.clinicId = clinicId;
      }

      return await Assistant.find(filter)
        .populate('clinicId', 'name')
        .populate('branches.branchId', 'name')
        .sort({ name: 1 });
    } catch (error) {
      logger.error(`Error finding assistants by employment type: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล assistant ตามประเภทการจ้างงาน', 500);
    }
  }

}

export default AssistantService;