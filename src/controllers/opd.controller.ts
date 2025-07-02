import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { OpdService } from '../services/opd.service';
import { toOpdResponse, opdResponseBuilders } from '../types/opd.types';
import { UserRole } from '../types/user.types';
import { hasClinicAccess } from '../utils/mongoose.utils';

const opdService = new OpdService();

export const getAllOpds = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.patientId) filter.patientId = req.query.patientId;
  if (req.query.dentistId) filter.dentistId = req.query.dentistId;
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.toothNumber) filter['teeth.toothNumber'] = req.query.toothNumber;
  if (req.query.condition) filter['teeth.condition'] = req.query.condition;
  if (req.query.treatment) filter['teeth.treatment'] = req.query.treatment;

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate as string);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate as string);
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { title: searchRegex },
      { chiefComplaint: searchRegex },
      { io: searchRegex },
      { remark: searchRegex },
      { 'diagnosis.name': searchRegex },
      { 'treatment.name': searchRegex }
    ];
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'date';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const { opds, total, totalPages } = await opdService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: opds.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      opds: opds.map(opd => toOpdResponse(opd)),
    },
  });
});

export const getOpdById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;

  const opd = await opdService.findById(opdId);

  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล OPD นี้', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(opd),
    },
  });
});

export const getOpdsByPatient = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.patientId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { opds, total, totalPages } = await opdService.findByPatient(patientId, {
    page,
    limit,
    status,
    startDate,
    endDate
  });

  if (opds.length > 0 && !hasClinicAccess(req.user!.roles, req.user!.clinicId, opds[0].clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล OPD ของผู้ป่วยนี้', 403));
  }

  res.status(200).json({
    status: 'success',
    results: opds.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      opds: opds.map(opd => toOpdResponse(opd)),
    },
  });
});

export const getOpdsByDentist = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const dentistId = req.params.dentistId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { opds, total, totalPages } = await opdService.findByDentist(dentistId, {
    page,
    limit,
    status,
    startDate,
    endDate
  });

  if (opds.length > 0 && !hasClinicAccess(req.user!.roles, req.user!.clinicId, opds[0].clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล OPD ของทันตแพทย์นี้', 403));
  }

  res.status(200).json({
    status: 'success',
    results: opds.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      opds: opds.map(opd => toOpdResponse(opd)),
    },
  });
});

export const createOpd = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdData = req.body;

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    opdData.clinicId = req.user!.clinicId as string;
  }

  const newOpd = await opdService.createOpd(opdData);

  res.status(201).json({
    status: 'success',
    data: {
      opd: toOpdResponse(newOpd),
    },
  });
});

export const updateOpd = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;
  const updateData = req.body;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูล OPD นี้', 403));
  }

  delete updateData.clinicId;
  delete updateData.patientId;

  const updatedOpd = await opdService.updateOpd(opdId, updateData);

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(updatedOpd!),
    },
  });
});

export const updateOpdStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;
  const { status } = req.body;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสถานะ OPD นี้', 403));
  }

  const updatedOpd = await opdService.updateOpdStatus(opdId, status);

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(updatedOpd!),
    },
  });
});

export const addTooth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;
  const toothData = req.body;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูล OPD นี้', 403));
  }

  const updatedOpd = await opdService.addTooth(opdId, toothData);

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(updatedOpd!),
    },
  });
});

export const removeTooth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;
  const toothNumber = req.params.toothNumber;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูล OPD นี้', 403));
  }

  const updatedOpd = await opdService.removeTooth(opdId, toothNumber);

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(updatedOpd!),
    },
  });
});

export const updateToothCondition = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;
  const toothNumber = req.params.toothNumber;
  const { condition, treatment, notes } = req.body;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูล OPD นี้', 403));
  }

  const updatedOpd = await opdService.updateToothCondition(opdId, toothNumber, condition, treatment, notes);

  res.status(200).json({
    status: 'success',
    data: {
      opd: toOpdResponse(updatedOpd!),
    },
  });
});

export const getPatientToothChart = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.patientId;

  const toothChart = await opdService.getPatientToothChart(patientId);

  res.status(200).json({
    status: 'success',
    data: {
      toothChart,
    },
  });
});

export const getOpdStatistics = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }

  if (req.query.clinicId && req.user!.roles === UserRole.SUPER_ADMIN) {
    filter.clinicId = req.query.clinicId;
  }
  if (req.query.dentistId) filter.dentistId = req.query.dentistId;
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate as string);
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate as string);
  }

  const statistics = await opdService.getStatistics(filter);

  res.status(200).json({
    status: 'success',
    data: {
      statistics,
    },
  });
});

export const deleteOpd = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const opdId = req.params.id;

  const opd = await opdService.findById(opdId);
  if (!opd) {
    return next(new AppError('ไม่พบข้อมูล OPD นี้', 404));
  }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, opd.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูล OPD นี้', 403));
  }

  await opdService.deleteOpd(opdId);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});