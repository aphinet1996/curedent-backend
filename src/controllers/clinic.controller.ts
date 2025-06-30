import { Request, Response, NextFunction } from 'express';
import { ClinicService } from '../services/clinic.service';
import { UserService } from '../services/user.service';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import {
  toClinicResponse,
  CreateClinicInput,
  UpdateClinicInput,
  UpdateClinicStatusInput
} from '../types/clinic.types';
import { UserRole } from '../types/user.types';

const clinicService = new ClinicService();
const userService = new UserService();

export const getAllClinics = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { contactEmail: searchRegex },
      { contactPhone: searchRegex },
    ];
  }

  const { clinics, total, totalPages } = await clinicService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );

  const safeClinicss = clinics.map(clinic => toClinicResponse(clinic));

  res.status(200).json({
    status: 'success',
    results: clinics.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      clinics: safeClinicss,
    },
  });
});

export const getClinicById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.id;

  if (!req.user!.roles.includes(UserRole.SUPER_ADMIN) && req.user!.clinicId?.toString() !== clinicId) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลคลินิกนี้', 403));
  }

  const clinic = await clinicService.findById(clinicId);

  if (!clinic) {
    return next(new AppError('ไม่พบคลินิกนี้', 404));
  }

  const safeClinic = toClinicResponse(clinic);

  res.status(200).json({
    status: 'success',
    data: {
      clinic: safeClinic,
    },
  });
});

export const createClinic = catchAsync(async (req: Request, res: Response) => {
  const clinicData: CreateClinicInput = req.body;

  const newClinic = await clinicService.createClinic(clinicData);

  const safeClinic = toClinicResponse(newClinic);

  res.status(201).json({
    status: 'success',
    data: {
      clinic: safeClinic,
    },
  });
});

export const createClinicOwner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.id;
  const userData = req.body;

  const clinic = await clinicService.findById(clinicId);
  if (!clinic) {
    return next(new AppError('ไม่พบคลินิกนี้', 404));
  }

  const ownerData = {
    ...userData,
    clinicId,
    roles: UserRole.OWNER
  };

  const newOwner = await userService.createUser(ownerData);

  res.status(201).json({
    status: 'success',
    data: {
      user: newOwner
    }
  });
});

export const createClinicAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.id;
  const userData = req.body;

  if (!req.user!.roles.includes(UserRole.SUPER_ADMIN) &&
    !(req.user!.clinicId?.toString() === clinicId && req.user!.roles.includes(UserRole.OWNER))) {
    return next(new AppError('คุณไม่มีสิทธิ์เพิ่ม Admin ให้คลินิกนี้', 403));
  }

  const clinic = await clinicService.findById(clinicId);
  if (!clinic) {
    return next(new AppError('ไม่พบคลินิกนี้', 404));
  }

  const adminData = {
    ...userData,
    clinicId,
    roles: UserRole.ADMIN
  };

  const newAdmin = await userService.createUser(adminData);

  res.status(201).json({
    status: 'success',
    data: {
      user: newAdmin
    }
  });
});

export const updateClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.id;
  const updateData: UpdateClinicInput = req.body;

  const updatedClinic = await clinicService.updateClinic(clinicId, updateData);

  if (!updatedClinic) {
    return next(new AppError('ไม่พบคลินิกนี้', 404));
  }

  const safeClinic = toClinicResponse(updatedClinic);

  res.status(200).json({
    status: 'success',
    data: {
      clinic: safeClinic,
    },
  });
});

export const updateClinicStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.id;
  const statusData: UpdateClinicStatusInput = req.body;

  const updatedClinic = await clinicService.updateClinicStatus(clinicId, statusData);

  if (!updatedClinic) {
    return next(new AppError('ไม่พบคลินิกนี้', 404));
  }

  const safeClinic = toClinicResponse(updatedClinic);

  res.status(200).json({
    status: 'success',
    data: {
      clinic: safeClinic,
    },
  });
});