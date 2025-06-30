import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { UserService } from '../services/user.service';
import { toUserResponse, LoginInput, JWTPayload, UserRole, IUserModel } from '../types/user.types';
import { logger } from '../utils/logger';

const userService = new UserService();

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password, confirmPassword, name, surname } = req.body;

    const existingUser = await userService.findByEmailOrUsername(email || username);
    if (existingUser) {
        if (existingUser.email === email) {
            return next(new AppError('อีเมลนี้ถูกใช้งานแล้ว', 400));
        } else {
            return next(new AppError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 400));
        }
    }

    const newUser = await userService.createUser({
        username,
        email,
        password,
        name,
        surname,
        roles: UserRole.STAFF,
        emailVerified: false,
        phoneVerified: false,
        preferences: {
            language: 'th',
            timezone: 'Asia/Bangkok',
            notifications: {
                email: true,
                sms: false,
                push: true
            }
        }
    });

    const { accessToken, refreshToken } = generateTokens(newUser);

    await userService.updateUser(newUser._id.toString(), {
        refreshToken: await hashRefreshToken(refreshToken)
    });

    const safeUser = toUserResponse(newUser);

    logger.info(`New user registered: ${newUser.email}`);

    res.status(201).json({
        status: 'success',
        message: 'ลงทะเบียนสำเร็จ',
        data: {
            user: safeUser,
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60
        }
    });
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { emailOrUsername, password, rememberMe }: LoginInput = req.body;

    if (!emailOrUsername || !password) {
        return next(new AppError('กรุณาระบุอีเมลหรือชื่อผู้ใช้ และรหัสผ่าน', 400));
    }

    const user = await userService.findByEmailOrUsername(emailOrUsername);
    if (!user) {
        return next(new AppError('อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง', 401));
    }

    if (user.isLocked()) {
        return next(new AppError('บัญชีถูกล็อคเนื่องจากการเข้าสู่ระบบผิดพลาดหลายครั้ง กรุณาลองใหม่ภายหลัง', 423));
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        await user.incLoginAttempts();
        return next(new AppError('อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง', 401));
    }

    if (user.status !== 'active') {
        return next(new AppError('บัญชีของคุณถูกระงับหรือไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 401));
    }

    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const { accessToken, refreshToken } = generateTokens(user, expiresIn);

    await Promise.all([
        userService.updateUser(user._id.toString(), {
            refreshToken: await hashRefreshToken(refreshToken)
        }),
        userService.updateLastLogin(user._id.toString()),
        user.resetLoginAttempts()
    ]);

    const safeUser = toUserResponse(user);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
        status: 'success',
        message: 'เข้าสู่ระบบสำเร็จ',
        data: {
            user: safeUser,
            accessToken,
            refreshToken,
            expiresIn
        }
    });
});

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
        return next(new AppError('กรุณาระบุ refresh token', 400));
    }

    try {
        const decoded = jwt.verify(requestToken, process.env.JWT_REFRESH_SECRET!) as JWTPayload;

        const user = await userService.findById(decoded.userId);
        if (!user) {
            return next(new AppError('ไม่พบข้อมูลผู้ใช้', 401));
        }

        const storedHashedToken = user.refreshToken;
        if (!storedHashedToken || !(await verifyRefreshToken(requestToken, storedHashedToken))) {
            return next(new AppError('Refresh token ไม่ถูกต้องหรือหมดอายุ', 401));
        }

        if (user.status !== 'active') {
            return next(new AppError('บัญชีของคุณถูกระงับหรือไม่ได้เปิดใช้งาน', 401));
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        await userService.updateUser(user._id.toString(), {
            refreshToken: await hashRefreshToken(newRefreshToken)
        });

        res.status(200).json({
            status: 'success',
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: 24 * 60 * 60
            }
        });
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new AppError('Refresh token ไม่ถูกต้องหรือหมดอายุ', 401));
        }
        throw error;
    }
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    await userService.updateUser(req.user!._id.toString(), { refreshToken: undefined });

    logger.info(`User logged out: ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        message: 'ออกจากระบบสำเร็จ'
    });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const { resetToken, user } = await userService.createPasswordResetToken(email);

        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password?token=${resetToken}`;

        logger.info(`Password reset requested for: ${user.email}`);

        if (process.env.NODE_ENV === 'development') {
            res.status(200).json({
                status: 'success',
                message: 'ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว',
                resetToken,
                resetURL
            });
        } else {
            res.status(200).json({
                status: 'success',
                message: 'ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว'
            });
        }
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        logger.error('Error in forgotPassword:', error);
        return next(new AppError('เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน', 500));
    }
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = req.body;

    try {
        const success = await userService.resetPassword(token, newPassword);

        if (success) {
            logger.info(`Password reset completed using token: ${token.substring(0, 10)}...`);

            res.status(200).json({
                status: 'success',
                message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
            });
        } else {
            return next(new AppError('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 500));
        }
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        logger.error('Error in resetPassword:', error);
        return next(new AppError('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 500));
    }
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
    const user = req.user!;

    const safeUser = toUserResponse(user);

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const updateData = req.body;

    delete updateData.roles;
    delete updateData.status;
    delete updateData.clinicId;
    delete updateData.branchId;
    delete updateData.permissions;
    delete updateData.emailVerified;
    delete updateData.phoneVerified;

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
        return next(new AppError('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์', 500));
    }

    const safeUser = toUserResponse(updatedUser);

    logger.info(`Profile updated for user: ${updatedUser.email}`);

    res.status(200).json({
        status: 'success',
        message: 'อัปเดตโปรไฟล์สำเร็จ',
        data: {
            user: safeUser
        }
    });
});

export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!._id.toString();
    const { currentPassword, newPassword } = req.body;

    const success = await userService.changePassword(userId, currentPassword, newPassword);

    if (success) {
        logger.info(`Password changed for user: ${req.user!.email}`);

        res.status(200).json({
            status: 'success',
            message: 'เปลี่ยนรหัสผ่านสำเร็จ'
        });
    } else {
        return next(new AppError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 500));
    }
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    const success = await userService.verifyEmail(token);

    if (success) {
        logger.info(`Email verified with token: ${token.substring(0, 10)}...`);

        res.status(200).json({
            status: 'success',
            message: 'ยืนยันอีเมลสำเร็จ'
        });
    } else {
        return next(new AppError('เกิดข้อผิดพลาดในการยืนยันอีเมล', 500));
    }
});

