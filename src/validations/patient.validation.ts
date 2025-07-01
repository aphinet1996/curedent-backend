import Joi from 'joi';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับตรวจสอบข้อมูลหลายภาษา (รองรับทั้ง string และ object)
 */
const flexibleMultilingualSchema = (maxLength: number = 100, required: boolean = true) => {
    const baseSchema = Joi.alternatives().try(
        // รองรับ string ธรรมดา (backward compatibility)
        Joi.string().trim().max(maxLength),
        // รองรับ multilingual object
        Joi.object({
            th: Joi.string().required().trim().max(maxLength).messages({
                'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
                'string.max': `ข้อมูลภาษาไทยต้องไม่เกิน ${maxLength} ตัวอักษร`,
                'any.required': 'กรุณาระบุข้อมูลภาษาไทย',
            }),
            en: Joi.string().trim().max(maxLength).allow('').messages({
                'string.max': `ข้อมูลภาษาอังกฤษต้องไม่เกิน ${maxLength} ตัวอักษร`,
            })
        })
    );

    return required ? baseSchema.required() : baseSchema.allow(null);
};

/**
 * Schema สำหรับตรวจสอบข้อมูลหลายภาษา (แบบเดิม - ใช้สำหรับ required fields)
 */
const multilingualTextSchema = Joi.object({
    th: Joi.string().required().trim().max(100).messages({
        'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
        'string.max': 'ข้อมูลภาษาไทยต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุข้อมูลภาษาไทย',
    }),
    en: Joi.string().trim().max(100).allow('').messages({
        'string.max': 'ข้อมูลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
    })
});

/**
 * Schema สำหรับตรวจสอบคำนำหน้าชื่อ
 */
const titlePrefixSchema = flexibleMultilingualSchema(20, true);

/**
 * Schema สำหรับตรวจสอบชื่อ
 */
const firstNameSchema = Joi.object({
    th: Joi.string().required().trim().max(100).messages({
        'string.empty': 'กรุณาระบุชื่อจริงภาษาไทย',
        'string.max': 'ชื่อจริงต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุชื่อจริงภาษาไทย',
    }),
    en: Joi.string().trim().max(100).allow('').messages({
        'string.max': 'ชื่อจริงภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
    })
});

/**
 * Schema สำหรับตรวจสอบนามสกุล
 */
const lastNameSchema = Joi.object({
    th: Joi.string().required().trim().max(100).messages({
        'string.empty': 'กรุณาระบุนามสกุลภาษาไทย',
        'string.max': 'นามสกุลต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุนามสกุลภาษาไทย',
    }),
    en: Joi.string().trim().max(100).allow('').messages({
        'string.max': 'นามสกุลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
    })
});

/**
 * Schema สำหรับตรวจสอบสัญชาติ (รองรับทั้ง string และ multilingual)
 */
const nationalitySchema = flexibleMultilingualSchema(50, true);

/**
 * Schema สำหรับตรวจสอบเพศ (รองรับทั้ง string และ multilingual)
 */
const genderSchema = flexibleMultilingualSchema(20, true);

/**
 * Schema สำหรับตรวจสอบประเภทผู้ป่วย (รองรับทั้ง string และ multilingual)
 */
const patientTypeSchema = flexibleMultilingualSchema(50, true);

/**
 * Schema สำหรับตรวจสอบกรุ๊ปเลือด (รองรับทั้ง string และ multilingual - optional)
 */
const bloodGroupSchema = flexibleMultilingualSchema(10, false);

/**
 * Schema สำหรับตรวจสอบอาชีพ (รองรับทั้ง string และ multilingual - optional)
 */
const occupationSchema = flexibleMultilingualSchema(100, false);

/**
 * Schema สำหรับตรวจสอบสิทธิการรักษา (รองรับทั้ง string และ multilingual - optional)
 */
const medicalRightsSchema = flexibleMultilingualSchema(100, false);

/**
 * Schema สำหรับตรวจสอบสถานภาพ (รองรับทั้ง string และ multilingual - optional)
 */
const maritalStatusSchema = flexibleMultilingualSchema(50, false);

/**
 * Schema สำหรับตรวจสอบช่องทางที่รู้จัก (รองรับทั้ง string และ multilingual - optional)
 */
const referralSourceSchema = flexibleMultilingualSchema(100, false);

/**
 * Schema สำหรับตรวจสอบที่อยู่
 */
