import Joi from 'joi';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้างการวินิจฉัยใหม่
 */
export const createDiagnosis = {
  body: Joi.object({
    name: Joi.string().required().trim().max(200)
      .messages({
        'string.empty': 'กรุณาระบุชื่อการวินิจฉัย',
        'string.max': 'ชื่อการวินิจฉัยต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุชื่อการวินิจฉัย',
      }),
    clinicId: commonValidations.objectId.required()
      .messages({
        'any.required': 'กรุณาระบุคลินิก',
      }),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลการวินิจฉัย
 */
export const updateDiagnosis = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(200).required()
      .messages({
        'string.empty': 'กรุณาระบุชื่อการวินิจฉัย',
        'string.max': 'ชื่อการวินิจฉัยต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุชื่อการวินิจฉัย',
      }),
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลการวินิจฉัยตาม ID
 */
export const getDiagnosisById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
};

export default {
  createDiagnosis,
  updateDiagnosis,
  getDiagnosisById,
};