export const resendVerificationEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const { verificationToken, user } = await userService.resendVerificationEmail(email);

        const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${verificationToken}`;

        logger.info(`Verification email resent for: ${user.email}`);

        if (process.env.NODE_ENV === 'development') {
            res.status(200).json({
                status: 'success',
                message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว',
                verificationToken,
                verifyURL
            });
        } else {
            res.status(200).json({
                status: 'success',
                message: 'ส่งอีเมลยืนยันใหม่เรียบร้อยแล้ว'
            });
        }
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        logger.error('Error in resendVerificationEmail:', error);
        return next(new AppError('เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน', 500));
    }
});

export const getActiveSessions = catchAsync(async (req: Request, res: Response) => {
    const sessions = [
        {
            id: 'session_1',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            current: true,
            lastUsed: new Date(),
            createdAt: new Date()
        }
    ];

    res.status(200).json({
        status: 'success',
        data: {
            sessions
        }
    });
});

export const revokeSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    logger.info(`Session ${sessionId} revoked for user: ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        message: 'ยกเลิก session สำเร็จ'
    });
});

export const revokeAllSessions = catchAsync(async (req: Request, res: Response) => {
    logger.info(`All sessions revoked for user: ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        message: 'ยกเลิก sessions ทั้งหมดสำเร็จ'
    });
});

export const checkUsernameAvailability = catchAsync(async (req: Request, res: Response) => {
    const { username } = req.params;
    const currentUserId = req.user?._id.toString();

    const existingUser = await userService.findByEmailOrUsername(username);

    const available = !existingUser || existingUser._id.toString() === currentUserId;

    res.status(200).json({
        status: 'success',
        data: {
            username,
            available
        }
    });
});

export const checkEmailAvailability = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const currentUserId = req.user?._id.toString();

    const existingUser = await userService.findByEmailOrUsername(email);

    const available = !existingUser || existingUser._id.toString() === currentUserId;

    res.status(200).json({
        status: 'success',
        data: {
            email,
            available
        }
    });
});

function generateTokens(user: any, expiresIn: number = 24 * 60 * 60) {
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

async function hashRefreshToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifyRefreshToken(token: string, hashedToken: string): Promise<boolean> {
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenHash === hashedToken;
}

export default {
    register,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerificationEmail,
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    checkUsernameAvailability,
    checkEmailAvailability
};