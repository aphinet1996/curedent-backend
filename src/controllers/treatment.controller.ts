import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { TreatmentService } from '../services/treatment.service';
import { toTreatmentResponse } from '../types/treatment.types';
import { UserRole } from '../types/user.types';
import { hasClinicAccess } from '../utils/mongoose.utils';

const treatmentService = new TreatmentService();

export const getAllTreatments = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.clinicId) filter.clinicId = req.query.clinicId;
  if (req.query.includeVat !== undefined) filter.includeVat = req.query.includeVat === 'true';
  if (req.query.minPrice) filter.price = { ...filter.price, $gte: parseFloat(req.query.minPrice as string) };
  if (req.query.maxPrice) filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice as string) };

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.name = searchRegex;
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  const includeCalculations = req.query.includeCalculations === 'true';

  const { treatments, total, totalPages } = await treatmentService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: treatments.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      treatments: treatments.map(treatment => toTreatmentResponse(treatment, includeCalculations)),
    },
  });
});

export const getTreatmentById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const treatmentId = req.params.id;
  const includeCalculations = req.query.includeCalculations === 'true';

  const treatment = await treatmentService.findById(treatmentId);

  if (!treatment) {
    return next(new AppError('ไม่พบข้อมูลการรักษานี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
    treatment.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการรักษานี้', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      treatment: toTreatmentResponse(treatment, includeCalculations),
    },
  });
});

export const createTreatment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const treatmentData = req.body;

  if (typeof treatmentData.doctorFee === 'string') {
    try {
      treatmentData.doctorFee = JSON.parse(treatmentData.doctorFee);
    } catch (error) {
      return next(new AppError('Invalid doctorFee format, must be a valid JSON object', 400));
    }
  }

  if (typeof treatmentData.assistantFee === 'string') {
    try {
      treatmentData.assistantFee = JSON.parse(treatmentData.assistantFee);
    } catch (error) {
      return next(new AppError('Invalid assistantFee format, must be a valid JSON object', 400));
    }
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    if (!treatmentData.clinicId || treatmentData.clinicId.toString() !== req.user!.clinicId?.toString()) {
      treatmentData.clinicId = req.user!.clinicId as string;
    }
  }

  const newTreatment = await treatmentService.createTreatment(treatmentData);

  res.status(201).json({
    status: 'success',
    data: {
      treatment: toTreatmentResponse(newTreatment, true),
    },
  });
});

export const updateTreatment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const treatmentId = req.params.id;
  const updateData = req.body;

  if (typeof updateData.doctorFee === 'string') {
    try {
      updateData.doctorFee = JSON.parse(updateData.doctorFee);
    } catch (error) {
      return next(new AppError('Invalid doctorFee format, must be a valid JSON object', 400));
    }
  }

  if (typeof updateData.assistantFee === 'string') {
    try {
      updateData.assistantFee = JSON.parse(updateData.assistantFee);
    } catch (error) {
      return next(new AppError('Invalid assistantFee format, must be a valid JSON object', 400));
    }
  }

  const treatment = await treatmentService.findById(treatmentId);

  if (!treatment) {
    return next(new AppError('ไม่พบข้อมูลการรักษานี้', 404));
  }

  // if (req.user!.roles !== UserRole.SUPER_ADMIN &&
  //     treatment.clinicId.toString() !== req.user!.clinicId?.toString()) {
  //   return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลการรักษานี้', 403));
  // }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, treatment.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้', 403));
  }

  const updatedTreatment = await treatmentService.updateTreatment(treatmentId, updateData);

  res.status(200).json({
    status: 'success',
    data: {
      treatment: toTreatmentResponse(updatedTreatment!, true),
    },
  });
});

export const deleteTreatment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const treatmentId = req.params.id;

  const treatment = await treatmentService.findById(treatmentId);

  if (!treatment) {
    return next(new AppError('ไม่พบข้อมูลการรักษานี้', 404));
  }

  // if (req.user!.roles !== UserRole.SUPER_ADMIN &&
  //   treatment.clinicId.toString() !== req.user!.clinicId?.toString()) {
  //   return next(new AppError('คุณไม่มีสิทธิ์ลบการรักษานี้', 403));
  // }
  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, treatment.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้', 403));
  }

  await treatmentService.deleteTreatment(treatmentId);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const calculateFees = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const treatmentId = req.params.id;
  const { doctorFee, assistantFee, includeVat } = req.body;

  const treatment = await treatmentService.findById(treatmentId);

  if (!treatment) {
    return next(new AppError('ไม่พบข้อมูลการรักษานี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
    treatment.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการรักษานี้', 403));
  }

  const calculations = await treatmentService.calculateTreatmentFees(
    treatmentId,
    doctorFee,
    assistantFee,
    includeVat
  );

  res.status(200).json({
    status: 'success',
    data: {
      treatmentId,
      treatmentName: treatment.name,
      calculations,
    },
  });
});

export const getTreatmentStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
    clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสถิติของคลินิกนี้', 403));
  }

  const stats = await treatmentService.getTreatmentStats(clinicId);

  res.status(200).json({
    status: 'success',
    data: {
      clinicId,
      stats,
    },
  });
});

export const getTreatmentsByClinicWithCalculations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
    clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการรักษาของคลินิกนี้', 403));
  }

  const treatments = await treatmentService.findByClinicWithCalculations(clinicId);

  res.status(200).json({
    status: 'success',
    results: treatments.length,
    data: {
      clinicId,
      treatments,
    },
  });
});

export const getTreamentById = getTreatmentById;