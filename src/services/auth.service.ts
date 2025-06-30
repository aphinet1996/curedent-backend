import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IUserDocument,
  CreateUserInput,
  LoginInput,
  LoginResponse,
  JWTPayload,
  UserRole,
  UserStatus,
  toUserResponse
} from '../types/user.types';

export class AuthService {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   */
  async register(userData: CreateUserInput): Promise<LoginResponse> {
    try {
      // ตรวจสอบว่ามีผู้ใช้ที่มี email หรือ username นี้แล้วหรือไม่
      const existingUser = await User.findByEmailOrUsername(userData.email || userData.username);
      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
        } else {
          throw new AppError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 400);
        }
      }

      // สร้างผู้ใช้ใหม่
      const newUser = await User.create({
        ...userData,
        roles: UserRole.STAFF, // default role
        status: UserStatus.ACTIVE,
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false
      });

      // สร้าง tokens
      const { accessToken, refreshToken } = this.generateTokens(newUser);

      // บันทึก refresh token
      newUser.refreshToken = await this.hashRefreshToken(refreshToken);
      await newUser.save();

      // populate ข้อมูล
      await newUser.populate('clinicId', 'name');
      await newUser.populate('branchId', 'name');

      const userResponse = toUserResponse(newUser);

      logger.info(`New user registered: ${newUser.email}`);

      return {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn: 24 * 60 * 60 // 24 hours
      };
    } catch (error: any) {
      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          throw new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400);
        }
        if (error.keyPattern?.username) {
          throw new AppError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 400);
        }
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error(`Error in register: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลงทะเบียน', 500);
    }
  }

  /**
   * เข้าสู่ระบบ
   */
  async login(loginData: LoginInput): Promise<LoginResponse> {
    try {
      const { emailOrUsername, password, rememberMe } = loginData;

      // ค้นหาผู้ใช้
      const user = await User.findByEmailOrUsername(emailOrUsername);
      if (!user) {
        throw new AppError('อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // ตรวจสอบการล็อคบัญชี
      if (user.isLocked()) {
        throw new AppError('บัญชีถูกล็อคเนื่องจากการเข้าสู่ระบบผิดพลาดหลายครั้ง', 423);
      }

      // ตรวจสอบรหัสผ่าน
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new AppError('อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง', 401);
      }

      // ตรวจสอบสถานะบัญชี
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('บัญชีของคุณถูกระงับหรือไม่ได้เปิดใช้งาน', 401);
      }

      // สร้าง tokens
      const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
      const { accessToken, refreshToken } = this.generateTokens(user, expiresIn);

      // บันทึก refresh token และอัปเดตเวลาล็อกอินล่าสุด
      user.refreshToken = await this.hashRefreshToken(refreshToken);
      user.lastLogin = new Date();
      await user.resetLoginAttempts();
      await user.save();

      // populate ข้อมูล
      await user.populate('clinicId', 'name');
      await user.populate('branchId', 'name');

      const userResponse = toUserResponse(user);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: userResponse,
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error in login: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 500);
    }
  }

  /**
   * รีเฟรช token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      // ตรวจสอบความถูกต้องของ refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;

      // ค้นหาผู้ใช้
      const user = await User.findById(decoded.userId)
        .populate('clinicId', 'name')
        .populate('branchId', 'name');

      if (!user) {
        throw new AppError('ไม่พบข้อมูลผู้ใช้', 401);
      }

      // ตรวจสอบว่า refresh token ตรงกับที่บันทึกไว้
      if (!user.refreshToken || !(await this.verifyRefreshToken(refreshToken, user.refreshToken))) {
        throw new AppError('Refresh token ไม่ถูกต้องหรือหมดอายุ', 401);
      }

      // ตรวจสอบสถานะบัญชี
      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('บัญชีของคุณถูกระงับหรือไม่ได้เปิดใช้งาน', 401);
      }

      // สร้าง tokens ใหม่
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      // บันทึก refresh token ใหม่
      user.refreshToken = await this.hashRefreshToken(newRefreshToken);
      await user.save();

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60
      };
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token ไม่ถูกต้องหรือหมดอายุ', 401);
      }
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error in refreshToken: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการรีเฟรช token', 500);
    }
  }

  /**
   * ออกจากระบบ
   */
  async logout(userId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { refreshToken: 1 }
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error(`Error in logout: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการออกจากระบบ', 500);
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
      
      logger.info(`Password reset for user: ${user.email}`);
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
      
      logger.info(`Email verified for user: ${user.email}`);
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

  /**
   * ตรวจสอบและยืนยันตัวตนจาก JWT token
   */
  async verifyToken(token: string): Promise<IUserDocument> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      const user = await User.findById(decoded.userId)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .select('-password -resetPasswordToken -emailVerificationToken');

      if (!user) {
        throw new AppError('ไม่พบข้อมูลผู้ใช้', 401);
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('บัญชีผู้ใช้ถูกระงับหรือไม่ได้เปิดใช้งาน', 401);
      }

      if (user.isLocked()) {
        throw new AppError('บัญชีถูกล็อคเนื่องจากการเข้าสู่ระบบผิดพลาดหลายครั้ง', 423);
      }

      return user;
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Token ไม่ถูกต้อง', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw new AppError('Token หมดอายุ', 401);
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบ token', 500);
    }
  }

  /**
   * สร้าง JWT tokens
   */
  private generateTokens(user: IUserDocument, expiresIn: number = 24 * 60 * 60) {
    const payload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      roles: user.roles,
      clinicId: user.clinicId?.toString(),
      branchId: user.branchId?.toString()
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString() }, 
      process.env.JWT_REFRESH_SECRET!, 
      {
        expiresIn: `${expiresIn}s`
      }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Hash refresh token
   */
  private async hashRefreshToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * ตรวจสอบ refresh token
   */
  private async verifyRefreshToken(token: string, hashedToken: string): Promise<boolean> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenHash === hashedToken;
  }
}

export default AuthService;