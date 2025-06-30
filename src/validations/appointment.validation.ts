import Joi from 'joi';
import { AppointmentStatus, AppointmentType } from '../types/appointment.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับเวลา (HH:mm format)
 */
const timeFormat = Joi.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
  'string.pattern.base': 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)'
});

/**
 * Schema สำหรับ appointment tag
 */
const appointmentTagSchema = Joi.object({
  name: Joi.string().required().trim().max(50).messages({
    'string.empty': 'ชื่อแท็กเป็นข้อมูลที่จำเป็น',
    'string.max': 'ชื่อแท็กต้องไม่เกิน {#limit} ตัวอักษร',
    'any.required': 'ชื่อแท็กเป็นข้อมูลที่จำเป็น'
  }),
  color: Joi.string().trim().max(20).messages({
    'string.max': 'สีแท็กต้องไม่เกิน {#limit} ตัวอักษร'
  }),
  description: Joi.string().trim().max(200).messages({
    'string.max': 'คำอธิบายแท็กต้องไม่เกิน {#limit} ตัวอักษร'
  })
});

/**
 * Schema สำหรับข้อมูลผู้ป่วยในระบบ
 */
const registeredPatientSchema = Joi.object({
  isRegistered: Joi.boolean().valid(true).required(),
  patientId: commonValidations.objectId.required().messages({
    'any.required': 'รหัสผู้ป่วยเป็นข้อมูลที่จำเป็น'
  })
});

/**
 * Schema สำหรับข้อมูลผู้ป่วยที่ไม่มีในระบบ
 */
const guestPatientSchema = Joi.object({
  isRegistered: Joi.boolean().valid(false).required(),
  name: Joi.string().required().trim().max(200).messages({
    'string.empty': 'ชื่อผู้ป่วยเป็นข้อมูลที่จำเป็น',
    'string.max': 'ชื่อผู้ป่วยต้องไม่เกิน {#limit} ตัวอักษร',
    'any.required': 'ชื่อผู้ป่วยเป็นข้อมูลที่จำเป็น'
  }),
  phone: Joi.string().required().trim().max(20).messages({
    'string.empty': 'เบอร์โทรศัพท์เป็นข้อมูลที่จำเป็น',
    'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
    'any.required': 'เบอร์โทรศัพท์เป็นข้อมูลที่จำเป็น'
  }),
  email: Joi.string().email().trim().messages({
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง'
  })
});

/**
 * Schema สำหรับข้อมูลผู้ป่วย (Discriminated Union)
 */
const patientInfoSchema = Joi.alternatives().try(
  registeredPatientSchema,
  guestPatientSchema
).required().messages({
  'any.required': 'ข้อมูลผู้ป่วยเป็นข้อมูลที่จำเป็น'
});

/**
 * Schema สำหรับ Google Calendar info
 */
const googleCalendarSchema = Joi.object({
  eventId: Joi.string().trim(),
  calendarId: Joi.string().trim(),
  syncStatus: Joi.string().valid('pending', 'synced', 'failed'),
  lastSyncAt: Joi.date(),
  syncError: Joi.string().trim().max(500)
});

/**
 * Custom validation สำหรับเวลา
 */
const timeValidation = (value: any, helpers: any) => {
  const startTime = value.startTime;
  const endTime = value.endTime;
  
  if (startTime && endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      return helpers.error('custom.endTimeAfterStartTime');
    }
    
    // ตรวจสอบระยะเวลาขั้นต่ำ (15 นาที)
    if (endMinutes - startMinutes < 15) {
      return helpers.error('custom.minimumDuration');
    }
  }
  
  return value;
};

/**
 * Schema สำหรับการสร้างการนัดหมายใหม่
 */
