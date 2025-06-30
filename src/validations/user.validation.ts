import Joi from 'joi';
import { UserStatus, UserRole } from '../types/user.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้างผู้ใช้ใหม่
 */
export const createUser = {
  body: Joi.object({
    email: commonValidations.email.required(),
    username: commonValidations.username.required(),
    password: commonValidations.password.required(),
    name: commonValidations.name.required(),
    surname: commonValidations.name.required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).optional()
      .messages({ 'string.pattern.base': 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }),
    avatar: Joi.string().uri().optional(),
    roles: Joi.string().valid(...Object.values(UserRole)).default(UserRole.STAFF),
    status: Joi.string().valid(...Object.values(UserStatus)).default(UserStatus.ACTIVE),
    clinicId: commonValidations.objectId.when('roles', {
      is: Joi.not(UserRole.SUPER_ADMIN),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    branchId: commonValidations.objectId.when('roles', {
      is: Joi.valid(UserRole.MANAGER, UserRole.STAFF),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    permissions: Joi.array().items(Joi.string()).optional(),
    preferences: Joi.object({
      language: Joi.string().default('th'),
      timezone: Joi.string().default('Asia/Bangkok'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
        push: Joi.boolean().default(true)
      }).optional()
    }).optional(),
    createdBy: commonValidations.objectId.optional()
  })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลผู้ใช้
 */
export const updateUser = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    email: commonValidations.email,
    username: commonValidations.username,
    name: commonValidations.name,
    surname: commonValidations.name,
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).allow(null, ''),
    avatar: Joi.string().uri().allow(null, ''),
    roles: Joi.string().valid(...Object.values(UserRole)),
    status: Joi.string().valid(...Object.values(UserStatus)),
    clinicId: commonValidations.objectId.allow(null),
    branchId: commonValidations.objectId.allow(null),
    permissions: Joi.array().items(Joi.string()),
    preferences: Joi.object({
      language: Joi.string(),
      timezone: Joi.string(),
      notifications: Joi.object({
        email: Joi.boolean(),
        sms: Joi.boolean(),
        push: Joi.boolean()
      })
    })
  }).min(1)
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต roles ของผู้ใช้
 */
export const updateUserRoles = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    roles: Joi.string().valid(...Object.values(UserRole)).required(),
    clinicId: commonValidations.objectId.when('roles', {
      is: Joi.not(UserRole.SUPER_ADMIN),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    branchId: commonValidations.objectId.when('roles', {
      is: Joi.valid(UserRole.MANAGER, UserRole.STAFF),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตสถานะของผู้ใช้
 */
export const updateUserStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(UserStatus)).required()
  })
};

/**
 * Schema สำหรับตรวจสอบการเปลี่ยนรหัสผ่าน
 */
export const changePassword = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    currentPassword: commonValidations.password.required(),
    newPassword: commonValidations.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' })
  })
};

/**
 * Schema สำหรับการค้นหาผู้ใช้
 */
export const findUsers = {
  query: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: Joi.string(),
    status: Joi.string().valid(...Object.values(UserStatus)),
    roles: Joi.string().valid(...Object.values(UserRole)),
    clinicId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    sortBy: commonValidations.sortBy.default('createdAt'),
    sortOrder: commonValidations.sortOrder
  })
};

/**
 * Schema สำหรับการดึงข้อมูลผู้ใช้ตาม ID
 */
export const getUserById = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับการยืนยันอีเมล
 */
export const verifyEmail = {
  body: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'กรุณาระบุ token',
      'any.required': 'กรุณาระบุ token'
    })
  })
};

/**
 * Schema สำหรับการส่งอีเมลยืนยันใหม่
 */
export const resendVerificationEmail = {
  body: Joi.object({
    email: commonValidations.email.required()
  })
};

export default {
  createUser,
  updateUser,
  updateUserRoles,
  updateUserStatus,
  changePassword,
  findUsers,
  getUserById,
  verifyEmail,
  resendVerificationEmail
};