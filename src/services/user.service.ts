import { FilterQuery } from 'mongoose';
import User from '../models/user.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IUserDocument,
  IUserModel,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRolesInput,
  UpdateUserStatusInput,
  UserStatus,
  UserRole
} from '../types/user.types';
import { hasClinicAccess, hasBranchAccess } from '../utils/mongoose.utils';

export class UserService {
  /**
   * ค้นหาผู้ใช้โดย ID
   */
  async findById(id: string): Promise<IUserDocument | null> {
    try {
      return await User.findById(id)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'name surname');
    } catch (error) {
      logger.error(`Error finding user by ID: ${error}`);
      return null;
    }
  }

  /**
   * ค้นหาผู้ใช้โดยอีเมลหรือชื่อผู้ใช้
   */
  async findByEmailOrUsername(emailOrUsername: string): Promise<IUserDocument | null> {
    try {
      return await User.findByEmailOrUsername(emailOrUsername);
    } catch (error) {
      logger.error(`Error finding user by email or username: ${error}`);
      return null;
    }
  }

  /**
   * สร้างผู้ใช้ใหม่
   */
  async createUser(userData: CreateUserInput): Promise<IUserDocument> {
    try {
      const newUser = await User.create(userData);
      return await this.findById(newUser._id.toString()) as IUserDocument;
    } catch (error: any) {
      logger.error(`Error creating user: ${error}`);
      
      // จัดการ error ที่เฉพาะเจาะจง
      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
        }
        if (error.keyPattern?.username) {
          throw new AppError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 400);
        }
      }
      
      throw new AppError('เกิดข้อผิดพลาดในการสร้างผู้ใช้', 500);
    }
  }

  /**
   * อัปเดตผู้ใช้
   */
  async updateUser(userId: string, updateData: UpdateUserInput): Promise<IUserDocument | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('createdBy', 'name surname');

      return updatedUser;
    } catch (error: any) {
      logger.error(`Error updating user: ${error}`);
      
      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
        }
        if (error.keyPattern?.username) {
          throw new AppError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 400);
        }
      }
      
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตผู้ใช้', 500);
    }
  }

  /**
   * อัปเดต roles ของผู้ใช้
   */
  async updateUserRoles(userId: string, roleData: UpdateUserRolesInput): Promise<IUserDocument | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: roleData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('createdBy', 'name surname');

      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user roles: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดต roles ของผู้ใช้', 500);
    }
  }

  /**
   * อัปเดตสถานะของผู้ใช้
   */
  async updateUserStatus(userId: string, statusData: UpdateUserStatusInput): Promise<IUserDocument | null> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: statusData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('createdBy', 'name surname');

      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้', 500);
    }
  }

  /**
   * เปลี่ยนรหัสผ่าน
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new AppError('ไม่พบผู้ใช้', 404);
      }

      // ตรวจสอบรหัสผ่านปัจจุบัน
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400);
      }

      // อัปเดตรหัสผ่านใหม่
      user.password = newPassword;
      await user.save();

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error changing password: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 500);
    }
  }

  /**
   * อัปเดตเวลาเข้าสู่ระบบล่าสุด
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { lastLogin: new Date() },
        $unset: { loginAttempts: 1, lockUntil: 1 }
      });
    } catch (error) {
      logger.error(`Error updating last login: ${error}`);
      // ไม่ throw error เพราะไม่ควรให้ login fail เพราะอัปเดต lastLogin ไม่ได้
    }
  }

  /**
   * สร้าง password reset token
   */
  async createPasswordResetToken(email: string): Promise<{ resetToken: string; user: IUserDocument }> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new AppError('ไม่พบผู้ใช้ที่มีอีเมลนี้', 404);
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save({ validateBeforeSave: false });

      return { resetToken, user };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating password reset token: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้าง token สำหรับรีเซ็ตรหัสผ่าน', 500);
    }
  }

  /**
   * รีเซ็ตรหัสผ่าน
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findByResetToken(token);
      
      if (!user) {
        throw new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 400);
      }

      // รีเซ็ตรหัสผ่าน
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error resetting password: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 500);
    }
  }

  /**
   * ลบผู้ใช้ (soft delete)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await User.findByIdAndUpdate(userId, {
        $set: { status: UserStatus.INACTIVE }
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting user: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบผู้ใช้', 500);
    }
  }

  /**
   * ตรวจสอบสิทธิ์ของผู้ใช้
   */
  async checkUserPermission(user: IUserDocument, permission: string): Promise<boolean> {
    // Super admin มีสิทธิ์ทั้งหมด
    if (user.roles === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ตรวจสอบ permissions ที่กำหนดไว้ใน user
    if (user.permissions && user.permissions.includes(permission)) {
      return true;
    }

    // ตรวจสอบสิทธิ์ตาม role
    switch (user.roles) {
      case UserRole.OWNER:
      case UserRole.ADMIN:
        return ['read:users', 'create:users', 'update:users', 'update:users:password'].includes(permission);
      case UserRole.MANAGER:
        return ['read:users', 'update:users'].includes(permission);
      case UserRole.STAFF:
        return ['read:own', 'update:own'].includes(permission);
      default:
        return false;
    }
  }

  /**
   * ดึงสิทธิ์ของผู้ใช้
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('ไม่พบผู้ใช้', 404);
      }

      const permissions: string[] = [];

      // สิทธิ์ตาม role
      switch (user.roles) {
        case UserRole.SUPER_ADMIN:
          permissions.push('*'); // ทุกสิทธิ์
          break;
        case UserRole.OWNER:
        case UserRole.ADMIN:
          permissions.push('read:users', 'create:users', 'update:users', 'update:users:password', 'delete:users');
          break;
        case UserRole.MANAGER:
          permissions.push('read:users', 'update:users');
          break;
        case UserRole.STAFF:
          permissions.push('read:own', 'update:own');
          break;
      }

      // เพิ่มสิทธิ์เฉพาะที่กำหนดไว้
      if (user.permissions) {
        permissions.push(...user.permissions);
      }

      return [...new Set(permissions)]; // ลบข้อมูลซ้ำ
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error getting user permissions: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสิทธิ์ของผู้ใช้', 500);
    }
  }

  /**
   * ดึงผู้ใช้ทั้งหมด
   */
  async findAll(
    filter: FilterQuery<IUserDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10,
    currentUser?: IUserDocument
  ): Promise<{ users: IUserDocument[]; total: number; page: number; totalPages: number }> {
    try {
      // กรองข้อมูลตามสิทธิ์ของผู้ใช้ปัจจุบัน
      const finalFilter = this.buildFilterBasedOnPermissions(filter, currentUser);
      
      const skip = (page - 1) * limit;
      
      const users = await User.find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'name surname');
      
      const total = await User.countDocuments(finalFilter);
      const totalPages = Math.ceil(total / limit);

      return { users, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding all users: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', 500);
    }
  }

  /**
   * สร้าง filter ตามสิทธิ์ของผู้ใช้
   */
  private buildFilterBasedOnPermissions(filter: FilterQuery<IUserDocument>, currentUser?: IUserDocument): FilterQuery<IUserDocument> {
    if (!currentUser) {
      return filter;
    }

    // Super admin เห็นได้ทุกคน
    if (currentUser.roles === UserRole.SUPER_ADMIN) {
      return filter;
    }

    // Owner และ Admin เห็นได้เฉพาะในคลินิกตัวเอง
    if ([UserRole.OWNER, UserRole.ADMIN].includes(currentUser.roles)) {
      return {
        ...filter,
        clinicId: currentUser.clinicId
      };
    }

    // Manager และ Staff เห็นได้เฉพาะในสาขาตัวเอง
    if ([UserRole.MANAGER, UserRole.STAFF].includes(currentUser.roles)) {
      return {
        ...filter,
        branchId: currentUser.branchId
      };
    }

    return filter;
  }

  /**
   * ยืนยันอีเมล
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const user = await User.findByVerificationToken(token);
      
      if (!user) {
        throw new AppError('Token ไม่ถูกต้องหรือหมดอายุ', 400);
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error verifying email: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการยืนยันอีเมล', 500);
    }
  }

  /**
   * ส่งอีเมลยืนยันใหม่
   */
  async resendVerificationEmail(email: string): Promise<{ verificationToken: string; user: IUserDocument }> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        throw new AppError('ไม่พบผู้ใช้ที่มีอีเมลนี้', 404);
      }

      if (user.emailVerified) {
        throw new AppError('อีเมลนี้ได้รับการยืนยันแล้ว', 400);
      }

      const verificationToken = user.generateEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      return { verificationToken, user };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error resending verification email: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน', 500);
    }
  }
}

export default UserService;