export const createAppointment = {
  body: Joi.object({
    title: Joi.string().trim().max(1000).messages({
      'string.max': 'ไตเติลต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    patient: patientInfoSchema,
    appointmentDate: Joi.date().min('now').required().messages({
      'date.base': 'รูปแบบวันที่นัดหมายไม่ถูกต้อง',
      'date.min': 'วันที่นัดหมายต้องเป็นวันนี้หรือในอนาคต',
      'any.required': 'วันที่นัดหมายเป็นข้อมูลที่จำเป็น'
    }),
    startTime: timeFormat.required().messages({
      'any.required': 'เวลาเริ่มต้นเป็นข้อมูลที่จำเป็น'
    }),
    endTime: timeFormat.required().messages({
      'any.required': 'เวลาสิ้นสุดเป็นข้อมูลที่จำเป็น'
    }),
    type: Joi.string().valid(...Object.values(AppointmentType)).required().messages({
      'any.only': 'ประเภทการนัดหมายไม่ถูกต้อง',
      // 'any.required': 'ประเภทการนัดหมายเป็นข้อมูลที่จำเป็น'
    }),
    status: Joi.string().valid(...Object.values(AppointmentStatus)).messages({
      'any.only': 'สถานะการนัดหมายไม่ถูกต้อง'
    }),
    tags: Joi.array().items(appointmentTagSchema).messages({
      'array.base': 'แท็กต้องเป็น array'
    }),
    notes: Joi.string().trim().max(1000).messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    syncWithGoogleCalendar: Joi.boolean(),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสสาขาเป็นข้อมูลที่จำเป็น'
    }),
    doctorId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสแพทย์เป็นข้อมูลที่จำเป็น'
    }),
    isActive: Joi.boolean().default(true)
  }).custom(timeValidation, 'Time validation').messages({
    'custom.endTimeAfterStartTime': 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
    'custom.minimumDuration': 'การนัดหมายต้องมีระยะเวลาอย่างน้อย 15 นาที'
  })
};

/**
 * Schema สำหรับการอัปเดตการนัดหมาย
 */
export const updateAppointment = {
  params: Joi.object({
    id: commonValidations.objectId.required().messages({
      'any.required': 'รหัสการนัดหมายเป็นข้อมูลที่จำเป็น'
    })
  }),
  body: Joi.object({
    title: Joi.string().trim().max(1000).messages({
      'string.max': 'ไตเติลต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    patient: patientInfoSchema,
    appointmentDate: Joi.date().messages({
      'date.base': 'รูปแบบวันที่นัดหมายไม่ถูกต้อง'
    }),
    startTime: timeFormat,
    endTime: timeFormat,
    type: Joi.string().valid(...Object.values(AppointmentType)).messages({
      'any.only': 'ประเภทการนัดหมายไม่ถูกต้อง'
    }),
    status: Joi.string().valid(...Object.values(AppointmentStatus)).messages({
      'any.only': 'สถานะการนัดหมายไม่ถูกต้อง'
    }),
    tags: Joi.array().items(appointmentTagSchema),
    notes: Joi.string().trim().max(1000).messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    googleCalendar: googleCalendarSchema,
    branchId: commonValidations.objectId.messages({
      'string.pattern.name': 'รหัสสาขาไม่ถูกต้อง'
    }),
    doctorId: commonValidations.objectId.messages({
      'string.pattern.name': 'รหัสแพทย์ไม่ถูกต้อง'
    }),
    isActive: Joi.boolean()
  }).min(1).custom(timeValidation, 'Time validation').messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง',
    'custom.endTimeAfterStartTime': 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
    'custom.minimumDuration': 'การนัดหมายต้องมีระยะเวลาอย่างน้อย 15 นาที'
  })
};

/**
 * Schema สำหรับการดึงข้อมูลการนัดหมายตาม ID
 */
export const getAppointmentById = {
  params: Joi.object({
    id: commonValidations.objectId.required().messages({
      'any.required': 'รหัสการนัดหมายเป็นข้อมูลที่จำเป็น'
    })
  })
};

/**
 * Schema สำหรับการค้นหาการนัดหมาย
 */
