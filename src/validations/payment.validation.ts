import Joi from 'joi';
import { PaymentMethod } from '../types/payment.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับ Service Item
 */
const serviceItemSchema = Joi.object({
  serviceId: commonValidations.objectId.required().messages({
    'any.required': 'กรุณาระบุ ID ของบริการ'
  }),
  serviceName: Joi.string().required().trim().max(200).messages({
    'string.empty': 'กรุณาระบุชื่อบริการ',
    'string.max': 'ชื่อบริการต้องไม่เกิน {#limit} ตัวอักษร',
    'any.required': 'กรุณาระบุชื่อบริการ'
  }),
  quantity: Joi.number().required().min(1).messages({
    'number.min': 'จำนวนต้องมากกว่า 0',
    'any.required': 'กรุณาระบุจำนวน'
  }),
  unitPrice: Joi.number().required().min(0).messages({
    'number.min': 'ราคาต่อหน่วยต้องไม่ติดลบ',
    'any.required': 'กรุณาระบุราคาต่อหน่วย'
  }),
  totalPrice: Joi.number().required().min(0).messages({
    'number.min': 'ราคารวมต้องไม่ติดลบ',
    'any.required': 'กรุณาระบุราคารวม'
  }),
  doctorId: commonValidations.objectId,
  notes: Joi.string().trim().max(500).allow('').messages({
    'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
  })
});

/**
 * Schema สำหรับสร้าง Payment
 */
export const createPayment = {
  body: Joi.object({
    patientName: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุชื่อผู้ป่วย',
      'string.max': 'ชื่อผู้ป่วยต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อผู้ป่วย'
    }),
    patientPhone: Joi.string().trim().max(20).allow('').messages({
      'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    patientEmail: Joi.string().email().trim().max(100).allow('').messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'string.max': 'อีเมลต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก'
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา'
    }),
    doctorId: commonValidations.objectId,
    services: Joi.array().items(serviceItemSchema).min(1).required().messages({
      'array.min': 'กรุณาระบุรายการบริการอย่างน้อย 1 รายการ',
      'any.required': 'กรุณาระบุรายการบริการ'
    }),
    discount: Joi.number().min(0).default(0).messages({
      'number.min': 'ส่วนลดต้องไม่ติดลบ'
    }),
    tax: Joi.number().min(0).default(0).messages({
      'number.min': 'ภาษีต้องไม่ติดลบ'
    }),
    dueDate: Joi.date().allow(null).messages({
      'date.base': 'รูปแบบวันครบกำหนดไม่ถูกต้อง'
    }),
    notes: Joi.string().trim().max(1000).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับอัปเดต Payment
 */
export const updatePayment = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    patientName: Joi.string().trim().max(200).messages({
      'string.max': 'ชื่อผู้ป่วยต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    patientPhone: Joi.string().trim().max(20).allow('').messages({
      'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    patientEmail: Joi.string().email().trim().max(100).allow('').messages({
      'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'string.max': 'อีเมลต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    services: Joi.array().items(serviceItemSchema).min(1).messages({
      'array.min': 'กรุณาระบุรายการบริการอย่างน้อย 1 รายการ'
    }),
    discount: Joi.number().min(0).messages({
      'number.min': 'ส่วนลดต้องไม่ติดลบ'
    }),
    tax: Joi.number().min(0).messages({
      'number.min': 'ภาษีต้องไม่ติดลบ'
    }),
    dueDate: Joi.date().allow(null).messages({
      'date.base': 'รูปแบบวันครบกำหนดไม่ถูกต้อง'
    }),
    notes: Joi.string().trim().max(1000).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  })
};

/**
 * Schema สำหรับสร้าง Payment Transaction
 */
export const createPaymentTransaction = {
  body: Joi.object({
    paymentId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุการชำระเงิน'
    }),
    amount: Joi.number().required().min(0.01).messages({
      'number.min': 'จำนวนเงินต้องมากกว่า 0',
      'any.required': 'กรุณาระบุจำนวนเงิน'
    }),
    method: Joi.string().valid(...Object.values(PaymentMethod)).required().messages({
      'any.only': 'วิธีการชำระเงินไม่ถูกต้อง',
      'any.required': 'กรุณาระบุวิธีการชำระเงิน'
    }),
    referenceNumber: Joi.string().trim().max(100).allow('').messages({
      'string.max': 'เลขอ้างอิงต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    processedAt: Joi.date().max('now').messages({
      'date.max': 'วันที่ดำเนินการต้องไม่เกินวันปัจจุบัน',
      'date.base': 'รูปแบบวันที่ไม่ถูกต้อง'
    })
  })
};

/**
 * Schema สำหรับดึงข้อมูลตาม ID
 */
export const getPaymentById = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

export default {
  createPayment,
  updatePayment,
  createPaymentTransaction,
  getPaymentById
};