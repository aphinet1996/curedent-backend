import Joi from 'joi';
import { Gender, DayOfWeek } from '../types/doctor.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบ timetable
 */
const timetableSchema = Joi.object({
  day: Joi.string().valid(...Object.values(DayOfWeek)).required().messages({
    'any.only': 'วันต้องเป็น monday, tuesday, wednesday, thursday, friday, saturday, หรือ sunday เท่านั้น',
    'any.required': 'กรุณาระบุวันในสัปดาห์'
  }),
  time: Joi.array().items(Joi.string().required()).min(1).required().messages({
    'array.min': 'กรุณาระบุเวลาอย่างน้อย 1 ช่วง',
    'any.required': 'กรุณาระบุเวลา'
  })
});

/**
 * Schema สำหรับตรวจสอบ branch
 */
const branchSchema = Joi.object({
  branchId: commonValidations.objectId.required().messages({
    'any.required': 'กรุณาระบุสาขา'
  }),
  timetable: Joi.array().items(timetableSchema).default([])
});

/**
 * Custom validation สำหรับ hex color
 */
const hexColorValidation = Joi.string()
  .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  .messages({
    'string.pattern.base': 'สีต้องอยู่ในรูปแบบ hex color (เช่น #FF0000, #F00, #3B82F6)'
  });

/**
 * Schema สำหรับตรวจสอบการสร้างหมอใหม่
 */
export const createDoctor = {
  body: Joi.object({
    name: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุชื่อ',
      'string.max': 'ชื่อต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อ',
    }),
    surname: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุนามสกุล',
      'string.max': 'นามสกุลต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุนามสกุล',
    }),
    nickname: Joi.string().trim().max(50).allow('').messages({
      'string.max': 'ชื่อเล่นต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    gender: Joi.string().valid(...Object.values(Gender)).required().messages({
      'any.only': 'เพศต้องเป็น male, female หรือ other เท่านั้น',
      'any.required': 'กรุณาระบุเพศ',
    }),
    nationality: Joi.string().trim().max(100).allow('').messages({
      'string.max': 'สัชชาติต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    birthday: Joi.date().max('now').allow(null).messages({
      'date.max': 'วันเกิดต้องไม่เกินวันปัจจุบัน',
      'date.base': 'รูปแบบวันเกิดไม่ถูกต้อง',
    }),
    address: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    specialty: Joi.string().trim().max(200).required().messages({
      'string.empty': 'กรุณาระบุความเชี่ยวชาญ',
      'string.max': 'ความเชี่ยวชาญต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุความเชี่ยวชาญ',
    }),
    color: hexColorValidation.required().messages({
      'any.required': 'กรุณาระบุสีสำหรับหมอ',
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก',
    }),
    branches: Joi.array().items(branchSchema).default([]),
    isActive: Joi.boolean().default(true),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลหมอ
 */
export const updateDoctor = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'ชื่อต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    surname: Joi.string().trim().max(100).messages({
      'string.max': 'นามสกุลต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    nickname: Joi.string().trim().max(50).allow('').messages({
      'string.max': 'ชื่อเล่นต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    gender: Joi.string().valid(...Object.values(Gender)).messages({
      'any.only': 'เพศต้องเป็น male, female หรือ other เท่านั้น',
    }),
    nationality: Joi.string().trim().max(100).allow('').messages({
      'string.max': 'สัชชาติต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    birthday: Joi.date().max('now').allow(null).messages({
      'date.max': 'วันเกิดต้องไม่เกินวันปัจจุบัน',
      'date.base': 'รูปแบบวันเกิดไม่ถูกต้อง',
    }),
    address: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    specialty: Joi.string().trim().max(200).messages({
      'string.max': 'ความเชี่ยวชาญต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    color: hexColorValidation.messages({
      'string.pattern.base': 'สีต้องอยู่ในรูปแบบ hex color (เช่น #FF0000, #F00, #3B82F6)'
    }),
    branches: Joi.array().items(branchSchema),
    isActive: Joi.boolean(),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลหมอตาม ID
 */
export const getDoctorById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

/**
 * Schema สำหรับการอัปเดตสถานะหมอ
 */
export const updateDoctorStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'กรุณาระบุสถานะ',
    }),
  }),
};

/**
 * Schema สำหรับการอัปเดตสีของหมอ
 */
export const updateDoctorColor = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    color: hexColorValidation.required().messages({
      'any.required': 'กรุณาระบุสีสำหรับหมอ',
    }),
  }),
};

export default {
  createDoctor,
  updateDoctor,
  getDoctorById,
  updateDoctorStatus,
  updateDoctorColor,
};