const addressSchema = Joi.object({
    address: Joi.string().required().trim().max(200).messages({
        'string.empty': 'กรุณาระบุที่อยู่',
        'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุที่อยู่',
    }),
    subdistrict: Joi.string().required().trim().max(100).messages({
        'string.empty': 'กรุณาระบุแขวง/ตำบล',
        'string.max': 'แขวง/ตำบลต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุแขวง/ตำบล',
    }),
    district: Joi.string().required().trim().max(100).messages({
        'string.empty': 'กรุณาระบุเขต/อำเภอ',
        'string.max': 'เขต/อำเภอต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุเขต/อำเภอ',
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
});

/**
 * Schema สำหรับตรวจสอบบุคคลที่ติดต่อกรณีฉุกเฉิน
 */
const emergencyContactSchema = Joi.object({
    fullName: Joi.string().required().trim().max(200).messages({
        'string.empty': 'กรุณาระบุชื่อ-นามสกุลผู้ติดต่อฉุกเฉิน',
        'string.max': 'ชื่อ-นามสกุลต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุชื่อ-นามสกุลผู้ติดต่อฉุกเฉิน',
    }),
    relationship: Joi.string().required().trim().max(50).messages({
        'string.empty': 'กรุณาระบุความสัมพันธ์',
        'string.max': 'ความสัมพันธ์ต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุความสัมพันธ์',
    }),
    address: Joi.string().required().trim().max(500).messages({
        'string.empty': 'กรุณาระบุที่อยู่ผู้ติดต่อฉุกเฉิน',
        'string.max': 'ที่อยู่ต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุที่อยู่ผู้ติดต่อฉุกเฉิน',
    }),
    phone: Joi.string().required().trim().max(20).messages({
        'string.empty': 'กรุณาระบุเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน',
        'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
        'any.required': 'กรุณาระบุเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน',
    }),
});

/**
 * Schema สำหรับตรวจสอบข้อมูลจำเพาะทางการแพทย์
 */
const medicalInfoSchema = Joi.object({
    drugAllergies: Joi.array().items(
        Joi.string().trim().max(200).messages({
            'string.max': 'รายการแพ้ยาแต่ละรายการต้องไม่เกิน {#limit} ตัวอักษร',
        })
    ).default([]).messages({
        'array.base': 'ข้อมูลแพ้ยาต้องเป็น array',
    }),
    assistantDoctorId: commonValidations.objectId.optional(),
    primaryDoctorId: commonValidations.objectId.optional(),
    chronicDiseases: Joi.array().items(
        Joi.string().trim().max(200).messages({
            'string.max': 'รายการโรคประจำตัวแต่ละรายการต้องไม่เกิน {#limit} ตัวอักษร',
        })
    ).default([]).messages({
        'array.base': 'ข้อมูลโรคประจำตัวต้องเป็น array',
    }),
    currentMedications: Joi.array().items(
        Joi.string().trim().max(200).messages({
            'string.max': 'รายการยาแต่ละรายการต้องไม่เกิน {#limit} ตัวอักษร',
        })
    ).default([]).messages({
        'array.base': 'ข้อมูลยาที่ใช้อยู่ต้องเป็น array',
    }),
});

/**
 * Schema สำหรับตรวจสอบการสร้างผู้ป่วยใหม่
 */
export const createPatient = {
    body: Joi.object({
        branchId: commonValidations.objectId.required().messages({
            'any.required': 'กรุณาระบุสาขา',
        }),
        hn: Joi.string().trim().uppercase().pattern(/^HN[0-9]{6}[0-9]{3}$/).messages({
            'string.pattern.base': 'รูปแบบ HN ไม่ถูกต้อง (HNYYMMDD000)',
        }),
        nationalId: Joi.string().required().trim().length(13).pattern(/^[0-9]+$/).messages({
            'string.empty': 'กรุณาระบุเลขบัตรประชาชน',
            'string.length': 'เลขบัตรประชาชนต้องมี {#limit} หลัก',
            'string.pattern.base': 'เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น',
            'any.required': 'กรุณาระบุเลขบัตรประชาชน',
        }),

        // ข้อมูลหลายภาษา - รองรับทั้ง string และ multilingual object
        nationality: nationalitySchema.messages({
            'any.required': 'กรุณาระบุสัญชาติ',
        }),
        titlePrefix: titlePrefixSchema.messages({
            'any.required': 'กรุณาระบุคำนำหน้าชื่อ',
        }),
        firstName: firstNameSchema.required().messages({
            'any.required': 'กรุณาระบุชื่อจริง',
        }),
        lastName: lastNameSchema.required().messages({
            'any.required': 'กรุณาระบุนามสกุล',
        }),
        gender: genderSchema.messages({
            'any.required': 'กรุณาระบุเพศ',
        }),
        patientType: patientTypeSchema.messages({
            'any.required': 'กรุณาระบุประเภทผู้ป่วย',
        }),

        // ข้อมูลเสริม (optional)
        nickname: Joi.string().trim().max(50).allow('').messages({
            'string.max': 'ชื่อเล่นต้องไม่เกิน {#limit} ตัวอักษร',
        }),
        dateOfBirth: Joi.date().required().max('now').messages({
            'date.base': 'รูปแบบวันเกิดไม่ถูกต้อง',
            'date.max': 'วันเกิดต้องไม่เป็นวันที่ในอนาคต',
            'any.required': 'กรุณาระบุวันเกิด',
        }),
        bloodGroup: bloodGroupSchema.optional(),
        occupation: occupationSchema.optional(),
        medicalRights: medicalRightsSchema.optional(),
        maritalStatus: maritalStatusSchema.optional(),
        referralSource: referralSourceSchema.optional(),

        // ที่อยู่
        idCardAddress: addressSchema.required().messages({
            'any.required': 'กรุณาระบุที่อยู่ตามบัตรประชาชน',
        }),
        currentAddress: addressSchema.required().messages({
            'any.required': 'กรุณาระบุที่อยู่ปัจจุบัน',
        }),

        // ข้อมูลการติดต่อ
        phone: Joi.string().required().trim().max(20).messages({
            'string.empty': 'กรุณาระบุเบอร์โทรศัพท์',
            'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุเบอร์โทรศัพท์',
        }),
        email: Joi.string().trim().email().allow('').messages({
            'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
        }),
        notes: Joi.string().trim().max(1000).allow('').messages({
            'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร',
        }),

        // ข้อมูลจำเพาะทางการแพทย์
        medicalInfo: medicalInfoSchema.required(),

        // บุคคลที่ติดต่อกรณีฉุกเฉิน
        emergencyContact: emergencyContactSchema.required().messages({
            'any.required': 'กรุณาระบุข้อมูลผู้ติดต่อฉุกเฉิน',
        }),

        isActive: Joi.boolean().default(true),
    }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดตผู้ป่วย
 */
export const updatePatient = {
    params: Joi.object({
        id: commonValidations.objectId.required(),
    }),
    body: Joi.object({
        // ข้อมูลหลายภาษา (Partial updates) - รองรับทั้ง string และ multilingual object
        nationality: Joi.alternatives().try(
            Joi.string().trim().max(50),
            Joi.object({
                th: Joi.string().trim().max(50),
                en: Joi.string().trim().max(50).allow('')
            })
        ),
        titlePrefix: Joi.alternatives().try(
            Joi.string().trim().max(20),
            Joi.object({
                th: Joi.string().trim().max(20),
                en: Joi.string().trim().max(20).allow('')
            })
        ),
        firstName: Joi.object({
            th: Joi.string().trim().max(100),
            en: Joi.string().trim().max(100).allow('')
        }),
        lastName: Joi.object({
            th: Joi.string().trim().max(100),
            en: Joi.string().trim().max(100).allow('')
        }),
        gender: Joi.alternatives().try(
            Joi.string().trim().max(20),
            Joi.object({
                th: Joi.string().trim().max(20),
                en: Joi.string().trim().max(20).allow('')
            })
        ),
        patientType: Joi.alternatives().try(
            Joi.string().trim().max(50),
            Joi.object({
                th: Joi.string().trim().max(50),
                en: Joi.string().trim().max(50).allow('')
            })
        ),
        bloodGroup: Joi.alternatives().try(
            Joi.string().trim().max(10).allow(''),
            Joi.object({
                th: Joi.string().trim().max(10).allow(''),
                en: Joi.string().trim().max(10).allow('')
            })
        ).allow(null),
        occupation: Joi.alternatives().try(
            Joi.string().trim().max(100).allow(''),
            Joi.object({
                th: Joi.string().trim().max(100).allow(''),
                en: Joi.string().trim().max(100).allow('')
            })
        ).allow(null),
        medicalRights: Joi.alternatives().try(
            Joi.string().trim().max(100).allow(''),
            Joi.object({
                th: Joi.string().trim().max(100).allow(''),
                en: Joi.string().trim().max(100).allow('')
            })
        ).allow(null),
        maritalStatus: Joi.alternatives().try(
            Joi.string().trim().max(50).allow(''),
            Joi.object({
                th: Joi.string().trim().max(50).allow(''),
                en: Joi.string().trim().max(50).allow('')
            })
        ).allow(null),
        referralSource: Joi.alternatives().try(
            Joi.string().trim().max(100).allow(''),
            Joi.object({
                th: Joi.string().trim().max(100).allow(''),
                en: Joi.string().trim().max(100).allow('')
            })
        ).allow(null),

        nickname: Joi.string().trim().max(50).allow('').messages({
            'string.max': 'ชื่อเล่นต้องไม่เกิน {#limit} ตัวอักษร',
        }),
        dateOfBirth: Joi.date().max('now').messages({
            'date.base': 'รูปแบบวันเกิดไม่ถูกต้อง',
            'date.max': 'วันเกิดต้องไม่เป็นวันที่ในอนาคต',
        }),

        // ที่อยู่ (Partial updates)
        idCardAddress: Joi.object({
            address: Joi.string().trim().max(200),
            subdistrict: Joi.string().trim().max(100),
            district: Joi.string().trim().max(100),
            province: Joi.string().trim().max(100),
            zipcode: Joi.string().trim().length(5).pattern(/^[0-9]+$/),
        }),
        currentAddress: Joi.object({
            address: Joi.string().trim().max(200),
            subdistrict: Joi.string().trim().max(100),
            district: Joi.string().trim().max(100),
            province: Joi.string().trim().max(100),
            zipcode: Joi.string().trim().length(5).pattern(/^[0-9]+$/),
        }),

        // ข้อมูลการติดต่อ
        phone: Joi.string().trim().max(20).messages({
            'string.max': 'เบอร์โทรศัพท์ต้องไม่เกิน {#limit} ตัวอักษร',
        }),
        email: Joi.string().trim().email().allow('').messages({
            'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
        }),
        notes: Joi.string().trim().max(1000).allow('').messages({
            'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร',
        }),

        // ข้อมูลจำเพาะทางการแพทย์ (Partial updates)
        medicalInfo: Joi.object({
            drugAllergies: Joi.array().items(Joi.string().trim().max(200)),
            assistantDoctorId: commonValidations.objectId.optional(),
            primaryDoctorId: commonValidations.objectId.optional(),
            chronicDiseases: Joi.array().items(Joi.string().trim().max(200)),
            currentMedications: Joi.array().items(Joi.string().trim().max(200)),
        }),

        // บุคคลที่ติดต่อกรณีฉุกเฉิน (Partial updates)
        emergencyContact: Joi.object({
            fullName: Joi.string().trim().max(200),
            relationship: Joi.string().trim().max(50),
            address: Joi.string().trim().max(500),
            phone: Joi.string().trim().max(20),
        }),

        isActive: Joi.boolean(),
    }).min(1).messages({
        'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
    }),
};

/**
 * Schema สำหรับการดึงข้อมูลผู้ป่วยตาม ID
 */
export const getPatientById = {
    params: Joi.object({
        id: commonValidations.objectId.required(),
    }),
};

/**
 * Schema สำหรับการค้นหาผู้ป่วยด้วย HN
 */
export const getPatientByHN = {
    params: Joi.object({
        hn: Joi.string().required().trim().uppercase().pattern(/^HN[0-9]{6}[0-9]{3}$/).messages({
            'string.empty': 'กรุณาระบุ HN',
            'string.pattern.base': 'รูปแบบ HN ไม่ถูกต้อง (HNYYMMDD000)',
            'any.required': 'กรุณาระบุ HN',
        }),
    }),
};

/**
 * Schema สำหรับการค้นหาผู้ป่วยด้วยเลขบัตรประชาชน
 */
export const getPatientByNationalId = {
    params: Joi.object({
        nationalId: Joi.string().required().trim().length(13).pattern(/^[0-9]+$/).messages({
            'string.empty': 'กรุณาระบุเลขบัตรประชาชน',
            'string.length': 'เลขบัตรประชาชนต้องมี {#limit} หลัก',
            'string.pattern.base': 'เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น',
            'any.required': 'กรุณาระบุเลขบัตรประชาชน',
        }),
    }),
};

/**
 * Schema สำหรับการค้นหาผู้ป่วย
 */
export const searchPatients = {
    query: Joi.object({
        q: Joi.string().required().trim().min(1).max(100).messages({
            'string.empty': 'กรุณาระบุคำค้นหา',
            'string.min': 'คำค้นหาต้องมีอย่างน้อย {#limit} ตัวอักษร',
            'string.max': 'คำค้นหาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุคำค้นหา',
        }),
        branchId: commonValidations.objectId.optional(),
        lang: Joi.string().valid('th', 'en').default('th').messages({
            'any.only': 'ภาษาต้องเป็น th หรือ en เท่านั้น'
        }),
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
    }),
};

/**
 * Schema สำหรับการดึงข้อมูลผู้ป่วยทั้งหมด
 */
export const getAllPatients = {
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
        sortBy: Joi.string().valid('createdAt', 'firstName', 'lastName', 'hn', 'dateOfBirth').default('createdAt').messages({
            'any.only': 'การเรียงลำดับต้องเป็น createdAt, firstName, lastName, hn หรือ dateOfBirth เท่านั้น'
        }),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
            'any.only': 'ลำดับการเรียงต้องเป็น asc หรือ desc เท่านั้น'
        }),
        lang: Joi.string().valid('th', 'en').default('th').messages({
            'any.only': 'ภาษาต้องเป็น th หรือ en เท่านั้น'
        }),
        branchId: commonValidations.objectId.optional(),

        // Filter parameters - รองรับทั้ง string และ multilingual object
        patientType: Joi.string().trim().max(50).messages({
            'string.max': 'ประเภทผู้ป่วยต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        gender: Joi.string().trim().max(20).messages({
            'string.max': 'เพศต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        nationality: Joi.string().trim().max(50).messages({
            'string.max': 'สัญชาติต้องไม่เกิน {#limit} ตัวอักษร'
        }),
    }),
};

