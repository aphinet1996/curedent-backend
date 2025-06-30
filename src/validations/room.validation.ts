import Joi from 'joi';
import { RoomStatus } from '../types/room.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้าง Room Type ใหม่
 */
export const createRoomType = {
  body: Joi.object({
    name: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุชื่อประเภทห้อง',
      'string.max': 'ชื่อประเภทห้องต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อประเภทห้อง',
    }),
    description: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'คำอธิบายต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    color: Joi.string().trim().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('').messages({
      'string.pattern.base': 'รูปแบบสีต้องเป็น hex color เช่น #FF0000',
    }),
    isActive: Joi.boolean().default(true),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต Room Type
 */
export const updateRoomType = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'ชื่อประเภทห้องต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    description: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'คำอธิบายต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    color: Joi.string().trim().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('').messages({
      'string.pattern.base': 'รูปแบบสีต้องเป็น hex color เช่น #FF0000',
    }),
    isActive: Joi.boolean(),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับการดึงข้อมูล Room Type ตาม ID
 */
export const getRoomTypeById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

/**
 * Schema สำหรับตรวจสอบการสร้างห้องใหม่
 */
export const createRoom = {
  body: Joi.object({
    name: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุชื่อห้อง',
      'string.max': 'ชื่อห้องต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อห้อง',
    }),
    roomNumber: Joi.string().required().trim().max(20).messages({
      'string.empty': 'กรุณาระบุเลขที่ห้อง',
      'string.max': 'เลขที่ห้องต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุเลขที่ห้อง',
    }),
    roomTypeId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุประเภทห้อง',
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา',
    }),
    capacity: Joi.number().integer().min(1).max(100).messages({
      'number.base': 'ความจุต้องเป็นตัวเลข',
      'number.integer': 'ความจุต้องเป็นจำนวนเต็ม',
      'number.min': 'ความจุต้องมากกว่า {#limit}',
      'number.max': 'ความจุต้องไม่เกิน {#limit}',
    }),
    // equipment: Joi.array().items(Joi.string().trim().max(100)).messages({
    //   'array.base': 'อุปกรณ์ต้องเป็น array',
    //   'string.max': 'ชื่ออุปกรณ์แต่ละรายการต้องไม่เกิน {#limit} ตัวอักษร',
    // }),
    description: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'คำอธิบายต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    status: Joi.string().valid(...Object.values(RoomStatus)).default(RoomStatus.AVAILABLE).messages({
      'any.only': 'สถานะต้องเป็น available, occupied, maintenance หรือ reserved เท่านั้น',
    }),
    isActive: Joi.boolean().default(true),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลห้อง
 */
export const updateRoom = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'ชื่อห้องต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    roomNumber: Joi.string().trim().max(20).messages({
      'string.max': 'เลขที่ห้องต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    roomTypeId: commonValidations.objectId.messages({
      'string.pattern.name': 'ประเภทห้องไม่ถูกต้อง',
    }),
    branchId: commonValidations.objectId.messages({
      'string.pattern.name': 'สาขาไม่ถูกต้อง',
    }),
    capacity: Joi.number().integer().min(1).max(100).messages({
      'number.base': 'ความจุต้องเป็นตัวเลข',
      'number.integer': 'ความจุต้องเป็นจำนวนเต็ม',
      'number.min': 'ความจุต้องมากกว่า {#limit}',
      'number.max': 'ความจุต้องไม่เกิน {#limit}',
    }),
    // equipment: Joi.array().items(Joi.string().trim().max(100)).messages({
    //   'array.base': 'อุปกรณ์ต้องเป็น array',
    //   'string.max': 'ชื่ออุปกรณ์แต่ละรายการต้องไม่เกิน {#limit} ตัวอักษร',
    // }),
    description: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'คำอธิบายต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    status: Joi.string().valid(...Object.values(RoomStatus)).messages({
      'any.only': 'สถานะต้องเป็น available, occupied, maintenance หรือ reserved เท่านั้น',
    }),
    isActive: Joi.boolean(),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลห้องตาม ID
 */
export const getRoomById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

/**
 * Schema สำหรับการอัปเดตสถานะห้อง
 */
export const updateRoomStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(RoomStatus)).required().messages({
      'any.only': 'สถานะต้องเป็น available, occupied, maintenance หรือ reserved เท่านั้น',
      'any.required': 'กรุณาระบุสถานะ',
    }),
  }),
};

/**
 * Schema สำหรับการอัปเดตสถานะการใช้งานห้อง
 */
export const updateRoomActiveStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    isActive: Joi.boolean().required().messages({
      'any.required': 'กรุณาระบุสถานะการใช้งาน',
    }),
  }),
};

export default {
  // Room Type validations
  createRoomType,
  updateRoomType,
  getRoomTypeById,
  
  // Room validations
  createRoom,
  updateRoom,
  getRoomById,
  updateRoomStatus,
  updateRoomActiveStatus,
};