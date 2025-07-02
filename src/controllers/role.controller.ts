import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import Role from '../models/role.model';
import User from '../models/user.model';

export const getAllRoles = catchAsync(async (req: Request, res: Response) => {
  const clinicId = req.user!.clinicId?.toString();

  // ดึง system roles + custom roles ของคลินิก
  const filter: any = {
    $or: [
      { isSystem: true },
      ...(clinicId ? [{ clinicId, isSystem: false }] : [])
    ]
  };

  const roles = await Role.find(filter).sort({ isSystem: -1, displayName: 1 });

  res.status(200).json({
    status: 'success',
    results: roles.length,
    data: { roles }
  });
});

export const createCustomRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, displayName, permissions, description } = req.body;
  const clinicId = req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('เฉพาะเจ้าของคลินิกเท่านั้นที่สามารถสร้างตำแหน่งได้', 400));
  }

  // เช็คว่าชื่อตำแหน่งซ้ำหรือไม่
  const existingRole = await Role.findOne({
    name: name.toLowerCase(),
    $or: [{ isSystem: true }, { clinicId }]
  });

  if (existingRole) {
    return next(new AppError('ชื่อตำแหน่งนี้ถูกใช้งานแล้ว', 400));
  }

  const newRole = await Role.create({
    name: name.toLowerCase(),
    displayName,
    permissions,
    description,
    clinicId,
    isSystem: false,
    createdBy: req.user!._id
  });

  res.status(201).json({
    status: 'success',
    message: 'สร้างตำแหน่งใหม่สำเร็จ',
    data: { role: newRole }
  });
});

export const updateCustomRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roleId = req.params.id;
  const updateData = req.body;

  const role = await Role.findById(roleId);
  if (!role) {
    return next(new AppError('ไม่พบตำแหน่งนี้', 404));
  }

  if (role.isSystem) {
    return next(new AppError('ไม่สามารถแก้ไขตำแหน่งของระบบได้', 400));
  }

  if (role.clinicId?.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขตำแหน่งของคลินิกอื่น', 403));
  }

  const updatedRole = await Role.findByIdAndUpdate(
    roleId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'อัปเดตตำแหน่งสำเร็จ',
    data: { role: updatedRole }
  });
});

export const deleteCustomRole = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roleId = req.params.id;

  const role = await Role.findById(roleId);
  if (!role) {
    return next(new AppError('ไม่พบตำแหน่งนี้', 404));
  }

  if (role.isSystem) {
    return next(new AppError('ไม่สามารถลบตำแหน่งของระบบได้', 400));
  }

  if (role.clinicId?.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบตำแหน่งของคลินิกอื่น', 403));
  }

  // เช็คว่ามีใครใช้ role นี้อยู่หรือไม่
  const usersWithRole = await User.countDocuments({ roleId });
  if (usersWithRole > 0) {
    return next(new AppError(`ไม่สามารถลบตำแหน่งนี้ได้ เนื่องจากมีผู้ใช้ ${usersWithRole} คนที่ใช้ตำแหน่งนี้อยู่`, 400));
  }

  await Role.findByIdAndDelete(roleId);

  res.status(200).json({
    status: 'success',
    message: 'ลบตำแหน่งสำเร็จ'
  });
});