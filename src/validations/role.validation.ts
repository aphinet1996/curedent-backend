import Joi from 'joi';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้าง custom role ใหม่
 */
export const createRole = {
  body: Joi.object({
    name: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[a-z_]+$/)
      .required()
      .messages({
        'string.pattern.base': 'ชื่อ role ต้องเป็นตัวอักษรเล็กและ underscore เท่านั้น',
        'string.min': 'ชื่อ role ต้องมีอย่างน้อย 3 ตัวอักษร',
        'string.max': 'ชื่อ role ต้องไม่เกิน 50 ตัวอักษร'
      }),
    displayName: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'ชื่อแสดงต้องมีอย่างน้อย 3 ตัวอักษร',
        'string.max': 'ชื่อแสดงต้องไม่เกิน 100 ตัวอักษร'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'
      }),
    permissions: Joi.array()
      .items(Joi.string())
      .min(1)
      .required()
      .messages({
        'array.min': 'ต้องระบุสิทธิ์อย่างน้อย 1 อัน'
      })
  })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต custom role
 */
export const updateRole = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    displayName: Joi.string()
      .min(3)
      .max(100)
      .messages({
        'string.min': 'ชื่อแสดงต้องมีอย่างน้อย 3 ตัวอักษร',
        'string.max': 'ชื่อแสดงต้องไม่เกิน 100 ตัวอักษร'
      }),
    description: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'
      }),
    permissions: Joi.array()
      .items(Joi.string())
      .min(1)
      .messages({
        'array.min': 'ต้องระบุสิทธิ์อย่างน้อย 1 อัน'
      })
  }).min(1).messages({
    'object.min': 'ต้องระบุข้อมูลที่ต้องการอัปเดตอย่างน้อย 1 ฟิลด์'
  })
};

/**
 * Schema สำหรับตรวจสอบการลบ role
 */
export const deleteRole = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับตรวจสอบการดึงข้อมูล role ตาม ID
 */
export const getRoleById = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับการค้นหา roles
 */
export const findRoles = {
  query: Joi.object({
    page: commonValidations.page,
    limit: commonValidations.limit,
    search: Joi.string().optional(),
    isSystem: Joi.boolean().optional(),
    clinicId: commonValidations.objectId.optional(),
    sortBy: commonValidations.sortBy.default('displayName'),
    sortOrder: commonValidations.sortOrder
  })
};

/**
 * Schema สำหรับการกำหนด role ให้ user
 */
export const assignRole = {
  params: Joi.object({
    userId: commonValidations.objectId.required()
  }),
  body: Joi.object({
    roleId: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับการตรวจสอบ permissions ที่ถูกต้อง
 */
export const validatePermissions = {
  body: Joi.object({
    permissions: Joi.array()
      .items(Joi.string())
      .required()
      .messages({
        'array.base': 'permissions ต้องเป็น array',
        'any.required': 'กรุณาระบุ permissions'
      })
  })
};

export default {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  findRoles,
  assignRole,
  validatePermissions
};