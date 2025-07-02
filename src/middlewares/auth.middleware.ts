import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { AppError } from './error.middleware';
import { JWTPayload, UserRole, IUserDocument } from '../types/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ดึง token จาก Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงทรัพยากรนี้', 401));
    }

    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const user = await User.findById(decoded.userId)
      .select('-password -resetPasswordToken -emailVerificationToken');

    if (!user) {
      return next(new AppError('ไม่พบข้อมูลผู้ใช้', 401));
    }

    if (user.status !== 'active') {
      return next(new AppError('บัญชีผู้ใช้ถูกระงับหรือไม่ได้เปิดใช้งาน', 401));
    }

    if (user.isLocked()) {
      return next(new AppError('บัญชีถูกล็อคเนื่องจากการเข้าสู่ระบบผิดพลาดหลายครั้ง', 423));
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token ไม่ถูกต้อง', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token หมดอายุ', 401));
    }
    return next(new AppError('เกิดข้อผิดพลาดในการตรวจสอบ token', 500));
  }
};

export const populateUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    await req.user.populate('clinicId', 'name');
    await req.user.populate('branchId', 'name');
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบ', 401));
    }

    if (!roles.includes(req.user.roles)) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึง', 403));
    }

    next();
  };
};

export const authorizeOwnership = (getResourceUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงทรัพยากรนี้', 401));
    }

    const resourceUserId = getResourceUserId(req);
    const currentUserId = req.user._id.toString();

    if ([UserRole.SUPER_ADMIN, UserRole.OWNER].includes(req.user.roles)) {
      return next();
    }

    if (resourceUserId !== currentUserId) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
    }

    next();
  };
};

export const authorizeClinic = (getClinicId: (req: Request) => string | undefined) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงทรัพยากรนี้', 401));
    }

    if (req.user.roles === UserRole.SUPER_ADMIN) {
      return next();
    }

    const targetClinicId = getClinicId(req);
    const userClinicId = req.user.clinicId?.toString();

    if (!userClinicId) {
      return next(new AppError('ไม่พบข้อมูลคลินิกของผู้ใช้', 400));
    }

    if (targetClinicId && targetClinicId !== userClinicId) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลของคลินิกนี้', 403));
    }

    next();
  };
};

export const authorizeBranch = (getBranchId: (req: Request) => string | undefined) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงทรัพยากรนี้', 401));
    }

    if (req.user.roles === UserRole.SUPER_ADMIN) {
      return next();
    }

    if ([UserRole.OWNER, UserRole.ADMIN].includes(req.user.roles)) {
      const targetClinicId = req.user.clinicId?.toString();
      const userClinicId = req.user.clinicId?.toString();
      
      if (targetClinicId && targetClinicId !== userClinicId) {
        return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลของคลินิกนี้', 403));
      }
      return next();
    }

    const targetBranchId = getBranchId(req);
    const userBranchId = req.user.branchId?.toString();

    if (!userBranchId) {
      return next(new AppError('ไม่พบข้อมูลสาขาของผู้ใช้', 400));
    }

    if (targetBranchId && targetBranchId !== userBranchId) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลของสาขานี้', 403));
    }

    next();
  };
};

export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงทรัพยากรนี้', 401));
  }

  if (!req.user.emailVerified) {
    return next(new AppError('กรุณายืนยันอีเมลก่อนเข้าถึงทรัพยากรนี้', 403));
  }

  next();
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequestCounts: { [key: string]: { count: number; resetTime: number } } = {};

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('กรุณาเข้าสู่ระบบเพื่อเข้าถึง', 401));
    }

    const userId = req.user._id.toString();
    const now = Date.now();

    if (!userRequestCounts[userId] || userRequestCounts[userId].resetTime < now) {
      userRequestCounts[userId] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    userRequestCounts[userId].count++;

    if (userRequestCounts[userId].count > maxRequests) {
      const resetTime = new Date(userRequestCounts[userId].resetTime).toISOString();
      return next(new AppError(`เกินขีดจำกัดการเรียก API กรุณาลองใหม่อีกครั้งหลังจาก ${resetTime}`, 429));
    }

    next();
  };
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await User.findById(decoded.userId)
      .select('-password -resetPasswordToken -emailVerificationToken');

    if (user && user.status === 'active' && !user.isLocked()) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};