/**
 * Schema สำหรับการดึงข้อมูลผู้ป่วยตามสาขา
 */
export const getPatientsByBranch = {
    params: Joi.object({
        branchId: commonValidations.objectId.required(),
    }),
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        lang: Joi.string().valid('th', 'en').default('th'),
    }),
};

/**
 * Schema สำหรับการดึงข้อมูลผู้ป่วยตามคลินิก
 */
export const getPatientsByClinic = {
    params: Joi.object({
        clinicId: commonValidations.objectId.optional(),
    }),
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        lang: Joi.string().valid('th', 'en').default('th'),
    }),
};

/**
 * Schema สำหรับการอัปเดตสถานะการใช้งานผู้ป่วย
 */
export const updatePatientActiveStatus = {
    params: Joi.object({
        id: commonValidations.objectId.required(),
    }),
    body: Joi.object({
        isActive: Joi.boolean().required().messages({
            'any.required': 'กรุณาระบุสถานะการใช้งาน',
        }),
    }),
};

/**
 * Schema สำหรับการดึงสถิติผู้ป่วย
 */
export const getPatientStats = {
    params: Joi.object({
        clinicId: commonValidations.objectId.optional(),
        branchId: commonValidations.objectId.optional(),
    }),
};

/**
 * Schema สำหรับตรวจสอบ category ของ Patient Options
 */
