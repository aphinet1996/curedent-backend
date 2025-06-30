// validations/clinic.validation.ts
import Joi from 'joi';
import { ClinicStatus } from '../types/clinic.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้างคลินิกใหม่
 */
export const createClinic = {
  body: Joi.object({
    name: Joi.string().required().trim().max(100)
      .messages({
        'string.empty': 'กรุณาระบุชื่อคลินิก',
        'string.max': 'ชื่อคลินิกต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุชื่อคลินิก',
      }),
    contactEmail: Joi.string().email().required().trim()
      .messages({
        'string.email': 'อีเมลติดต่อไม่ถูกต้อง',
        'string.empty': 'กรุณาระบุอีเมลติดต่อ',
        'any.required': 'กรุณาระบุอีเมลติดต่อ',
      }),
    contactPhone: Joi.string().required().trim().max(20)
      .messages({
        'string.empty': 'กรุณาระบุเบอร์โทรศัพท์ติดต่อ',
        'string.max': 'เบอร์โทรศัพท์ติดต่อต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุเบอร์โทรศัพท์ติดต่อ',
      }),
    taxId: Joi.string().trim().allow('', null),
    status: Joi.string().valid(...Object.values(ClinicStatus)).default(ClinicStatus.ACTIVE),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลคลินิก
 */
export const updateClinic = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100)
      .messages({
        'string.max': 'ชื่อคลินิกต้องไม่เกิน {#limit} ตัวอักษร',
      }),
    contactEmail: Joi.string().email().trim()
      .messages({
        'string.email': 'อีเมลติดต่อไม่ถูกต้อง',
      }),
    contactPhone: Joi.string().trim().max(20)
      .messages({
        'string.max': 'เบอร์โทรศัพท์ติดต่อต้องไม่เกิน {#limit} ตัวอักษร',
      }),
    taxId: Joi.string().trim().allow('', null),
  }).min(1), // ต้องมีอย่างน้อย 1 ฟิลด์
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตสถานะของคลินิก
 */
export const updateClinicStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(ClinicStatus)).required()
      .messages({
        'any.only': 'สถานะต้องเป็น active หรือ inactive เท่านั้น',
        'string.empty': 'กรุณาระบุสถานะ',
        'any.required': 'กรุณาระบุสถานะ',
      }),
  }),
};

/**
 * Schema สำหรับการสร้าง Owner/Admin สำหรับคลินิก
 */
export const createClinicUser = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    username: commonValidations.username.required(),
    email: commonValidations.email.required(),
    password: commonValidations.password.required(),
    firstName: Joi.string().trim().allow('', null),
    lastName: Joi.string().trim().allow('', null),
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลคลินิกตาม ID
 */
export const getClinicById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

export default {
  createClinic,
  updateClinic,
  updateClinicStatus,
  createClinicUser,
  getClinicById,
};