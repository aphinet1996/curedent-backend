import { FilterQuery } from 'mongoose';
import Branch from '../models/branch.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IBranchDocument,
  CreateBranchInput,
  UpdateBranchInput,
  UpdateBranchStatusInput,
  BranchStatus,
} from '../types/branch.types';

export class BranchService {
  /**
   * ค้นหาสาขาโดยใช้ ID
   */
  async findById(id: string): Promise<IBranchDocument | null> {
    try {
      return await Branch.findById(id).populate('clinicId', 'name');
    } catch (error) {
      logger.error(`Error finding branch by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูลสาขาทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IBranchDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ branches: IBranchDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const branches = await Branch.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name');

      const total = await Branch.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        branches,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all branches: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลสาขา', 500);
    }
  }

  /**
   * ดึงข้อมูลสาขาตาม clinic
   */
  async findByClinic(clinicId: string): Promise<IBranchDocument[]> {
    try {
      return await Branch.findByClinic(clinicId);
    } catch (error) {
      logger.error(`Error finding branches by clinic: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลสาขาตามคลินิก', 500);
    }
  }

  /**
   * ดึงข้อมูลสาขาพร้อมสรุปข้อมูลห้อง
   */
  async findWithRoomsSummary(
    filter: FilterQuery<IBranchDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ branches: any[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // ดึงข้อมูลสาขาก่อน
      const branches = await Branch.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name');

      // ดึงสรุปข้อมูลห้องสำหรับแต่ละสาขา
      const branchesWithSummary = await Promise.all(
        branches.map(async (branch) => {
          const [totalRooms, activeRooms] = await Promise.all([
            branch.getRoomsCount(),
            branch.getActiveRoomsCount()
          ]);

          return {
            ...branch.toObject(),
            roomsSummary: {
              totalRooms,
              activeRooms,
              availableRooms: activeRooms
            }
          };
        })
      );

      const total = await Branch.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        branches: branchesWithSummary,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding branches with rooms summary: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลสาขาพร้อมสรุปห้อง', 500);
    }
  }

  /**
   * สร้างสาขาใหม่
   */
  async createBranch(branchData: CreateBranchInput): Promise<IBranchDocument> {
    try {
      // ตรวจสอบว่ามีสาขาในคลินิกที่มีชื่อเดียวกันหรือไม่
      const existingBranch = await Branch.findOne({
        name: branchData.name,
        clinicId: branchData.clinicId
      });

      if (existingBranch) {
        throw new AppError('มีสาขาชื่อนี้ในคลินิกนี้แล้ว', 400);
      }

      // สร้างสาขาใหม่
      const newBranch = await Branch.create({
        ...branchData,
        status: branchData.status || BranchStatus.ACTIVE
      });

      // ดึงข้อมูลพร้อม populate
      const branch = await this.findById(newBranch._id.toString());
      return branch!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating branch: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างสาขา', 500);
    }
  }

  /**
   * อัปเดตข้อมูลสาขา
   */
  async updateBranch(
    branchId: string,
    updateData: UpdateBranchInput
  ): Promise<IBranchDocument | null> {
    try {
      // ตรวจสอบว่ามีสาขานี้หรือไม่
      const branch = await this.findById(branchId);
      if (!branch) {
        throw new AppError('ไม่พบสาขานี้', 404);
      }

      // ตรวจสอบว่ามีสาขาในคลินิกที่มีชื่อเดียวกันหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
      if (updateData.name && updateData.name !== branch.name) {
        const existingBranch = await Branch.findOne({
          name: updateData.name,
          clinicId: branch.clinicId,
          _id: { $ne: branchId } // ไม่รวมสาขาปัจจุบัน
        });

        if (existingBranch) {
          throw new AppError('มีสาขาชื่อนี้ในคลินิกนี้แล้ว', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedBranch = await Branch.findByIdAndUpdate(
        branchId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name');

      return updatedBranch;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating branch: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสาขา', 500);
    }
  }

  /**
   * อัปเดตสถานะของสาขา
   */
  async updateBranchStatus(
    branchId: string,
    { status }: UpdateBranchStatusInput
  ): Promise<IBranchDocument | null> {
    try {
      // ตรวจสอบว่ามีสาขานี้หรือไม่
      const branch = await this.findById(branchId);
      if (!branch) {
        throw new AppError('ไม่พบสาขานี้', 404);
      }

      // อัปเดตสถานะ
      const updatedBranch = await Branch.findByIdAndUpdate(
        branchId,
        { $set: { status } },
        { new: true }
      ).populate('clinicId', 'name');

      return updatedBranch;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating branch status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะสาขา', 500);
    }
  }

  /**
   * ลบสาขา
   */
  async deleteBranch(branchId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามีสาขานี้หรือไม่
      const branch = await this.findById(branchId);
      if (!branch) {
        throw new AppError('ไม่พบสาขานี้', 404);
      }

      // ตรวจสอบว่ามีห้องในสาขานี้หรือไม่
      const roomsCount = await branch.getRoomsCount();
      if (roomsCount > 0) {
        throw new AppError('ไม่สามารถลบสาขานี้ได้ เนื่องจากยังมีห้องที่เชื่อมโยงอยู่', 400);
      }

      // TODO: ตรวจสอบว่ามีการใช้งานสาขานี้ในระบบอื่นๆ หรือไม่
      // เช่น ในการนัดหมาย หรือ การจองห้อง

      // ลบสาขา
      await Branch.findByIdAndDelete(branchId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting branch: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบสาขา', 500);
    }
  }

  /**
   * ดึงสถิติของสาขา
   */
  async getBranchStats(branchId: string): Promise<{
    branchInfo: IBranchDocument;
    roomsStats: {
      totalRooms: number;
      activeRooms: number;
      availableRooms: number;
    };
  }> {
    try {
      const branch = await this.findById(branchId);
      if (!branch) {
        throw new AppError('ไม่พบสาขานี้', 404);
      }

      const [totalRooms, activeRooms] = await Promise.all([
        branch.getRoomsCount(),
        branch.getActiveRoomsCount()
      ]);

      return {
        branchInfo: branch,
        roomsStats: {
          totalRooms,
          activeRooms,
          availableRooms: activeRooms
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error getting branch stats: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติสาขา', 500);
    }
  }

  /**
   * ดึงสถิติของคลินิก (สาขาทั้งหมด)
   */
  async getClinicBranchesStats(clinicId: string): Promise<{
    totalBranches: number;
    activeBranches: number;
    inactiveBranches: number;
    totalRooms: number;
    totalActiveRooms: number;
  }> {
    try {
      const branches = await this.findByClinic(clinicId);
      
      const activeBranches = branches.filter(b => b.status === BranchStatus.ACTIVE).length;
      const inactiveBranches = branches.filter(b => b.status === BranchStatus.INACTIVE).length;

      // คำนวณจำนวนห้องรวม
      const roomsStats = await Promise.all(
        branches.map(async (branch) => {
          const [totalRooms, activeRooms] = await Promise.all([
            branch.getRoomsCount(),
            branch.getActiveRoomsCount()
          ]);
          return { totalRooms, activeRooms };
        })
      );

      const totalRooms = roomsStats.reduce((sum, stat) => sum + stat.totalRooms, 0);
      const totalActiveRooms = roomsStats.reduce((sum, stat) => sum + stat.activeRooms, 0);

      return {
        totalBranches: branches.length,
        activeBranches,
        inactiveBranches,
        totalRooms,
        totalActiveRooms
      };
    } catch (error) {
      logger.error(`Error getting clinic branches stats: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติสาขาของคลินิก', 500);
    }
  }
}

export default BranchService;