import { FilterQuery } from 'mongoose';
import Opd from '../models/opd.model';
import Patient from '../models/patient.model';
import Doctor from '../models/doctor.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IOpdDocument,
  CreateOpdInput,
  UpdateOpdInput,
  IToothData,
  ToothCondition,
  TreatmentType
} from '../types/opd.types';

export class OpdService {
  /**
   * ค้นหา OPD โดยใช้ ID
   */
  async findById(id: string): Promise<IOpdDocument | null> {
    try {
      return await Opd.findById(id)
        .populate('patientId', 'name surname dateOfBirth gender phone email')
        .populate('dentistId', 'name surname specialty color')
        .populate('clinicId', 'name')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error finding OPD by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูล OPD ทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<IOpdDocument> = {},
    sort: Record<string, 1 | -1> = { date: -1 },
    page = 1,
    limit = 10
  ): Promise<{ opds: IOpdDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const opds = await Opd.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('patientId', 'name surname dateOfBirth gender phone')
        .populate('dentistId', 'name surname specialty color')
        .populate('clinicId', 'name')
        .populate('branchId', 'name');

      const total = await Opd.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        opds,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all OPDs: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล OPD', 500);
    }
  }

  /**
   * ดึงข้อมูล OPD แบบ lean เพื่อประสิทธิภาพ
   */
  async findAllLean(
    filter: FilterQuery<IOpdDocument> = {},
    sort: Record<string, 1 | -1> = { date: -1 },
    page = 1,
    limit = 10
  ): Promise<{ opds: IOpdDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const opds = await Opd.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Opd.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        opds,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all OPDs lean: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล OPD', 500);
    }
  }

  /**
   * ดึงข้อมูล OPD ตามผู้ป่วย
   */
  async findByPatient(
    patientId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ opds: IOpdDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const filter: any = { patientId };
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }

      const opds = await Opd.find(filter)
        .populate('dentistId', 'name surname specialty color')
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Opd.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { opds, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding OPDs by patient: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล OPD ของผู้ป่วย', 500);
    }
  }

  /**
   * ดึงข้อมูล OPD ตามทันตแพทย์
   */
  async findByDentist(
    dentistId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ opds: IOpdDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const filter: any = { dentistId };
      if (status) filter.status = status;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = startDate;
        if (endDate) filter.date.$lte = endDate;
      }

      const opds = await Opd.find(filter)
        .populate('patientId', 'name surname dateOfBirth gender phone')
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Opd.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { opds, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding OPDs by dentist: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล OPD ของทันตแพทย์', 500);
    }
  }

  /**
   * ดึงข้อมูล OPD ตามซี่ฟัน
   */
  async findByTooth(
    toothNumber: string,
    options: {
      clinicId?: string;
      patientId?: string;
    } = {}
  ): Promise<IOpdDocument[]> {
    try {
      const { clinicId, patientId } = options;

      const filter: any = { 'teeth.toothNumber': toothNumber };
      if (clinicId) filter.clinicId = clinicId;
      if (patientId) filter.patientId = patientId;

      return await Opd.find(filter)
        .populate('patientId', 'name surname')
        .populate('dentistId', 'name surname')
        .sort({ date: -1 });
    } catch (error) {
      logger.error(`Error finding OPDs by tooth: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล OPD ของซี่ฟัน', 500);
    }
  }

  /**
   * สร้าง OPD ใหม่
   */
  async createOpd(opdData: CreateOpdInput): Promise<IOpdDocument> {
    try {
      // แปลง date เป็น Date ถ้าเป็น string
      if (opdData.date && typeof opdData.date === 'string') {
        opdData.date = new Date(opdData.date);
      }

      // ตรวจสอบว่าผู้ป่วยมีอยู่จริง
      const patient = await Patient.findById(opdData.patientId);
      if (!patient) {
        throw new AppError('ไม่พบข้อมูลผู้ป่วย', 404);
      }

      // ตรวจสอบว่าทันตแพทย์มีอยู่จริง
      const dentist = await Doctor.findById(opdData.dentistId);
      if (!dentist) {
        throw new AppError('ไม่พบข้อมูลทันตแพทย์', 404);
      }

      // สร้าง title อัตโนมัติถ้าไม่ได้ระบุ
      if (!opdData.title && opdData.date) {
        const date = new Date(opdData.date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        opdData.title = `${day}/${month}/${year}`;
      }

      // สร้าง OPD ใหม่
      const newOpd = await Opd.create({
        ...opdData,
        status: opdData.status || 'draft',
      });

      // ดึงข้อมูลพร้อม populate
      const opd = await this.findById(newOpd._id.toString());
      return opd!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating OPD: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูล OPD', 500);
    }
  }

  /**
   * อัปเดตข้อมูล OPD
   */
  async updateOpd(
    opdId: string,
    updateData: UpdateOpdInput
  ): Promise<IOpdDocument | null> {
    try {
      // ตรวจสอบว่ามี OPD นี้หรือไม่
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      // แปลง date เป็น Date ถ้าเป็น string
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }

      // ตรวจสอบทันตแพทย์ใหม่ถ้าระบุ
      if (updateData.dentistId) {
        const dentist = await Doctor.findById(updateData.dentistId);
        if (!dentist) {
          throw new AppError('ไม่พบข้อมูลทันตแพทย์', 404);
        }
      }

      // อัปเดตข้อมูล
      const updatedOpd = await Opd.findByIdAndUpdate(
        opdId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('patientId', 'name surname dateOfBirth gender phone email')
        .populate('dentistId', 'name surname specialty color')
        .populate('clinicId', 'name')
        .populate('branchId', 'name');

      return updatedOpd;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating OPD: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตข้อมูล OPD', 500);
    }
  }

  /**
   * อัปเดตสถานะ OPD
   */
  async updateOpdStatus(
    opdId: string,
    status: 'draft' | 'completed' | 'cancelled'
  ): Promise<IOpdDocument | null> {
    try {
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      const updatedOpd = await Opd.findByIdAndUpdate(
        opdId,
        { $set: { status } },
        { new: true }
      ).populate('patientId', 'name surname dateOfBirth gender phone email')
        .populate('dentistId', 'name surname specialty color')
        .populate('clinicId', 'name')
        .populate('branchId', 'name');

      return updatedOpd;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating OPD status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะ OPD', 500);
    }
  }

  /**
   * เพิ่มข้อมูลฟัน
   */
  async addTooth(opdId: string, toothData: IToothData): Promise<IOpdDocument | null> {
    try {
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      // ตรวจสอบว่าซี่ฟันนี้มีอยู่แล้วหรือไม่
      const existingTooth = opd.teeth.find(tooth => tooth.toothNumber === toothData.toothNumber);
      if (existingTooth) {
        throw new AppError(`ซี่ฟัน ${toothData.toothNumber} มีอยู่ในรายการแล้ว`, 400);
      }

      return await opd.addTooth(toothData);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error adding tooth: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการเพิ่มข้อมูลฟัน', 500);
    }
  }

  /**
   * ลบข้อมูลฟัน
   */
  async removeTooth(opdId: string, toothNumber: string): Promise<IOpdDocument | null> {
    try {
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      // ตรวจสอบว่าซี่ฟันนี้มีอยู่หรือไม่
      const existingTooth = opd.teeth.find(tooth => tooth.toothNumber === toothNumber);
      if (!existingTooth) {
        throw new AppError(`ไม่พบซี่ฟัน ${toothNumber} ในรายการ`, 404);
      }

      return await opd.removeTooth(toothNumber);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error removing tooth: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูลฟัน', 500);
    }
  }

  /**
   * อัปเดตสภาพฟัน
   */
  async updateToothCondition(
    opdId: string,
    toothNumber: string,
    condition: ToothCondition,
    treatment?: TreatmentType,
    notes?: string
  ): Promise<IOpdDocument | null> {
    try {
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      // ตรวจสอบว่าซี่ฟันนี้มีอยู่หรือไม่
      const toothIndex = opd.teeth.findIndex(tooth => tooth.toothNumber === toothNumber);
      if (toothIndex === -1) {
        throw new AppError(`ไม่พบซี่ฟัน ${toothNumber} ในรายการ`, 404);
      }

      // อัปเดตข้อมูลฟัน
      opd.teeth[toothIndex].condition = condition;
      if (treatment) opd.teeth[toothIndex].treatment = treatment;
      if (notes !== undefined) opd.teeth[toothIndex].notes = notes;

      return await opd.save();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating tooth condition: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสภาพฟัน', 500);
    }
  }

  /**
   * ลบ OPD
   */
  async deleteOpd(opdId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามี OPD นี้หรือไม่
      const opd = await this.findById(opdId);
      if (!opd) {
        throw new AppError('ไม่พบข้อมูล OPD นี้', 404);
      }

      // ลบ OPD
      await Opd.findByIdAndDelete(opdId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting OPD: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูล OPD', 500);
    }
  }

  /**
   * ดึงสถิติ OPD
   */
  async getStatistics(
    filter: FilterQuery<IOpdDocument> = {}
  ): Promise<{
    total: number;
    byStatus: { [key: string]: number };
    byMonth: Array<{ month: string; count: number }>;
    byDentist: Array<{ dentistId: string; dentistName: string; count: number }>;
  }> {
    try {
      // รวมข้อมูลตามสถานะ
      const statusStats = await Opd.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // รวมข้อมูลตามเดือน
      const monthStats = await Opd.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // รวมข้อมูลตามทันตแพทย์
      const dentistStats = await Opd.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'doctors',
            localField: 'dentistId',
            foreignField: '_id',
            as: 'dentist'
          }
        },
        { $unwind: '$dentist' },
        {
          $group: {
            _id: '$dentistId',
            dentistName: { $first: { $concat: ['$dentist.name', ' ', '$dentist.surname'] } },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const total = await Opd.countDocuments(filter);

      return {
        total,
        byStatus: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byMonth: monthStats.map(item => ({
          month: item._id,
          count: item.count
        })),
        byDentist: dentistStats.map(item => ({
          dentistId: item._id.toString(),
          dentistName: item.dentistName,
          count: item.count
        }))
      };
    } catch (error) {
      logger.error(`Error getting OPD statistics: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติ OPD', 500);
    }
  }

  /**
   * ดึงชาร์ตฟันของผู้ป่วย
   */
  async getPatientToothChart(patientId: string): Promise<{
    [toothNumber: string]: {
      toothNumber: string;
      latestCondition: ToothCondition;
      latestTreatment?: TreatmentType;
      history: Array<{
        date: Date;
        condition: ToothCondition;
        treatment?: TreatmentType;
        notes?: string;
        opdId: string;
      }>;
    };
  }> {
    try {
      const opds = await Opd.find({ patientId })
        .sort({ date: -1 })
        .select('date teeth _id');

      const toothChart: any = {};

      opds.forEach(opd => {
        opd.teeth.forEach(tooth => {
          if (!toothChart[tooth.toothNumber]) {
            toothChart[tooth.toothNumber] = {
              toothNumber: tooth.toothNumber,
              latestCondition: tooth.condition,
              latestTreatment: tooth.treatment,
              history: []
            };
          }

          toothChart[tooth.toothNumber].history.push({
            date: opd.date,
            condition: tooth.condition,
            treatment: tooth.treatment,
            notes: tooth.notes,
            opdId: opd._id.toString()
          });
        });
      });

      return toothChart;
    } catch (error) {
      logger.error(`Error getting patient tooth chart: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงชาร์ตฟันของผู้ป่วย', 500);
    }
  }
}

export default OpdService;