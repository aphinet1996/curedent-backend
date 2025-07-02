import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { UserRole } from '../types/user.types';
import { hasClinicAccess, hasBranchAccess } from '../utils/mongoose.utils';

export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
    }

    // ตรวจสอบว่า req.user.roles อยู่ใน roles array หรือไม่
    const hasRole = roles.includes(req.user.roles);
    if (!hasRole) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
    }

    next();
  };
};

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
  }

  if (req.user.roles !== UserRole.SUPER_ADMIN) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ เฉพาะ Super Admin เท่านั้น', 403));
  }

  next();
};

export const isOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
  }

  const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN];
  if (!allowedRoles.includes(req.user.roles)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
  }

  next();
};

export const isManagerOrAbove = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
  }

  const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER];
  if (!allowedRoles.includes(req.user.roles)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403));
  }

  next();
};

export const checkClinicAccess = (getClinicId: (req: Request) => string | undefined) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
    }

    if (req.user.roles === UserRole.SUPER_ADMIN) {
      return next();
    }

    const targetClinicId = getClinicId(req);
    const userClinicId = req.user.clinicId;

    if (!hasClinicAccess(req.user.roles, userClinicId, targetClinicId)) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลของคลินิกนี้', 403));
    }

    next();
  };
};

export const checkBranchAccess = (getBranchId: (req: Request) => string | undefined, getClinicId?: (req: Request) => string | undefined) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
    }

    if (req.user.roles === UserRole.SUPER_ADMIN) {
      return next();
    }

    const targetBranchId = getBranchId(req);
    const userBranchId = req.user.branchId;
    const userClinicId = req.user.clinicId;
    const targetClinicId = getClinicId ? getClinicId(req) : undefined;

    if (!hasBranchAccess(
      req.user.roles, 
      userBranchId, 
      targetBranchId, 
      userClinicId, 
      targetClinicId
    )) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลของสาขานี้', 403));
    }

    next();
  };
};

export const checkOwnership = (getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
    }

    const adminRoles = [UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN];
    if (adminRoles.includes(req.user.roles)) {
      return next();
    }

    const targetUserId = getUserId(req);
    const currentUserId = req.user._id.toString();

    if (targetUserId !== currentUserId) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
    }

    next();
  };
};

export const canManageUser = (getTargetUserId: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401));
    }

    try {
      const targetUserId = getTargetUserId(req);
      const currentUser = req.user;

      // ไม่สามารถจัดการตัวเองได้ (ยกเว้นการแก้ไขโปรไฟล์)
      if (targetUserId === currentUser._id.toString() && req.method !== 'GET') {
        return next(new AppError('คุณไม่สามารถจัดการบัญชีของตัวเองได้ผ่านเส้นทางนี้', 400));
      }

      // SuperAdmin สามารถจัดการทุกคนได้
      if (currentUser.roles === UserRole.SUPER_ADMIN) {
        return next();
      }

      // ดึงข้อมูลผู้ใช้
      const User = (await import('../models/user.model')).default;
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return next(new AppError('ไม่พบผู้ใช้ที่ระบุ', 404));
      }

      // ไม่สามารถจัดการ SuperAdmin ได้ (ยกเว้น SuperAdmin ด้วยกัน)
      if (targetUser.roles === UserRole.SUPER_ADMIN) {
        return next(new AppError('คุณไม่มีสิทธิ์จัดการ Super Admin', 403));
      }

      // Owner สามารถจัดการทุกคนในคลินิกตัวเอง (ยกเว้น SuperAdmin)
      if (currentUser.roles === UserRole.OWNER) {
        if (!hasClinicAccess(currentUser.roles, currentUser.clinicId, targetUser.clinicId)) {
          return next(new AppError('คุณไม่มีสิทธิ์จัดการผู้ใช้ในคลินิกอื่น', 403));
        }
        return next();
      }

      // Admin สามารถจัดการ Manager และ Staff ในคลินิกตัวเอง
      if (currentUser.roles === UserRole.ADMIN) {
        if (!hasClinicAccess(currentUser.roles, currentUser.clinicId, targetUser.clinicId)) {
          return next(new AppError('คุณไม่มีสิทธิ์จัดการผู้ใช้ในคลินิกอื่น', 403));
        }
        
        const allowedTargetRoles = [UserRole.MANAGER, UserRole.STAFF];
        if (!allowedTargetRoles.includes(targetUser.roles)) {
          return next(new AppError('คุณไม่มีสิทธิ์จัดการผู้ใช้ระดับนี้', 403));
        }
        return next();
      }

      // Manager สามารถจัดการ Staff ในสาขาตัวเอง
      if (currentUser.roles === UserRole.MANAGER) {
        if (!hasBranchAccess(
          currentUser.roles,
          currentUser.branchId,
          targetUser.branchId,
          currentUser.clinicId,
          targetUser.clinicId
        )) {
          return next(new AppError('คุณไม่มีสิทธิ์จัดการผู้ใช้ในสาขาอื่น', 403));
        }
        
        if (targetUser.roles !== UserRole.STAFF) {
          return next(new AppError('คุณสามารถจัดการเฉพาะ Staff เท่านั้น', 403));
        }
        return next();
      }

      // Staff ไม่สามารถจัดการผู้ใช้คนอื่นได้
      return next(new AppError('คุณไม่มีสิทธิ์จัดการผู้ใช้คนอื่น', 403));

    } catch (error) {
      next(error);
    }
  };
};

export const getRoleLevel = (role: UserRole): number => {
  const roleLevels = {
    [UserRole.SUPER_ADMIN]: 5,
    [UserRole.OWNER]: 4,
    [UserRole.ADMIN]: 3,
    [UserRole.MANAGER]: 2,
    [UserRole.STAFF]: 1
  };
  
  return roleLevels[role] || 0;
};

export const hasHigherRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};