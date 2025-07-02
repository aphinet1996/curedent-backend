import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { PaymentService } from '../services/payment.service';
import { toPaymentResponse, toPaymentTransactionResponse } from '../types/payment.types';
import { UserRole } from '../types/user.types';
import { compareObjectIds } from '../utils/mongoose.utils';

const paymentService = new PaymentService();

export const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};
  
  if (req.query.status) filter.status = req.query.status;
  if (req.query.clinicId) filter.clinicId = req.query.clinicId;
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { patientName: searchRegex },
      { paymentNumber: searchRegex }
    ];
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  const { payments, total, totalPages } = await paymentService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );
  
  res.status(200).json({
    status: 'success',
    results: payments.length,
    pagination: { total, page, limit, totalPages },
    data: {
      payments: payments.map(payment => toPaymentResponse(payment))
    }
  });
});

export const getPaymentById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentId = req.params.id;
  
  const payment = await paymentService.findById(paymentId);
  if (!payment) {
    return next(new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(payment.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการชำระเงินนี้', 403));
  }

  const transactions = await paymentService.getPaymentTransactions(paymentId);
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: toPaymentResponse(payment, transactions)
    }
  });
});

export const createPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentData = req.body;
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    if (!paymentData.clinicId || paymentData.clinicId !== req.user!.clinicId?.toString()) {
      paymentData.clinicId = req.user!.clinicId?.toString();
    }
  }
  
  const newPayment = await paymentService.createPayment(paymentData, req.user!._id.toString());
  
  res.status(201).json({
    status: 'success',
    data: {
      payment: toPaymentResponse(newPayment)
    }
  });
});

export const updatePayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentId = req.params.id;
  const updateData = req.body;
  
  const payment = await paymentService.findById(paymentId);
  if (!payment) {
    return next(new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(payment.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลการชำระเงินนี้', 403));
  }
  
  const updatedPayment = await paymentService.updatePayment(paymentId, updateData);
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: toPaymentResponse(updatedPayment!)
    }
  });
});

export const deletePayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentId = req.params.id;
  
  const payment = await paymentService.findById(paymentId);
  if (!payment) {
    return next(new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(payment.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูลการชำระเงินนี้', 403));
  }
  
  await paymentService.deletePayment(paymentId);
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

export const createPaymentTransaction = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const transactionData = req.body;
  
  const payment = await paymentService.findById(transactionData.paymentId);
  if (!payment) {
    return next(new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(payment.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์สร้างธุรกรรมสำหรับการชำระเงินนี้', 403));
  }
  
  const newTransaction = await paymentService.createTransaction(
    transactionData, 
    req.user!._id.toString()
  );
  
  res.status(201).json({
    status: 'success',
    data: {
      transaction: toPaymentTransactionResponse(newTransaction)
    }
  });
});

export const cancelPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const paymentId = req.params.id;
  
  const payment = await paymentService.findById(paymentId);
  if (!payment) {
    return next(new AppError('ไม่พบข้อมูลการชำระเงินนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(payment.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ยกเลิกการชำระเงินนี้', 403));
  }
  
  const cancelledPayment = await paymentService.cancelPayment(paymentId);
  
  res.status(200).json({
    status: 'success',
    data: {
      payment: toPaymentResponse(cancelledPayment!)
    }
  });
});