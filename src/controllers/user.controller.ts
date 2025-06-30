import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import {
    toUserResponse,
    CreateUserInput,
    UpdateUserInput,
    UpdateUserRolesInput,
    UpdateUserStatusInput,
    ChangePasswordInput,
    UserRole
} from '../types/user.types';
import { logger } from '../utils/logger';

const userService = new UserService();

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.roles) filter.roles = req.query.roles;
    if (req.query.clinicId) filter.clinicId = req.query.clinicId;
    if (req.query.branchId) filter.branchId = req.query.branchId;
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
            { username: searchRegex },
            { email: searchRegex },
            { name: searchRegex },
            { surname: searchRegex }
        ];
    }

    const { users, total, totalPages } = await userService.findAll(
        filter,
        { [sortField]: sortOrder },
        page,
        limit,
        req.user
    );

    const safeUsers = users.map(user => toUserResponse(user));

    res.status(200).json({
        status: 'success',
        results: users.length,
        pagination: {
            total,
            page,
            limit,
            totalPages
        },
        data: {
            users: safeUsers
        }
    });
});

export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    const isSelfLookup = req.user && req.user._id.toString() === userId;

    const user = await userService.findById(userId);

    if (!user) {
        return next(new AppError('ไม่พบผู้ใช้นี้', 404));
    }

    if (!isSelfLookup && ![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        const hasPermission = await userService.checkUserPermission(req.user!, 'read:users');
        if (!hasPermission) {
            return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
        }
    }

    const safeUser = toUserResponse(user);

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
    const userData: CreateUserInput = {
        ...req.body,
        createdBy: req.user!._id.toString()
    };

    const newUser = await userService.createUser(userData);

    const safeUser = toUserResponse(newUser);

    logger.info(`User created: ${newUser.email} by ${req.user!.email}`);

    res.status(201).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const updateData: UpdateUserInput = req.body;

    const isSelfUpdate = req.user!._id.toString() === userId;

    if (!isSelfUpdate && ![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        const hasPermission = await userService.checkUserPermission(req.user!, 'update:users');
        if (!hasPermission) {
            return next(new AppError('คุณไม่มีสิทธิ์อัปเดตข้อมูลนี้', 403));
        }
    }

    if (updateData.roles && ![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        delete updateData.roles;
    }

    const updatedUser = await userService.updateUser(userId, updateData);

    if (!updatedUser) {
        return next(new AppError('ไม่พบผู้ใช้นี้', 404));
    }

    const safeUser = toUserResponse(updatedUser);

    logger.info(`User updated: ${updatedUser.email} by ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const updateUserRoles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const roleData: UpdateUserRolesInput = req.body;

    if (![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยน roles ของผู้ใช้', 403));
    }

    if (roleData.roles === UserRole.SUPER_ADMIN && req.user!.roles !== UserRole.SUPER_ADMIN) {
        return next(new AppError('คุณไม่มีสิทธิ์กำหนด Super Admin role', 403));
    }

    const updatedUser = await userService.updateUserRoles(userId, roleData);

    if (!updatedUser) {
        return next(new AppError('ไม่พบผู้ใช้นี้', 404));
    }

    const safeUser = toUserResponse(updatedUser);

    logger.info(`User roles updated: ${updatedUser.email} to ${roleData.roles} by ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const updateUserStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const statusData: UpdateUserStatusInput = req.body;

    if (![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยนสถานะของผู้ใช้', 403));
    }

    const user = await userService.findById(userId);
    if (!user) {
        return next(new AppError('ไม่พบผู้ใช้นี้', 404));
    }

    if (user.roles === UserRole.SUPER_ADMIN && req.user!.roles !== UserRole.SUPER_ADMIN) {
        return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยนสถานะของ Super Admin', 403));
    }

    if (req.user!._id.toString() === userId) {
        return next(new AppError('คุณไม่สามารถเปลี่ยนสถานะของตัวเองได้', 400));
    }

    const updatedUser = await userService.updateUserStatus(userId, statusData);

    const safeUser = toUserResponse(updatedUser!);

    logger.info(`User status updated: ${updatedUser!.email} to ${statusData.status} by ${req.user!.email}`);

    res.status(200).json({
        status: 'success',
        data: {
            user: safeUser
        }
    });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    if (![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        return next(new AppError('คุณไม่มีสิทธิ์ลบผู้ใช้', 403));
    }

    const user = await userService.findById(userId);
    if (!user) {
        return next(new AppError('ไม่พบผู้ใช้นี้', 404));
    }

    if (user.roles === UserRole.SUPER_ADMIN && req.user!.roles !== UserRole.SUPER_ADMIN) {
        return next(new AppError('คุณไม่มีสิทธิ์ลบบัญชี Super Admin', 403));
    }

    if (req.user!._id.toString() === userId) {
        return next(new AppError('คุณไม่สามารถลบบัญชีของตัวเองได้', 400));
    }

    await userService.deleteUser(userId);

    logger.info(`User deleted: ${user.email} by ${req.user!.email}`);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { currentPassword, newPassword }: ChangePasswordInput = req.body;

    const isSelfUpdate = req.user!._id.toString() === userId;

    if (!isSelfUpdate && ![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        const hasPermission = await userService.checkUserPermission(req.user!, 'update:users:password');
        if (!hasPermission) {
            return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยนรหัสผ่านนี้', 403));
        }
    }

    const success = await userService.changePassword(userId, currentPassword, newPassword);

    if (success) {
        logger.info(`Password changed for user ID: ${userId} by user ID: ${req.user!._id}`);

        res.status(200).json({
            status: 'success',
            message: 'เปลี่ยนรหัสผ่านสำเร็จ'
        });
    } else {
        return next(new AppError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 500));
    }
});

export const getUserPermissions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    const isSelfLookup = req.user!._id.toString() === userId;
    if (!isSelfLookup && ![UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN].includes(req.user!.roles)) {
        return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403));
    }

    const permissions = await userService.getUserPermissions(userId);

    res.status(200).json({
        status: 'success',
        data: {
            permissions
        }
    });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    const success = await userService.verifyEmail(token);

    if (success) {
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

        const verifyURL = `${req.protocol}://${req.get('host')}/api/v1/users/verify-email?token=${verificationToken}`;

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