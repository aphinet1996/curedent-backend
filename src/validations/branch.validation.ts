import Joi from 'joi';
import { BranchStatus } from '../types/branch.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบการสร้างสาขาใหม่
 */
export const createBranch = {
  body: Joi.object({
    name: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุชื่อสาขา',
      'string.max': 'ชื่อสาขาต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อสาขา',
    }),
    photo: Joi.string().trim().allow('', null),
    tel: Joi.string().required().trim().max(20).messages({
      'string.empty': 'กรุณาระบุเบอร์โทรศัพท์',
      'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุเบอร์โทรศัพท์',
    }),
    address: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุที่อยู่',
      'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุที่อยู่',
    }),
    subdistrict: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุตำบล/แขวง',
      'string.max': 'ตำบล/แขวงต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุตำบล/แขวง',
    }),
    district: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุอำเภอ/เขต',
      'string.max': 'อำเภอ/เขตต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุอำเภอ/เขต',
    }),
    province: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุจังหวัด',
      'string.max': 'จังหวัดต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุจังหวัด',
    }),
    zipcode: Joi.string().required().trim().length(5).pattern(/^[0-9]+$/).messages({
      'string.empty': 'กรุณาระบุรหัสไปรษณีย์',
      'string.length': 'รหัสไปรษณีย์ต้องมี {#limit} ตัวอักษร',
      'string.pattern.base': 'รหัสไปรษณีย์ต้องเป็นตัวเลขเท่านั้น',
      'any.required': 'กรุณาระบุรหัสไปรษณีย์',
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก',
    }),
    linkMap: Joi.string().trim().uri().allow('', null).messages({
      'string.uri': 'ลิงค์แผนที่ไม่ถูกต้อง',
    }),
    status: Joi.string().valid(...Object.values(BranchStatus)).default(BranchStatus.ACTIVE),
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตข้อมูลสาขา
 */
export const updateBranch = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().max(100).messages({
      'string.max': 'ชื่อสาขาต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    photo: Joi.string().trim().allow('', null),
    tel: Joi.string().trim().max(20).messages({
      'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    address: Joi.string().trim().max(200).messages({
      'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    subdistrict: Joi.string().trim().max(100).messages({
      'string.max': 'ตำบล/แขวงต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    district: Joi.string().trim().max(100).messages({
      'string.max': 'อำเภอ/เขตต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    province: Joi.string().trim().max(100).messages({
      'string.max': 'จังหวัดต้องไม่เกิน {#limit} ตัวอักษร',
    }),
    zipcode: Joi.string().trim().length(5).pattern(/^[0-9]+$/).messages({
      'string.length': 'รหัสไปรษณีย์ต้องมี {#limit} ตัวอักษร',
      'string.pattern.base': 'รหัสไปรษณีย์ต้องเป็นตัวเลขเท่านั้น',
    }),
    linkMap: Joi.string().trim().uri().allow('', null).messages({
      'string.uri': 'ลิงค์แผนที่ไม่ถูกต้อง',
    }),
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตสถานะของสาขา
 */
export const updateBranchStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(BranchStatus)).required().messages({
      'any.only': 'สถานะต้องเป็น active หรือ inactive เท่านั้น',
      'string.empty': 'กรุณาระบุสถานะ',
      'any.required': 'กรุณาระบุสถานะ',
    }),
  }),
};

/**
 * Schema สำหรับการดึงข้อมูลสาขาตาม ID
 */
export const getBranchById = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  }),
  query: Joi.object({
    includeRoomsSummary: Joi.boolean().default(false).messages({
      'boolean.base': 'includeRoomsSummary ต้องเป็น true หรือ false เท่านั้น'
    })
  })
};

/**
 * Schema สำหรับการดึงข้อมูลสาขาทั้งหมด
 */
export const getAllBranches = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'หน้าต้องเป็นตัวเลข',
      'number.integer': 'หน้าต้องเป็นจำนวนเต็ม',
      'number.min': 'หน้าต้องมากกว่า 0'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'จำนวนรายการต่อหน้าต้องเป็นตัวเลข',
      'number.integer': 'จำนวนรายการต่อหน้าต้องเป็นจำนวนเต็ม',
      'number.min': 'จำนวนรายการต่อหน้าต้องมากกว่า 0',
      'number.max': 'จำนวนรายการต่อหน้าต้องไม่เกิน 100'
    }),
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'status').default('createdAt').messages({
      'any.only': 'การเรียงลำดับต้องเป็น name, createdAt, updatedAt หรือ status เท่านั้น'
    }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'ลำดับการเรียงต้องเป็น asc หรือ desc เท่านั้น'
    }),
    status: Joi.string().valid(...Object.values(BranchStatus)).messages({
      'any.only': 'สถานะต้องเป็น active หรือ inactive เท่านั้น'
    }),
    clinicId: commonValidations.objectId.messages({
      'string.pattern.name': 'รูปแบบ clinic ID ไม่ถูกต้อง'
    }),
    search: Joi.string().trim().max(100).messages({
      'string.max': 'คำค้นหาต้องไม่เกิน 100 ตัวอักษร'
    }),
    includeRoomsSummary: Joi.boolean().default(false).messages({
      'boolean.base': 'includeRoomsSummary ต้องเป็น true หรือ false เท่านั้น'
    })
  })
};

/**
 * Schema สำหรับการดึงข้อมูลสาขาตาม clinic
 */
export const getBranchesByClinic = {
  params: Joi.object({
    clinicId: commonValidations.objectId.optional()
  }),
  query: Joi.object({
    includeRoomsSummary: Joi.boolean().default(false).messages({
      'boolean.base': 'includeRoomsSummary ต้องเป็น true หรือ false เท่านั้น'
    })
  })
};

/**
 * Schema สำหรับการดึงสถิติสาขา
 */
export const getBranchStats = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
  })
};

/**
 * Schema สำหรับการดึงสถิติสาขาของคลินิก
 */
export const getClinicBranchesStats = {
  params: Joi.object({
    clinicId: commonValidations.objectId.optional()
  })
};

export default {
  createBranch,
  updateBranch,
  updateBranchStatus,
  getBranchById,
  getAllBranches,
  getBranchesByClinic,
  getBranchStats,
  getClinicBranchesStats,
};