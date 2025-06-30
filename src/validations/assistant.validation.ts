import Joi from 'joi';
import { Gender, DayOfWeek, EmploymentType } from '../types/assistant.types';
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
 * Schema สำหรับตรวจสอบการสร้าง assistant ใหม่
 */
export const createAssistant = {
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
    employmentType: Joi.string().valid(...Object.values(EmploymentType)).required().messages({
      'any.only': 'ประเภทการจ้างงานต้องเป็น partTime หรือ fullTime เท่านั้น',
      'any.required': 'กรุณาระบุประเภทการจ้างงาน',
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก',
    }),
    branches: Joi.array().items(branchSchema).default([]),
    isActive: Joi.boolean().default(true),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูล assistant
 */
export const updateAssistant = {
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
    employmentType: Joi.string().valid(...Object.values(EmploymentType)).messages({
      'any.only': 'ประเภทการจ้างงานต้องเป็น partTime หรือ fullTime เท่านั้น',
    }),
    branches: Joi.array().items(branchSchema),
    isActive: Joi.boolean(),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับการดึงข้อมูล assistant ตาม ID
 */
export const getAssistantById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

/**
 * Schema สำหรับการอัปเดตสถานะ assistant
 */
export const updateAssistantStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'กรุณาระบุสถานะ',
    }),
  }),
};

export default {
  createAssistant,
  updateAssistant,
  getAssistantById,
  updateAssistantStatus,
};