export const getAppointments = {
  query: Joi.object({
    // Pagination
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
    
    // Filters
    branchId: commonValidations.objectId,
    doctorId: commonValidations.objectId,
    patientId: commonValidations.objectId,
    status: Joi.string().valid(...Object.values(AppointmentStatus)),
    type: Joi.string().valid(...Object.values(AppointmentType)),
    isActive: Joi.boolean(),
    
    // Date filters
    startDate: Joi.date(),
    endDate: Joi.date(),
    date: Joi.date(), // สำหรับวันที่เฉพาะ
    
    // Search
    search: Joi.string().trim().max(100),
    
    // Sort
    sortBy: Joi.string().valid(
      'appointmentDate', 
      'startTime', 
      'createdAt', 
      'updatedAt',
      'status',
      'type'
    ).default('appointmentDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    
    // Populate
    populate: Joi.string().trim()
  }).custom((value, helpers) => {
    // ตรวจสอบช่วงวันที่
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      return helpers.error('custom.invalidDateRange');
    }
    return value;
  }, 'Date range validation').messages({
    'custom.invalidDateRange': 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
  })
};

/**
 * Schema สำหรับการดึงตารางงานของแพทย์
 */
export const getDoctorSchedule = {
  params: Joi.object({
    doctorId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสแพทย์เป็นข้อมูลที่จำเป็น'
    })
  }),
  query: Joi.object({
    startDate: Joi.date().required().messages({
      'date.base': 'รูปแบบวันที่เริ่มต้นไม่ถูกต้อง',
      'any.required': 'วันที่เริ่มต้นเป็นข้อมูลที่จำเป็น'
    }),
    endDate: Joi.date().required().messages({
      'date.base': 'รูปแบบวันที่สิ้นสุดไม่ถูกต้อง',
      'any.required': 'วันที่สิ้นสุดเป็นข้อมูลที่จำเป็น'
    })
  }).custom((value, helpers) => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      return helpers.error('custom.invalidDateRange');
    }
    return value;
  }).messages({
    'custom.invalidDateRange': 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
  })
};

/**
 * Schema สำหรับการดึงการนัดหมายของผู้ป่วย
 */
export const getPatientAppointments = {
  params: Joi.object({
    patientId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสผู้ป่วยเป็นข้อมูลที่จำเป็น'
    })
  })
};

/**
 * Schema สำหรับการตรวจสอบความพร้อมของเวลา
 */
export const checkAvailability = {
  body: Joi.object({
    doctorId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสแพทย์เป็นข้อมูลที่จำเป็น'
    }),
    appointmentDate: Joi.date().min('now').required().messages({
      'date.base': 'รูปแบบวันที่นัดหมายไม่ถูกต้อง',
      'date.min': 'วันที่นัดหมายต้องเป็นวันนี้หรือในอนาคต',
      'any.required': 'วันที่นัดหมายเป็นข้อมูลที่จำเป็น'
    }),
    startTime: timeFormat.required().messages({
      'any.required': 'เวลาเริ่มต้นเป็นข้อมูลที่จำเป็น'
    }),
    endTime: timeFormat.required().messages({
      'any.required': 'เวลาสิ้นสุดเป็นข้อมูลที่จำเป็น'
    }),
    excludeAppointmentId: commonValidations.objectId
  }).custom(timeValidation, 'Time validation').messages({
    'custom.endTimeAfterStartTime': 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
    'custom.minimumDuration': 'การนัดหมายต้องมีระยะเวลาอย่างน้อย 15 นาที'
  })
};

/**
 * Schema สำหรับการอัปเดตสถานะหลายรายการ
 */
export const bulkUpdateStatus = {
  body: Joi.object({
    appointmentIds: Joi.array().items(commonValidations.objectId).min(1).required().messages({
      'array.min': 'ต้องระบุรหัสการนัดหมายอย่างน้อย 1 รายการ',
      'array.base': 'รายการรหัสการนัดหมายต้องเป็น array',
      'any.required': 'รายการรหัสการนัดหมายเป็นข้อมูลที่จำเป็น'
    }),
    status: Joi.string().valid(...Object.values(AppointmentStatus)).required().messages({
      'any.only': 'สถานะไม่ถูกต้อง',
      'any.required': 'สถานะเป็นข้อมูลที่จำเป็น'
    })
  })
};

/**
 * Schema สำหรับการดึงการนัดหมายตามสาขา
 */
export const getAppointmentsByBranch = {
  params: Joi.object({
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'รหัสสาขาเป็นข้อมูลที่จำเป็น'
    })
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...Object.values(AppointmentStatus)),
    startDate: Joi.date(),
    endDate: Joi.date()
  })
};

/**
 * Schema สำหรับสถิติการนัดหมาย
 */
