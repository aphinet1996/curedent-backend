import Joi from 'joi';
import { UserRole } from '../types/user.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการลงทะเบียน
 */
export const register = {
  body: Joi.object({
    username: commonValidations.username.required(),
    email: commonValidations.email.required(),
    password: commonValidations.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' }),
    name: commonValidations.name.required(),
    surname: commonValidations.name.required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).optional()
      .messages({ 'string.pattern.base': 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' }),
    clinicId: commonValidations.objectId.optional(),
    branchId: commonValidations.objectId.optional()
  })
};

/**
 * Schema สำหรับตรวจสอบการเข้าสู่ระบบ
 */
export const login = {
  body: Joi.object({
    emailOrUsername: Joi.string().required()
      .messages({
        'string.empty': 'กรุณาระบุอีเมลหรือชื่อผู้ใช้',
        'any.required': 'กรุณาระบุอีเมลหรือชื่อผู้ใช้'
      }),
    password: commonValidations.password.required(),
    rememberMe: Joi.boolean().default(false)
  })
};

/**
 * Schema สำหรับตรวจสอบการรีเฟรช token
 */
export const refreshToken = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({ 
      'string.empty': 'กรุณาระบุ refresh token',
      'any.required': 'กรุณาระบุ refresh token'
    })
  })
};

/**
 * Schema สำหรับตรวจสอบการลืมรหัสผ่าน
 */
export const forgotPassword = {
  body: Joi.object({
    email: commonValidations.email.required()
  })
};

/**
 * Schema สำหรับตรวจสอบการรีเซ็ตรหัสผ่าน
 */
export const resetPassword = {
  body: Joi.object({
    token: Joi.string().required().messages({ 
      'string.empty': 'กรุณาระบุ token',
      'any.required': 'กรุณาระบุ token'
    }),
    newPassword: commonValidations.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน' })
  })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตโปรไฟล์
 */
export const updateProfile = {
  body: Joi.object({
    username: commonValidations.username,
    name: commonValidations.name,
    surname: commonValidations.name,
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).allow(null, ''),
    avatar: Joi.string().uri().allow(null, ''),
    preferences: Joi.object({
      language: Joi.string().valid('th', 'en').default('th'),
      timezone: Joi.string().default('Asia/Bangkok'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        sms: Joi.boolean().default(false),
        push: Joi.boolean().default(true)
      })
    })
  }).min(1)
};

/**
 * Schema สำหรับตรวจสอบการเปลี่ยนรหัสผ่าน
 */
export const changePassword = {
  body: Joi.object({
    currentPassword: commonValidations.password.required(),
    newPassword: commonValidations.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' })
  })
};

/**
 * Schema สำหรับตรวจสอบการยืนยันอีเมล
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
 * Schema สำหรับส่งอีเมลยืนยันใหม่
 */
export const resendVerificationEmail = {
  body: Joi.object({
    email: commonValidations.email.required()
  })
};

export default {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerificationEmail
};