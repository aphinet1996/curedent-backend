import { FilterQuery } from 'mongoose';
import Treatment from '../models/treatment.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  ITreatmentDocument,
  CreateTreatmentInput,
  UpdateTreatmentInput,
  IFee,
  FeeType,
} from '../types/treatment.types';

export class TreatmentService {
  /**
   * ค้นหาการรักษาโดยใช้ ID
   */
  async findById(id: string): Promise<ITreatmentDocument | null> {
    try {
      return await Treatment.findById(id).populate('clinicId', 'name');
    } catch (error) {
      logger.error(`Error finding treatment by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูลการรักษาทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
   */
  async findAll(
    filter: FilterQuery<ITreatmentDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ treatments: ITreatmentDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const treatments = await Treatment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name');

      const total = await Treatment.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        treatments,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all treatments: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการรักษา', 500);
    }
  }

  /**
   * ดึงข้อมูลการรักษาตาม clinic พร้อมการคำนวณ
   */
  async findByClinicWithCalculations(clinicId: string): Promise<any[]> {
    try {
      const treatments = await Treatment.find({ clinicId })
        .populate('clinicId', 'name')
        .lean();

      // คำนวณ fees สำหรับแต่ละการรักษา
      return treatments.map(treatment => {
        const priceExcludingVat = treatment.includeVat 
          ? Math.round((treatment.price * 100 / 107) * 100) / 100
          : treatment.price;

        const vatAmount = treatment.includeVat 
          ? Math.round((treatment.price * 7 / 107) * 100) / 100
          : 0;

        const doctorFeeAmount = treatment.doctorFee
          ? treatment.doctorFee.type === FeeType.PERCENTAGE
            ? Math.round((priceExcludingVat * treatment.doctorFee.amount / 100) * 100) / 100
            : treatment.doctorFee.amount
          : 0;

        const assistantFeeAmount = treatment.assistantFee
          ? treatment.assistantFee.type === FeeType.PERCENTAGE
            ? Math.round((priceExcludingVat * treatment.assistantFee.amount / 100) * 100) / 100
            : treatment.assistantFee.amount
          : 0;

        const totalPrice = Math.round((treatment.price + doctorFeeAmount + assistantFeeAmount) * 100) / 100;

        return {
          ...treatment,
          calculations: {
            doctorFeeAmount,
            assistantFeeAmount,
            vatAmount,
            priceExcludingVat,
            totalPrice
          }
        };
      });
    } catch (error) {
      logger.error(`Error finding treatments by clinic with calculations: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการรักษาพร้อมการคำนวณ', 500);
    }
  }

  /**
   * สร้างการรักษาใหม่
   */
  async createTreatment(treatmentData: CreateTreatmentInput): Promise<ITreatmentDocument> {
    try {
      // ตรวจสอบว่ามีการรักษาในคลินิกที่มีชื่อเดียวกันหรือไม่
      const existingTreatment = await Treatment.findOne({
        name: treatmentData.name,
        clinicId: treatmentData.clinicId
      });

      if (existingTreatment) {
        throw new AppError('มีการรักษาชื่อนี้ในคลินิกนี้แล้ว', 400);
      }

      // Validate fee data
      this.validateFeeData(treatmentData.doctorFee, 'Doctor Fee');
      this.validateFeeData(treatmentData.assistantFee, 'Assistant Fee');

      // สร้างการรักษาใหม่
      const newTreatment = await Treatment.create({
        ...treatmentData,
        includeVat: treatmentData.includeVat || false
      });

      // ดึงข้อมูลพร้อม populate
      const treatment = await this.findById(newTreatment._id.toString());
      return treatment!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating treatment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างการรักษา', 500);
    }
  }

  /**
   * อัปเดตข้อมูลการรักษา
   */
  async updateTreatment(
    treatmentId: string,
    updateData: UpdateTreatmentInput
  ): Promise<ITreatmentDocument | null> {
    try {
      // ตรวจสอบว่ามีการรักษานี้หรือไม่
      const treatment = await this.findById(treatmentId);
      if (!treatment) {
        throw new AppError('ไม่พบการรักษานี้', 404);
      }

      // ตรวจสอบว่ามีการรักษาในคลินิกที่มีชื่อเดียวกันหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
      if (updateData.name && updateData.name !== treatment.name) {
        const existingTreatment = await Treatment.findOne({
          name: updateData.name,
          clinicId: treatment.clinicId,
          _id: { $ne: treatmentId } // ไม่รวมการรักษาปัจจุบัน
        });

        if (existingTreatment) {
          throw new AppError('มีการรักษาชื่อนี้ในคลินิกนี้แล้ว', 400);
        }
      }

      // Validate fee data
      this.validateFeeData(updateData.doctorFee, 'Doctor Fee');
      this.validateFeeData(updateData.assistantFee, 'Assistant Fee');

      // อัปเดตข้อมูล
      const updatedTreatment = await Treatment.findByIdAndUpdate(
        treatmentId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name');

      return updatedTreatment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating treatment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตการรักษา', 500);
    }
  }

  /**
   * ลบการรักษา
   */
  async deleteTreatment(treatmentId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามีการรักษานี้หรือไม่
      const treatment = await this.findById(treatmentId);
      if (!treatment) {
        throw new AppError('ไม่พบการรักษานี้', 404);
      }

      // TODO: ตรวจสอบว่ามีการใช้งานการรักษานี้ในระบบหรือไม่
      // เช่น ในการนัดหมาย หรือ บิล

      // ลบการรักษา
      await Treatment.findByIdAndDelete(treatmentId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting treatment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบการรักษา', 500);
    }
  }

  /**
   * คำนวณค่าธรรมเนียมสำหรับการรักษา
   */
  async calculateTreatmentFees(
    treatmentId: string,
    doctorFee?: IFee,
    assistantFee?: IFee,
    includeVat?: boolean
  ): Promise<{
    originalPrice: number;
    includeVat: boolean;
    doctorFeeAmount: number;
    assistantFeeAmount: number;
    vatAmount: number;
    priceExcludingVat: number;
    totalPrice: number;
  }> {
    try {
      const treatment = await this.findById(treatmentId);
      if (!treatment) {
        throw new AppError('ไม่พบการรักษานี้', 404);
      }

      // สร้าง temporary treatment object สำหรับการคำนวณ
      const tempTreatment = {
        ...treatment.toObject(),
        doctorFee: doctorFee || treatment.doctorFee,
        assistantFee: assistantFee || treatment.assistantFee,
        includeVat: includeVat !== undefined ? includeVat : treatment.includeVat
      };

      // คำนวณค่าต่างๆ
      const priceExcludingVat = tempTreatment.includeVat 
        ? Math.round((tempTreatment.price * 100 / 107) * 100) / 100
        : tempTreatment.price;

      const vatAmount = tempTreatment.includeVat 
        ? Math.round((tempTreatment.price * 7 / 107) * 100) / 100
        : 0;

      const doctorFeeAmount = tempTreatment.doctorFee
        ? tempTreatment.doctorFee.type === FeeType.PERCENTAGE
          ? Math.round((priceExcludingVat * tempTreatment.doctorFee.amount / 100) * 100) / 100
          : tempTreatment.doctorFee.amount
        : 0;

      const assistantFeeAmount = tempTreatment.assistantFee
        ? tempTreatment.assistantFee.type === FeeType.PERCENTAGE
          ? Math.round((priceExcludingVat * tempTreatment.assistantFee.amount / 100) * 100) / 100
          : tempTreatment.assistantFee.amount
        : 0;

      const totalPrice = Math.round((tempTreatment.price + doctorFeeAmount + assistantFeeAmount) * 100) / 100;

      return {
        originalPrice: tempTreatment.price,
        includeVat: tempTreatment.includeVat,
        doctorFeeAmount,
        assistantFeeAmount,
        vatAmount,
        priceExcludingVat,
        totalPrice
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error calculating treatment fees: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการคำนวณค่าธรรมเนียม', 500);
    }
  }

  /**
   * Validate fee data
   */
  private validateFeeData(fee: IFee | undefined, fieldName: string): void {
    if (!fee) return;

    if (fee.amount < 0) {
      throw new AppError(`${fieldName}: จำนวนเงินต้องไม่น้อยกว่า 0`, 400);
    }

    if (fee.type === FeeType.PERCENTAGE && fee.amount > 100) {
      throw new AppError(`${fieldName}: เปอร์เซ็นต์ต้องไม่เกิน 100`, 400);
    }

    if (!Object.values(FeeType).includes(fee.type)) {
      throw new AppError(`${fieldName}: ประเภทค่าธรรมเนียมไม่ถูกต้อง`, 400);
    }
  }

  /**
   * ดึงสถิติการรักษาตาม clinic
   */
  async getTreatmentStats(clinicId: string): Promise<{
    totalTreatments: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    treatmentsWithDoctorFee: number;
    treatmentsWithAssistantFee: number;
    treatmentsWithVat: number;
  }> {
    try {
      const treatments = await Treatment.find({ clinicId });
      
      if (treatments.length === 0) {
        return {
          totalTreatments: 0,
          averagePrice: 0,
          priceRange: { min: 0, max: 0 },
          treatmentsWithDoctorFee: 0,
          treatmentsWithAssistantFee: 0,
          treatmentsWithVat: 0
        };
      }

      const prices = treatments.map(t => t.price);
      const totalPrice = prices.reduce((sum, price) => sum + price, 0);

      return {
        totalTreatments: treatments.length,
        averagePrice: Math.round((totalPrice / treatments.length) * 100) / 100,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        treatmentsWithDoctorFee: treatments.filter(t => t.doctorFee).length,
        treatmentsWithAssistantFee: treatments.filter(t => t.assistantFee).length,
        treatmentsWithVat: treatments.filter(t => t.includeVat).length
      };
    } catch (error) {
      logger.error(`Error getting treatment stats: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติการรักษา', 500);
    }
  }
}

export default TreatmentService;