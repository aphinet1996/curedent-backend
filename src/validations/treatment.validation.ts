import Joi from 'joi';
import { FeeType } from '../types/treatment.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบ Fee
 */
const feeSchema = Joi.object({
  amount: Joi.number().min(0).required().messages({
    'number.base': 'จำนวนเงินต้องเป็นตัวเลข',
    'number.min': 'จำนวนเงินต้องไม่น้อยกว่า 0',
    'any.required': 'กรุณาระบุจำนวนเงิน'
  }),
  type: Joi.string().valid(...Object.values(FeeType)).required().messages({
    'any.only': 'ประเภทค่าธรรมเนียมต้องเป็น percentage หรือ fixed เท่านั้น',
    'any.required': 'กรุณาระบุประเภทค่าธรรมเนียม'
  })
}).custom((value, helpers) => {
  // ตรวจสอบว่าถ้าเป็น percentage ต้องไม่เกิน 100
  if (value.type === FeeType.PERCENTAGE && value.amount > 100) {
    return helpers.error('any.invalid', { message: 'เปอร์เซ็นต์ต้องไม่เกิน 100' });
  }
  return value;
});

/**
 * Schema สำหรับตรวจสอบการสร้างการรักษาใหม่
 */
export const createTreatment = {
  body: Joi.object({
    name: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุชื่อการรักษา',
      'string.max': 'ชื่อการรักษาต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อการรักษา',
    }),
    price: Joi.number().required().min(0).messages({
      'number.base': 'ราคาต้องเป็นตัวเลข',
      'number.min': 'ราคาต้องไม่น้อยกว่า 0',
      'any.required': 'กรุณาระบุราคา',
    }),
    includeVat: Joi.boolean().default(false).messages({
      'boolean.base': 'สถานะ VAT ต้องเป็น true หรือ false เท่านั้น'
    }),
    doctorFee: feeSchema.optional().messages({
      'object.base': 'ค่าธรรมเนียมหมอต้องเป็น object'
    }),
    assistantFee: feeSchema.optional().messages({
      'object.base': 'ค่าธรรมเนียมผู้ช่วยต้องเป็น object'
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก',
    }),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลการรักษา
 */
export const updateTreatment = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(200).messages({
      'string.max': 'ชื่อการรักษาต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    price: Joi.number().min(0).messages({
      'number.base': 'ราคาต้องเป็นตัวเลข',
      'number.min': 'ราคาต้องไม่น้อยกว่า 0',
    }),
    includeVat: Joi.boolean().messages({
      'boolean.base': 'สถานะ VAT ต้องเป็น true หรือ false เท่านั้น'
    }),
    doctorFee: feeSchema.optional().allow(null).messages({
      'object.base': 'ค่าธรรมเนียมหมอต้องเป็น object'
    }),
    assistantFee: feeSchema.optional().allow(null).messages({
      'object.base': 'ค่าธรรมเนียมผู้ช่วยต้องเป็น object'
    }),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลการรักษาตาม ID
 */
export const getTreatmentById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  query: Joi.object({
    includeCalculations: Joi.boolean().default(false).messages({
      'boolean.base': 'includeCalculations ต้องเป็น true หรือ false เท่านั้น'
    })
  })
};

/**
 * Schema สำหรับการคำนวณค่าธรรมเนียม
 */
export const calculateFees = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    doctorFee: feeSchema.optional(),
    assistantFee: feeSchema.optional(),
    includeVat: Joi.boolean().optional()
  })
};

export default {
  createTreatment,
  updateTreatment,
  getTreatmentById,
  calculateFees,
};