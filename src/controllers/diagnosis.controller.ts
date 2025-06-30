import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { DiagnosisService } from '../services/diagnosis.service';
import { toDiagnosisResponse } from '../types/diagnosis.types';
import { UserRole } from '../types/user.types';

const diagnosisService = new DiagnosisService();

export const getAllDiagnoses = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};
  
  if (req.query.clinicId) filter.clinicId = req.query.clinicId;
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
  
  const { diagnoses, total, totalPages } = await diagnosisService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );
  
  res.status(200).json({
    status: 'success',
    results: diagnoses.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      diagnoses: diagnoses.map(diagnosis => toDiagnosisResponse(diagnosis)),
    },
  });
});

export const getDiagnosisById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const diagnosisId = req.params.id;
  
  const diagnosis = await diagnosisService.findById(diagnosisId);
  
  if (!diagnosis) {
    return next(new AppError('ไม่พบข้อมูลการวินิจฉัยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      diagnosis.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการวินิจฉัยนี้', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      diagnosis: toDiagnosisResponse(diagnosis),
    },
  });
});

export const createDiagnosis = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const diagnosisData = req.body;
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    if (!diagnosisData.clinicId || diagnosisData.clinicId.toString() !== req.user!.clinicId?.toString()) {
      diagnosisData.clinicId = req.user!.clinicId as string;
    }
  }
  
  const newDiagnosis = await diagnosisService.createDiagnosis(diagnosisData);
  
  res.status(201).json({
    status: 'success',
    data: {
      diagnosis: toDiagnosisResponse(newDiagnosis),
    },
  });
});

export const updateDiagnosis = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const diagnosisId = req.params.id;
  const updateData = req.body;
  
  const diagnosis = await diagnosisService.findById(diagnosisId);
  
  if (!diagnosis) {
    return next(new AppError('ไม่พบข้อมูลการวินิจฉัยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      diagnosis.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลการวินิจฉัยนี้', 403));
  }
  
  const updatedDiagnosis = await diagnosisService.updateDiagnosis(diagnosisId, updateData);
  
  res.status(200).json({
    status: 'success',
    data: {
      diagnosis: toDiagnosisResponse(updatedDiagnosis!),
    },
  });
});

export const deleteDiagnosis = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const diagnosisId = req.params.id;
  
  const diagnosis = await diagnosisService.findById(diagnosisId);
  
  if (!diagnosis) {
    return next(new AppError('ไม่พบข้อมูลการวินิจฉัยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      diagnosis.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบการวินิจฉัยนี้', 403));
  }
  
  await diagnosisService.deleteDiagnosis(diagnosisId);
  
  res.status(200).json({
    status: 'success',
    data: null,
  });
});