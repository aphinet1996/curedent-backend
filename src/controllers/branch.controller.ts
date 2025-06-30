import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { BranchService } from '../services/branch.service';
import { toBranchResponse } from '../types/branch.types';
import { UserRole } from '../types/user.types';
import { hasClinicAccess } from '../utils/mogoose.utils';

const branchService = new BranchService();

export const getAllBranches = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};
  
  if (req.query.status) filter.status = req.query.status;
  if (req.query.clinicId) filter.clinicId = req.query.clinicId;
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { address: searchRegex },
      { district: searchRegex },
      { province: searchRegex },
    ];
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const includeRoomsSummary = req.query.includeRoomsSummary === 'true';
  
  let result;
  
  if (includeRoomsSummary) {
    result = await branchService.findWithRoomsSummary(
      filter,
      { [sortField]: sortOrder },
      page,
      limit
    );
  } else {
    result = await branchService.findAll(
      filter,
      { [sortField]: sortOrder },
      page,
      limit
    );
  }
  
  res.status(200).json({
    status: 'success',
    results: result.branches.length,
    pagination: {
      total: result.total,
      page: result.page,
      limit,
      totalPages: result.totalPages,
    },
    data: {
      branches: result.branches.map(branch => 
        includeRoomsSummary 
          ? toBranchResponse(branch, branch.roomsSummary)
          : toBranchResponse(branch)
      ),
    },
  });
});

export const getBranchById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.id;
  const includeRoomsSummary = req.query.includeRoomsSummary === 'true';
  
  const branch = await branchService.findById(branchId);
  
  if (!branch) {
    return next(new AppError('ไม่พบข้อมูลสาขานี้', 404));
  }
  
  // ตรวจสอบสิทธิ์ (ถ้าไม่ใช่ superAdmin ต้องเป็นของคลินิกตัวเองเท่านั้น)
  // if (req.user!.roles !== UserRole.SUPER_ADMIN && 
  //     branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
  //   return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้', 403));
  // }

  if (!hasClinicAccess(req.user!.roles, req.user!.clinicId, branch.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสาขานี้', 403));
  }

  let roomsSummary;
  if (includeRoomsSummary) {
    const [totalRooms, activeRooms] = await Promise.all([
      branch.getRoomsCount(),
      branch.getActiveRoomsCount()
    ]);
    
    roomsSummary = {
      totalRooms,
      activeRooms,
      availableRooms: activeRooms
    };
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      branch: toBranchResponse(branch, roomsSummary),
    },
  });
});

export const createBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchData = req.body;
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    if (!branchData.clinicId || branchData.clinicId.toString() !== req.user!.clinicId?.toString()) {
      branchData.clinicId = req.user!.clinicId as string;
    }
  }
  
  const newBranch = await branchService.createBranch(branchData);
  
  res.status(201).json({
    status: 'success',
    data: {
      branch: toBranchResponse(newBranch),
    },
  });
});

export const updateBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.id;
  const updateData = req.body;
  
  const branch = await branchService.findById(branchId);
  
  if (!branch) {
    return next(new AppError('ไม่พบข้อมูลสาขานี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลสาขานี้', 403));
  }
  
  const updatedBranch = await branchService.updateBranch(branchId, updateData);

  res.status(200).json({
    status: 'success',
    data: {
      branch: toBranchResponse(updatedBranch!),
    },
  });
});

export const updateBranchStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.id;
  const statusData = req.body;
  
  const branch = await branchService.findById(branchId);
  
  if (!branch) {
    return next(new AppError('ไม่พบข้อมูลสาขานี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสถานะสาขานี้', 403));
  }
  
  const updatedBranch = await branchService.updateBranchStatus(branchId, statusData);
  
  res.status(200).json({
    status: 'success',
    data: {
      branch: toBranchResponse(updatedBranch!),
    },
  });
});

export const deleteBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.id;
  
  const branch = await branchService.findById(branchId);
  
  if (!branch) {
    return next(new AppError('ไม่พบข้อมูลสาขานี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบสาขานี้', 403));
  }
  
  await branchService.deleteBranch(branchId);
  
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const getBranchStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.id;
  
  const branch = await branchService.findById(branchId);
  if (!branch) {
    return next(new AppError('ไม่พบข้อมูลสาขานี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงสถิติสาขานี้', 403));
  }
  
  const stats = await branchService.getBranchStats(branchId);
  
  res.status(200).json({
    status: 'success',
    data: {
      branch: toBranchResponse(stats.branchInfo),
      roomsStats: stats.roomsStats,
    },
  });
});

export const getBranchesByClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
      clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสาขาของคลินิกนี้', 403));
  }

  const includeRoomsSummary = req.query.includeRoomsSummary === 'true';

  const branches = await branchService.findByClinic(clinicId);

  let result = branches;
  if (includeRoomsSummary) {
    result = await Promise.all(
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
    ) as any;
  }

  res.status(200).json({
    status: 'success',
    results: result.length,
    data: {
      clinicId,
      branches: result.map((branch: any) => 
        includeRoomsSummary 
          ? toBranchResponse(branch, branch.roomsSummary)
          : toBranchResponse(branch)
      ),
    },
  });
});

export const getClinicBranchesStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
      clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงสถิติสาขาของคลินิกนี้', 403));
  }

  const stats = await branchService.getClinicBranchesStats(clinicId);

  res.status(200).json({
    status: 'success',
    data: {
      clinicId,
      stats,
    },
  });
});