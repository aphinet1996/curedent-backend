import Joi from 'joi';
import {
  OpdSide,
  ToothSurface,
  ToothCondition,
  TreatmentType
} from '../types/opd.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Valid tooth numbers (FDI system)
 */
const validToothNumbers = [
  '11', '12', '13', '14', '15', '16', '17', '18',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '31', '32', '33', '34', '35', '36', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48'
];

/**
 * Schema สำหรับตรวจสอบข้อมูลฟัน
 */
const toothDataSchema = Joi.object({
  toothNumber: Joi.string()
    .valid(...validToothNumbers)
    .required()
    .messages({
      'any.only': 'หมายเลขซี่ฟันไม่ถูกต้อง (ใช้ระบบ FDI: 11-48)',
      'any.required': 'กรุณาระบุหมายเลขซี่ฟัน'
    }),
  surfaces: Joi.array()
    .items(Joi.string().valid(...Object.values(ToothSurface)))
    .min(1)
    .required()
    .messages({
      'array.min': 'กรุณาระบุหน้าฟันอย่างน้อย 1 หน้า',
      'any.required': 'กรุณาระบุหน้าฟัน'
    }),
  condition: Joi.string()
    .valid(...Object.values(ToothCondition))
    .required()
    .messages({
      'any.only': 'สภาพฟันไม่ถูกต้อง',
      'any.required': 'กรุณาระบุสภาพฟัน'
    }),
  treatment: Joi.string()
    .valid(...Object.values(TreatmentType))
    .messages({
      'any.only': 'ประเภทการรักษาไม่ถูกต้อง'
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
});

/**
 * Schema สำหรับตรวจสอบการวินิจฉัย
 */
const diagnosisSchema = Joi.object({
  code: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .messages({
      'string.max': 'รหัสการวินิจฉัยต้องไม่เกิน {#limit} ตัวอักษร'
    }),
  name: Joi.string()
    .required()
    .trim()
    .max(200)
    .messages({
      'string.empty': 'กรุณาระบุชื่อการวินิจฉัย',
      'string.max': 'ชื่อการวินิจฉัยต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อการวินิจฉัย'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'รายละเอียดการวินิจฉัยต้องไม่เกิน {#limit} ตัวอักษร'
    })
});

/**
 * Schema สำหรับตรวจสอบการรักษา
 */
const treatmentSchema = Joi.object({
  code: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .messages({
      'string.max': 'รหัสการรักษาต้องไม่เกิน {#limit} ตัวอักษร'
    }),
  name: Joi.string()
    .required()
    .trim()
    .max(200)
    .messages({
      'string.empty': 'กรุณาระบุชื่อการรักษา',
      'string.max': 'ชื่อการรักษาต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อการรักษา'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'รายละเอียดการรักษาต้องไม่เกิน {#limit} ตัวอักษร'
    }),
  cost: Joi.number()
    .min(0)
    .precision(2)
    .messages({
      'number.min': 'ค่าใช้จ่ายต้องไม่น้อยกว่า 0',
      'number.precision': 'ค่าใช้จ่ายสามารถมีทศนิยมได้สูงสุด 2 ตำแหน่ง'
    })
});

/**
 * Custom validation สำหรับตรวจสอบซี่ฟันซ้ำ
 */
const uniqueToothNumbers = (teeth: any[], helpers: any) => {
  if (!teeth || teeth.length === 0) return teeth;
  
  const toothNumbers = teeth.map(tooth => tooth.toothNumber);
  const uniqueNumbers = [...new Set(toothNumbers)];
  
  if (toothNumbers.length !== uniqueNumbers.length) {
    return helpers.error('teeth.unique');
  }
  
  return teeth;
};

/**
 * Schema สำหรับตรวจสอบการสร้าง OPD ใหม่
 */
export const createOpd = {
  body: Joi.object({
    title: Joi.string()
      .trim()
      .max(100)
      .messages({
        'string.max': 'หัวข้อต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    date: Joi.date()
      .max('now')
      .required()
      .messages({
        'date.max': 'วันที่ต้องไม่เกินวันปัจจุบัน',
        'date.base': 'รูปแบบวันที่ไม่ถูกต้อง',
        'any.required': 'กรุณาระบุวันที่'
      }),
    patientId: commonValidations.objectId
      .required()
      .messages({
        'any.required': 'กรุณาระบุผู้ป่วย'
      }),
    dentistId: commonValidations.objectId
      .required()
      .messages({
        'any.required': 'กรุณาระบุทันตแพทย์'
      }),
    clinicId: commonValidations.objectId
      .required()
      .messages({
        'any.required': 'กรุณาระบุคลินิก'
      }),
    branchId: commonValidations.objectId
      .messages({
        'string.pattern.name': 'รูปแบบ branchId ไม่ถูกต้อง'
      }),
    chiefComplaint: Joi.string()
      .required()
      .trim()
      .max(2000)
      .messages({
        'string.empty': 'กรุณาระบุข้อร้องเรียนหลัก',
        'string.max': 'ข้อร้องเรียนหลักต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุข้อร้องเรียนหลัก'
      }),
    side: Joi.string()
      .valid(...Object.values(OpdSide))
      .required()
      .messages({
        'any.only': 'ด้านไม่ถูกต้อง',
        'any.required': 'กรุณาระบุด้าน'
      }),
    teeth: Joi.array()
      .items(toothDataSchema)
      .custom(uniqueToothNumbers)
      .default([])
      .messages({
        'teeth.unique': 'ไม่สามารถมีซี่ฟันซ้ำกันได้'
      }),
    io: Joi.string()
      .required()
      .trim()
      .max(5000)
      .messages({
        'string.empty': 'กรุณาระบุผลการตรวจ I/O',
        'string.max': 'ผลการตรวจ I/O ต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุผลการตรวจ I/O'
      }),
    diagnosis: Joi.array()
      .items(diagnosisSchema)
      .min(1)
      .required()
      .messages({
        'array.min': 'กรุณาระบุการวินิจฉัยอย่างน้อย 1 รายการ',
        'any.required': 'กรุณาระบุการวินิจฉัย'
      }),
    treatment: Joi.array()
      .items(treatmentSchema)
      .min(1)
      .required()
      .messages({
        'array.min': 'กรุณาระบุการรักษาอย่างน้อย 1 รายการ',
        'any.required': 'กรุณาระบุการรักษา'
      }),
    remark: Joi.string()
      .trim()
      .max(2000)
      .allow('')
      .messages({
        'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    status: Joi.string()
      .valid('draft', 'completed', 'cancelled')
      .default('draft')
      .messages({
        'any.only': 'สถานะไม่ถูกต้อง'
      })
  })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต OPD
 */
export const updateOpd = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    title: Joi.string()
      .trim()
      .max(100)
      .messages({
        'string.max': 'หัวข้อต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    date: Joi.date()
      .max('now')
      .messages({
        'date.max': 'วันที่ต้องไม่เกินวันปัจจุบัน',
        'date.base': 'รูปแบบวันที่ไม่ถูกต้อง'
      }),
    dentistId: commonValidations.objectId
      .messages({
        'string.pattern.name': 'รูปแบบ dentistId ไม่ถูกต้อง'
      }),
    branchId: commonValidations.objectId
      .messages({
        'string.pattern.name': 'รูปแบบ branchId ไม่ถูกต้อง'
      }),
    chiefComplaint: Joi.string()
      .trim()
      .max(2000)
      .messages({
        'string.max': 'ข้อร้องเรียนหลักต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    side: Joi.string()
      .valid(...Object.values(OpdSide))
      .messages({
        'any.only': 'ด้านไม่ถูกต้อง'
      }),
    teeth: Joi.array()
      .items(toothDataSchema)
      .custom(uniqueToothNumbers)
      .messages({
        'teeth.unique': 'ไม่สามารถมีซี่ฟันซ้ำกันได้'
      }),
    io: Joi.string()
      .trim()
      .max(5000)
      .messages({
        'string.max': 'ผลการตรวจ I/O ต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    diagnosis: Joi.array()
      .items(diagnosisSchema)
      .min(1)
      .messages({
        'array.min': 'กรุณาระบุการวินิจฉัยอย่างน้อย 1 รายการ'
      }),
    treatment: Joi.array()
      .items(treatmentSchema)
      .min(1)
      .messages({
        'array.min': 'กรุณาระบุการรักษาอย่างน้อย 1 รายการ'
      }),
    remark: Joi.string()
      .trim()
      .max(2000)
      .allow('')
      .messages({
        'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
      }),
    status: Joi.string()
      .valid('draft', 'completed', 'cancelled')
      .messages({
        'any.only': 'สถานะไม่ถูกต้อง'
      })
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  })
};

/**
 * Schema สำหรับการดึงข้อมูล OPD ตาม ID
 */
export const getOpdById = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับการอัปเดตสถานะ OPD
 */
export const updateOpdStatus = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    status: Joi.string()
      .valid('draft', 'completed', 'cancelled')
      .required()
      .messages({
        'any.only': 'สถานะไม่ถูกต้อง',
        'any.required': 'กรุณาระบุสถานะ'
      })
  })
};

/**
 * Schema สำหรับการเพิ่มฟัน
 */
export const addTooth = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: toothDataSchema
};

/**
 * Schema สำหรับการลบฟัน
 */
export const removeTooth = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
    toothNumber: Joi.string()
      .valid(...validToothNumbers)
      .required()
      .messages({
        'any.only': 'หมายเลขซี่ฟันไม่ถูกต้อง',
        'any.required': 'กรุณาระบุหมายเลขซี่ฟัน'
      })
  })
};

/**
 * Schema สำหรับการอัปเดตสภาพฟัน
 */
export const updateToothCondition = {
  params: Joi.object({
    id: commonValidations.objectId.required(),
    toothNumber: Joi.string()
      .valid(...validToothNumbers)
      .required()
      .messages({
        'any.only': 'หมายเลขซี่ฟันไม่ถูกต้อง',
        'any.required': 'กรุณาระบุหมายเลขซี่ฟัน'
      })
  }),
  body: Joi.object({
    condition: Joi.string()
      .valid(...Object.values(ToothCondition))
      .required()
      .messages({
        'any.only': 'สภาพฟันไม่ถูกต้อง',
        'any.required': 'กรุณาระบุสภาพฟัน'
      }),
    treatment: Joi.string()
      .valid(...Object.values(TreatmentType))
      .messages({
        'any.only': 'ประเภทการรักษาไม่ถูกต้อง'
      }),
    notes: Joi.string()
      .trim()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
      })
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  })
};

/**
 * Schema สำหรับการค้นหา OPD
 */
export const searchOpd = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('date'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    
    // Filter options
    patientId: commonValidations.objectId,
    dentistId: commonValidations.objectId,
    clinicId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    status: Joi.string().valid('draft', 'completed', 'cancelled'),
    startDate: Joi.date(),
    endDate: Joi.date(),
    toothNumber: Joi.string().valid(...validToothNumbers),
    condition: Joi.string().valid(...Object.values(ToothCondition)),
    treatment: Joi.string().valid(...Object.values(TreatmentType)),
    
    // Search
    search: Joi.string().trim().max(100)
  })
};

export default {
  createOpd,
  updateOpd,
  getOpdById,
  updateOpdStatus,
  addTooth,
  removeTooth,
  updateToothCondition,
  searchOpd
};