export const getAppointmentStats = {
  params: Joi.object({
    clinicId: commonValidations.objectId,
    branchId: commonValidations.objectId
  }),
  query: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date()
  })
};

// เพิ่มใน appointment.validation.ts

/**
 * Schema สำหรับ Calendar Day View
 */
export const getCalendarDayView = {
  query: Joi.object({
    date: Joi.date().required().messages({
      'date.base': 'รูปแบบวันที่ไม่ถูกต้อง',
      'any.required': 'วันที่เป็นข้อมูลที่จำเป็น'
    }),
    doctorId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    status: Joi.string().valid(...Object.values(AppointmentStatus)),
    timezone: Joi.string().default('Asia/Bangkok'),
    populate: Joi.string().trim()
  })
};

/**
 * Schema สำหรับ Calendar Week View
 */
export const getCalendarWeekView = {
  query: Joi.object({
    // สามารถส่งมาเป็น start date หรือ date ใดๆ ในสัปดาห์นั้น
    date: Joi.date().required().messages({
      'date.base': 'รูปแบบวันที่ไม่ถูกต้อง',
      'any.required': 'วันที่เป็นข้อมูลที่จำเป็น'
    }),
    // หรือส่ง start/end date มาเลย
    startDate: Joi.date(),
    endDate: Joi.date(),
    
    doctorId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    status: Joi.string().valid(...Object.values(AppointmentStatus)),
    timezone: Joi.string().default('Asia/Bangkok'),
    weekStartsOn: Joi.number().integer().min(0).max(6).default(1).messages({
      'number.base': 'วันเริ่มต้นสัปดาห์ต้องเป็นตัวเลข',
      'number.min': 'วันเริ่มต้นสัปดาห์ต้องเป็น 0-6 (0=อาทิตย์, 1=จันทร์)',
      'number.max': 'วันเริ่มต้นสัปดาห์ต้องเป็น 0-6 (0=อาทิตย์, 1=จันทร์)'
    }),
    populate: Joi.string().trim()
  }).custom((value, helpers) => {
    // ถ้าส่ง startDate/endDate มา ต้องส่งมาครบ
    if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
      return helpers.error('custom.incompleteWeekRange');
    }
    return value;
  }).messages({
    'custom.incompleteWeekRange': 'ถ้าระบุ startDate หรือ endDate ต้องระบุทั้งคู่'
  })
};

/**
 * Schema สำหรับ Calendar Month View
 */
export const getCalendarMonthView = {
  query: Joi.object({
    // ส่งเป็น date ใดๆ ในเดือนนั้น หรือ year/month
    date: Joi.date(),
    year: Joi.number().integer().min(2020).max(2030),
    month: Joi.number().integer().min(1).max(12),
    
    doctorId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    status: Joi.string().valid(...Object.values(AppointmentStatus)),
    timezone: Joi.string().default('Asia/Bangkok'),
    includeAdjacentDays: Joi.boolean().default(false).messages({
      'boolean.base': 'includeAdjacentDays ต้องเป็น boolean'
    }),
    populate: Joi.string().trim()
  }).custom((value, helpers) => {
    // ต้องมีอย่างใดอย่างหนึ่ง: date หรือ year+month
    if (!value.date && !(value.year && value.month)) {
      return helpers.error('custom.missingDateOrYearMonth');
    }
    if (value.date && (value.year || value.month)) {
      return helpers.error('custom.conflictingDateParams');
    }
    return value;
  }).messages({
    'custom.missingDateOrYearMonth': 'ต้องระบุ date หรือ year+month',
    'custom.conflictingDateParams': 'ไม่สามารถระบุทั้ง date และ year/month พร้อมกันได้'
  })
};

/**
 * Helper function สำหรับแปลงเวลาเป็นนาที
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Export ทั้งหมด
 */
export default {
  createAppointment,
  updateAppointment,
  getAppointmentById,
  getAppointments,
  getDoctorSchedule,
  getPatientAppointments,
  checkAvailability,
  bulkUpdateStatus,
  getAppointmentsByBranch,
  getAppointmentStats,
  getCalendarDayView,
  getCalendarWeekView,
  getCalendarMonthView
};