const patientOptionCategoryValidation = Joi.string().valid(
    'nationality', 'titlePrefix', 'gender', 'patientType',
    'bloodGroup', 'occupation', 'medicalRight', 'maritalStatus', 'referralSource'
).required().messages({
    'any.only': 'ประเภทตัวเลือกไม่ถูกต้อง',
    'any.required': 'กรุณาระบุประเภทตัวเลือก'
});

/**
 * Schema สำหรับตรวจสอบการดึง Patient Options ตาม category
 */
export const getPatientOptionsByCategory = {
    params: Joi.object({
        category: patientOptionCategoryValidation,
    }),
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต Patient Options
 */
export const updatePatientOptions = {
    params: Joi.object({
        category: patientOptionCategoryValidation,
    }),
    body: Joi.object({
        values: Joi.array().items(
            // รองรับทั้ง string และ multilingual object
            Joi.alternatives().try(
                Joi.string().trim().max(100).required().messages({
                    'string.empty': 'ค่าตัวเลือกต้องไม่เป็นค่าว่าง',
                    'string.max': 'ค่าตัวเลือกต้องไม่เกิน {#limit} ตัวอักษร',
                    'any.required': 'กรุณาระบุค่าตัวเลือก'
                }),
                Joi.object({
                    th: Joi.string().required().trim().max(100).messages({
                        'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
                        'string.max': 'ข้อมูลภาษาไทยต้องไม่เกิน {#limit} ตัวอักษร',
                        'any.required': 'กรุณาระบุข้อมูลภาษาไทย',
                    }),
                    en: Joi.string().trim().max(100).allow('').messages({
                        'string.max': 'ข้อมูลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
                    })
                })
            )
        ).min(1).required().messages({
            'array.min': 'กรุณาระบุค่าอย่างน้อย 1 ค่า',
            'array.base': 'ค่าตัวเลือกต้องเป็น array',
            'any.required': 'กรุณาระบุค่าตัวเลือก'
        })
    }),
};

/**
 * Schema สำหรับตรวจสอบการเพิ่ม Patient Option ใหม่
 */
export const addPatientOptionValue = {
    params: Joi.object({
        category: patientOptionCategoryValidation,
    }),
    body: Joi.object({
        // รองรับหลายรูปแบบการส่งข้อมูล
        value: Joi.alternatives().try(
            Joi.string().trim().max(100),
            Joi.object({
                th: Joi.string().required().trim().max(100).messages({
                    'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
                    'string.max': 'ข้อมูลภาษาไทยต้องไม่เกิน {#limit} ตัวอักษร',
                    'any.required': 'กรุณาระบุข้อมูลภาษาไทย',
                }),
                en: Joi.string().trim().max(100).allow('').messages({
                    'string.max': 'ข้อมูลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
                })
            })
        ),
        // Alternative format - separate th/en fields
        th: Joi.string().trim().max(100).messages({
            'string.max': 'ข้อมูลภาษาไทยต้องไม่เกิน {#limit} ตัวอักษร',
        }),
        en: Joi.string().trim().max(100).allow('').messages({
            'string.max': 'ข้อมูลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
        })
    }).or('value', 'th').messages({
        'object.missing': 'กรุณาระบุข้อมูลตัวเลือกที่ต้องการเพิ่ม (value หรือ th)',
    }),
};

/**
 * Schema สำหรับตรวจสอบการลบ Patient Option
 */
export const removePatientOptionValue = {
    params: Joi.object({
        category: patientOptionCategoryValidation,
        value: Joi.string().required().messages({
            'string.empty': 'กรุณาระบุค่าที่ต้องการลบ',
            'any.required': 'กรุณาระบุค่าที่ต้องการลบ'
        })
    }),
};

/**
 * Schema สำหรับตรวจสอบการสร้าง Patient Options ใหม่
 */
export const createPatientOptions = {
    body: Joi.object({
        clinicId: commonValidations.objectId.required().messages({
            'any.required': 'กรุณาระบุคลินิก',
        }),
        category: patientOptionCategoryValidation,
        values: Joi.array().items(
            Joi.alternatives().try(
                Joi.string().trim().max(100).required(),
                Joi.object({
                    th: Joi.string().required().trim().max(100).messages({
                        'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
                        'string.max': 'ข้อมูลภาษาไทยต้องไม่เกิน {#limit} ตัวอักษร',
                        'any.required': 'กรุณาระบุข้อมูลภาษาไทย',
                    }),
                    en: Joi.string().trim().max(100).allow('').messages({
                        'string.max': 'ข้อมูลภาษาอังกฤษต้องไม่เกิน {#limit} ตัวอักษร',
                    })
                })
            )
        ).min(1).required().messages({
            'array.min': 'กรุณาระบุค่าอย่างน้อย 1 ค่า',
            'array.base': 'ค่าตัวเลือกต้องเป็น array',
            'any.required': 'กรุณาระบุค่าตัวเลือก'
        }),
        isActive: Joi.boolean().default(true),
        isDefault: Joi.boolean().default(false),
    }),
};

export default {
    createPatient,
    updatePatient,
    getPatientById,
    getPatientByHN,
    getPatientByNationalId,
    searchPatients,
    getAllPatients,
    getPatientsByBranch,
    getPatientsByClinic,
    updatePatientActiveStatus,
    getPatientStats,

    getPatientOptionsByCategory,
    updatePatientOptions,
    addPatientOptionValue,
    removePatientOptionValue,
    createPatientOptions,
};