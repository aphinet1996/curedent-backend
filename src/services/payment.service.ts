import { FilterQuery } from 'mongoose';
import Payment from '../models/payment.model';
import PaymentTransaction from '../models/payment-transaction.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IPaymentDocument,
  IPaymentTransactionDocument,
  CreatePaymentInput,
  UpdatePaymentInput,
  CreatePaymentTransactionInput,
  PaymentStatus
} from '../types/payment.types';

export class PaymentService {
  /**
   * ค้นหา Payment โดยใช้ ID
   */
  async findById(id: string): Promise<IPaymentDocument | null> {
    try {
      return await Payment.findById(id)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('doctorId', 'name surname')
        .populate('createdBy', 'name surname');
    } catch (error) {
      logger.error(`Error finding payment by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Payment ทั้งหมด
   */
  async findAll(
    filter: FilterQuery<IPaymentDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ payments: IPaymentDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const payments = await Payment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('doctorId', 'name surname')
        .populate('createdBy', 'name surname');
      
      const total = await Payment.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { payments, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding all payments: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน', 500);
    }
  }

  /**
   * สร้าง Payment ใหม่
   */
  async createPayment(paymentData: CreatePaymentInput, createdBy: string): Promise<IPaymentDocument> {
    try {
      // แปลง dueDate เป็น Date ถ้าเป็น string
      if (paymentData.dueDate && typeof paymentData.dueDate === 'string') {
        paymentData.dueDate = new Date(paymentData.dueDate);
      }

      const newPayment = await Payment.create({
        ...paymentData,
        createdBy,
        discount: paymentData.discount || 0,
        tax: paymentData.tax || 0
      });

      return await this.findById(newPayment._id.toString()) as IPaymentDocument;
    } catch (error) {
      logger.error(`Error creating payment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างการชำระเงิน', 500);
    }
  }

  /**
   * อัปเดต Payment
   */
  async updatePayment(
    paymentId: string,
    updateData: UpdatePaymentInput
  ): Promise<IPaymentDocument | null> {
    try {
      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404);
      }

      // ตรวจสอบว่าชำระเงินแล้วหรือไม่ (ไม่ให้แก้ไขถ้าชำระแล้ว)
      if (payment.status === PaymentStatus.PAID) {
        throw new AppError('ไม่สามารถแก้ไขการชำระเงินที่ชำระเรียบร้อยแล้ว', 400);
      }

      // แปลง dueDate เป็น Date ถ้าเป็น string
      if (updateData.dueDate && typeof updateData.dueDate === 'string') {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('doctorId', 'name surname')
       .populate('createdBy', 'name surname');

      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating payment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตการชำระเงิน', 500);
    }
  }

  /**
   * ลบ Payment
   */
  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404);
      }

      // ตรวจสอบว่ามี transaction หรือไม่
      const transactionCount = await PaymentTransaction.countDocuments({ paymentId });
      if (transactionCount > 0) {
        throw new AppError('ไม่สามารถลบการชำระเงินที่มีธุรกรรมแล้ว', 400);
      }

      await Payment.findByIdAndDelete(paymentId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting payment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบการชำระเงิน', 500);
    }
  }

  /**
   * สร้าง Payment Transaction
   */
  async createTransaction(
    transactionData: CreatePaymentTransactionInput,
    processedBy: string
  ): Promise<IPaymentTransactionDocument> {
    try {
      // ตรวจสอบว่ามี Payment อยู่หรือไม่
      const payment = await this.findById(transactionData.paymentId);
      if (!payment) {
        throw new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404);
      }

      // ตรวจสอบว่าจำนวนเงินไม่เกินยอดคงเหลือ
      if (transactionData.amount > payment.remainingAmount) {
        throw new AppError('จำนวนเงินเกินยอดคงเหลือ', 400);
      }

      // แปลง processedAt เป็น Date ถ้าเป็น string
      if (transactionData.processedAt && typeof transactionData.processedAt === 'string') {
        transactionData.processedAt = new Date(transactionData.processedAt);
      }

      // สร้าง transaction
      const newTransaction = await PaymentTransaction.create({
        ...transactionData,
        processedBy,
        processedAt: transactionData.processedAt || new Date()
      });

      // อัปเดต payment
      await Payment.findByIdAndUpdate(
        transactionData.paymentId,
        { $inc: { paidAmount: transactionData.amount } },
        { runValidators: true }
      );

      return await PaymentTransaction.findById(newTransaction._id)
        .populate('processedBy', 'name surname') as IPaymentTransactionDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating payment transaction: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างธุรกรรมการชำระเงิน', 500);
    }
  }

  /**
   * ดึง Transactions ของ Payment
   */
  async getPaymentTransactions(paymentId: string): Promise<IPaymentTransactionDocument[]> {
    try {
      return await PaymentTransaction.find({ paymentId })
        .sort({ processedAt: -1 })
        .populate('processedBy', 'name surname');
    } catch (error) {
      logger.error(`Error getting payment transactions: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลธุรกรรม', 500);
    }
  }

  /**
   * ยกเลิก Payment
   */
  async cancelPayment(paymentId: string): Promise<IPaymentDocument | null> {
    try {
      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404);
      }

      if (payment.paidAmount > 0) {
        throw new AppError('ไม่สามารถยกเลิกการชำระเงินที่มีการชำระแล้ว', 400);
      }

      const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        { $set: { status: PaymentStatus.CANCELLED } },
        { new: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('doctorId', 'name surname')
       .populate('createdBy', 'name surname');

      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error cancelling payment: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน', 500);
    }
  }
}

export default PaymentService;