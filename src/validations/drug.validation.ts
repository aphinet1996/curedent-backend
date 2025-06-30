// validations/drug.validation.ts
import Joi from 'joi';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับ drug code validation
 */
const drugCodeSchema = Joi.string()
    .trim()
    .uppercase()
    .max(50)
    .pattern(/^[A-Z0-9-_]+$/)
    .messages({
        'string.pattern.base': 'รหัสยาต้องประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย - _ เท่านั้น',
        'string.max': 'รหัสยาต้องไม่เกิน {#limit} ตัวอักษร'
    });

/**
 * Schema สำหรับข้อมูลหลายภาษา (optional)
 */
const multilingualTextSchema = Joi.object({
    th: Joi.string().trim().max(500).allow(''),
    en: Joi.string().trim().max(500).allow('')
}).allow(null);

/**
 * Schema สำหรับข้อมูลฉลากยาหลายภาษา
 */
const drugLabelConfigSchema = Joi.object({
    drugId: commonValidations.objectId.required().messages({
        'any.required': 'กรุณาระบุ ID ยา'
    }),
    languages: Joi.array().items(
        Joi.string().valid('th', 'en', 'zh', 'ja', 'ko')
    ).min(1).messages({
        'array.min': 'กรุณาเลือกภาษาอย่างน้อย 1 ภาษา'
    }),
    showFields: Joi.object({
        scientificName: Joi.boolean().default(true),
        printName: Joi.boolean().default(true),
        indications: Joi.boolean().default(true),
        instructions: Joi.boolean().default(true),
        dosageMethod: Joi.boolean().default(true),
        dosageTime: Joi.boolean().default(true)
    }),
    customTranslations: Joi.object({
        scientificName: multilingualTextSchema,
        printName: multilingualTextSchema,
        indications: multilingualTextSchema,
        instructions: multilingualTextSchema,
        unit: multilingualTextSchema,
        dosageMethod: multilingualTextSchema,
        dosageTime: multilingualTextSchema
    }).allow(null)
});

/**
 * Schema สำหรับการสร้างยาใหม่
 */
export const createDrug = {
    body: Joi.object({
        // ข้อมูลระบบ (optional - จะ set จาก user context)
        clinicId: commonValidations.objectId.optional(),
        branchId: commonValidations.objectId.optional(),

        // ข้อมูลพื้นฐาน (required)
        drugCode: drugCodeSchema.optional(), // จะ auto-generate ถ้าไม่ใส่
        drugName: Joi.string().required().trim().max(200).messages({
            'string.empty': 'กรุณาระบุชื่อยา',
            'string.max': 'ชื่อยาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุชื่อยา'
        }),
        category: Joi.string().required().trim().max(100).messages({
            'string.empty': 'กรุณาระบุหมวดหมู่ยา',
            'string.max': 'หมวดหมู่ยาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุหมวดหมู่ยา'
        }),
        subcategory: Joi.string().required().trim().max(100).messages({
            'string.empty': 'กรุณาระบุหมวดหมู่ย่อย',
            'string.max': 'หมวดหมู่ย่อยต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุหมวดหมู่ย่อย'
        }),
        dosage: Joi.string().required().trim().max(100).messages({
            'string.empty': 'กรุณาระบุขนาดยา',
            'string.max': 'ขนาดยาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุขนาดยา'
        }),
        unit: Joi.string().required().trim().max(50).messages({
            'string.empty': 'กรุณาระบุหน่วยยา',
            'string.max': 'หน่วยยาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุหน่วยยา'
        }),
        sellingPrice: Joi.number().required().min(0).precision(2).messages({
            'number.base': 'ราคาขายต้องเป็นตัวเลข',
            'number.min': 'ราคาขายต้องไม่น้อยกว่า 0',
            'any.required': 'กรุณาระบุราคาขาย'
        }),

        // ข้อมูลเสริม (optional)
        scientificName: Joi.string().trim().max(300).allow('').messages({
            'string.max': 'ชื่อทางวิทยาศาสตร์ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        printName: Joi.string().trim().max(200).allow('').messages({
            'string.max': 'ชื่อสำหรับพิมพ์ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        indications: Joi.string().trim().max(1000).allow('').messages({
            'string.max': 'ข้อบ่งใช้ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        description: Joi.string().trim().max(2000).allow('').messages({
            'string.max': 'รายละเอียดต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        dosageMethod: Joi.string().trim().max(100).allow('').messages({
            'string.max': 'วิธีใช้ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        dosageTime: Joi.string().trim().max(100).allow('').messages({
            'string.max': 'เวลาใช้ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        instructions: Joi.string().trim().max(1000).allow('').messages({
            'string.max': 'คำแนะนำการใช้ต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        purchasePrice: Joi.number().min(0).precision(2).messages({
            'number.base': 'ราคาซื้อต้องเป็นตัวเลข',
            'number.min': 'ราคาซื้อต้องไม่น้อยกว่า 0'
        }),

        // Branch ID (optional)
        // branchId: commonValidations.objectId.optional(), - moved to top

        // Status
        isActive: Joi.boolean().default(true)
    })
};

/**
 * Schema สำหรับการอัปเดตยา
 */
export const updateDrug = {
    params: Joi.object({
        id: commonValidations.objectId.required()
    }),
    body: Joi.object({
        // ข้อมูลระบบ (optional)
        clinicId: commonValidations.objectId.optional(),
        branchId: commonValidations.objectId.optional(),
        
        drugCode: drugCodeSchema.optional(),
        drugName: Joi.string().trim().max(200).messages({
            'string.max': 'ชื่อยาต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        category: Joi.string().trim().max(100).messages({
            'string.max': 'หมวดหมู่ยาต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        subcategory: Joi.string().trim().max(100).messages({
            'string.max': 'หมวดหมู่ย่อยต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        dosage: Joi.string().trim().max(100).messages({
            'string.max': 'ขนาดยาต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        unit: Joi.string().trim().max(50).messages({
            'string.max': 'หน่วยยาต้องไม่เกิน {#limit} ตัวอักษร'
        }),
        sellingPrice: Joi.number().min(0).precision(2).messages({
            'number.base': 'ราคาขายต้องเป็นตัวเลข',
            'number.min': 'ราคาขายต้องไม่น้อยกว่า 0'
        }),
        scientificName: Joi.string().trim().max(300).allow(''),
        printName: Joi.string().trim().max(200).allow(''),
        indications: Joi.string().trim().max(1000).allow(''),
        description: Joi.string().trim().max(2000).allow(''),
        dosageMethod: Joi.string().trim().max(100).allow(''),
        dosageTime: Joi.string().trim().max(100).allow(''),
        instructions: Joi.string().trim().max(1000).allow(''),
        purchasePrice: Joi.number().min(0).precision(2).messages({
            'number.base': 'ราคาซื้อต้องเป็นตัวเลข',
            'number.min': 'ราคาซื้อต้องไม่น้อยกว่า 0'
        }),
        isActive: Joi.boolean(),
        isArchived: Joi.boolean()
    }).min(1).messages({
        'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
    })
};

/**
 * Schema สำหรับการดึงข้อมูลยาตาม ID
 */
export const getDrugById = {
    params: Joi.object({
        id: commonValidations.objectId.required()
    })
};

/**
 * Schema สำหรับการค้นหายาด้วยรหัส
 */
export const getDrugByCode = {
    params: Joi.object({
        drugCode: drugCodeSchema.required().messages({
            'any.required': 'กรุณาระบุรหัสยา'
        })
    }),
    query: Joi.object({
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับการค้นหายา
 */
export const searchDrugs = {
    query: Joi.object({
        q: Joi.string().required().trim().min(1).max(100).messages({
            'string.empty': 'กรุณาระบุคำค้นหา',
            'string.min': 'คำค้นหาต้องมีอย่างน้อย {#limit} ตัวอักษร',
            'string.max': 'คำค้นหาต้องไม่เกิน {#limit} ตัวอักษร',
            'any.required': 'กรุณาระบุคำค้นหา'
        }),
        branchId: commonValidations.objectId.optional(),
        category: Joi.string().trim().max(100),
        page: Joi.number().integer().min(1).default(1).messages({
            'number.base': 'หน้าต้องเป็นตัวเลข',
            'number.integer': 'หน้าต้องเป็นจำนวนเต็ม',
            'number.min': 'หน้าต้องมากกว่า 0'
        }),
        limit: Joi.number().integer().min(1).max(100).default(20).messages({
            'number.base': 'จำนวนรายการต่อหน้าต้องเป็นตัวเลข',
            'number.integer': 'จำนวนรายการต่อหน้าต้องเป็นจำนวนเต็ม',
            'number.min': 'จำนวนรายการต่อหน้าต้องมากกว่า 0',
            'number.max': 'จำนวนรายการต่อหน้าต้องไม่เกิน 100'
        })
    })
};

/**
 * Schema สำหรับการดึงข้อมูลยาทั้งหมด
 */
export const getAllDrugs = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1).messages({
            'number.base': 'หน้าต้องเป็นตัวเลข',
            'number.integer': 'หน้าต้องเป็นจำนวนเต็ม',
            'number.min': 'หน้าต้องมากกว่า 0'
        }),
        limit: Joi.number().integer().min(1).max(100).default(20).messages({
            'number.base': 'จำนวนรายการต่อหน้าต้องเป็นตัวเลข',
            'number.integer': 'จำนวนรายการต่อหน้าต้องเป็นจำนวนเต็ม',
            'number.min': 'จำนวนรายการต่อหน้าต้องมากกว่า 0',
            'number.max': 'จำนวนรายการต่อหน้าต้องไม่เกิน 100'
        }),
        sortBy: Joi.string().valid('drugName', 'drugCode', 'category', 'sellingPrice', 'createdAt').default('drugName').messages({
            'any.only': 'การเรียงลำดับต้องเป็น drugName, drugCode, category, sellingPrice หรือ createdAt เท่านั้น'
        }),
        sortOrder: Joi.string().valid('asc', 'desc').default('asc').messages({
            'any.only': 'ลำดับการเรียงต้องเป็น asc หรือ desc เท่านั้น'
        }),
        branchId: commonValidations.objectId.optional(),
        category: Joi.string().trim().max(100),
        subcategory: Joi.string().trim().max(100),
        drugName: Joi.string().trim().max(200),
        drugCode: drugCodeSchema.optional(),
        isActive: Joi.boolean(),
        isArchived: Joi.boolean(),
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        q: Joi.string().trim().max(100) // สำหรับ search term
    })
};

/**
 * Schema สำหรับการดึงยาตามหมวดหมู่
 */
export const getDrugsByCategory = {
    params: Joi.object({
        category: Joi.string().required().trim().max(100).messages({
            'string.empty': 'กรุณาระบุหมวดหมู่',
            'any.required': 'กรุณาระบุหมวดหมู่'
        })
    }),
    query: Joi.object({
        subcategory: Joi.string().trim().max(100),
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับการดึงยาที่ stock ต่ำ - REMOVED (ไว้เพิ่มทีหลัง)
 */
// export const getLowStockDrugs = { ... };

/**
 * Schema สำหรับการอัปเดต stock ยา - REMOVED (ไว้เพิ่มทีหลัง)
 */
// export const updateDrugStock = { ... };

/**
 * Schema สำหรับ toggle archive status
 */
export const toggleArchiveStatus = {
    params: Joi.object({
        id: commonValidations.objectId.required()
    }),
    body: Joi.object({
        isArchived: Joi.boolean().required().messages({
            'any.required': 'กรุณาระบุสถานะ archive'
        })
    })
};

/**
 * Schema สำหรับการลบยา
 */
export const deleteDrug = {
    params: Joi.object({
        id: commonValidations.objectId.required()
    })
};

/**
 * Schema สำหรับตั้งค่าฉลากยา
 */
export const setDrugLabelConfig = {
    params: Joi.object({
        id: commonValidations.objectId.required()
    }),
    body: drugLabelConfigSchema
};

/**
 * Schema สำหรับ bulk operations
 */
export const bulkOperations = {
    body: Joi.object({
        operations: Joi.array().items(
            Joi.object({
                action: Joi.string().valid('create', 'update', 'delete', 'archive', 'activate').required().messages({
                    'any.only': 'การดำเนินการต้องเป็น create, update, delete, archive หรือ activate เท่านั้น',
                    'any.required': 'กรุณาระบุการดำเนินการ'
                }),
                drugIds: Joi.array().items(commonValidations.objectId).when('action', {
                    is: Joi.valid('update', 'delete', 'archive', 'activate'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                data: Joi.object().when('action', {
                    is: Joi.valid('create', 'update'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                filter: Joi.object().optional()
            })
        ).min(1).required().messages({
            'array.min': 'กรุณาระบุการดำเนินการอย่างน้อย 1 รายการ',
            'any.required': 'กรุณาระบุการดำเนินการ'
        })
    })
};

/**
 * Schema สำหรับ export
 */
export const exportDrugs = {
    query: Joi.object({
        format: Joi.string().valid('csv', 'excel', 'json').default('csv').messages({
            'any.only': 'รูปแบบต้องเป็น csv, excel หรือ json เท่านั้น'
        }),
        includeMultilingual: Joi.boolean().default(false),
        branchId: commonValidations.objectId.optional(),
        category: Joi.string().trim().max(100),
        subcategory: Joi.string().trim().max(100),
        isActive: Joi.boolean(),
        isArchived: Joi.boolean()
    })
};

/**
 * Schema สำหรับการสร้างรหัสยา
 */
export const generateDrugCode = {
    query: Joi.object({
        prefix: Joi.string().trim().uppercase().max(10).default('DRUG').messages({
            'string.max': 'คำนำหน้าต้องไม่เกิน {#limit} ตัวอักษร'
        })
    })
};

// ============= Drug Options Validation =============

/**
 * Schema สำหรับตรวจสอบ category ของ Drug Options
 */
const drugOptionCategoryValidation = Joi.string().valid(
    'drugCategory', 'drugSubcategory', 'unit', 'dosageMethod', 'dosageTime'
).required().messages({
    'any.only': 'ประเภทตัวเลือกยาไม่ถูกต้อง',
    'any.required': 'กรุณาระบุประเภทตัวเลือกยา'
});

/**
 * Schema สำหรับตรวจสอบการดึง Drug Options ตาม category
 */
export const getDrugOptionsByCategory = {
    params: Joi.object({
        category: drugOptionCategoryValidation
    }),
    query: Joi.object({
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับตรวจสอบการดึงหมวดหมู่ย่อยตามหมวดหมู่ใหญ่
 */
export const getSubcategoriesByMainCategory = {
    params: Joi.object({
        mainCategory: Joi.string().required().trim().max(100).messages({
            'string.empty': 'กรุณาระบุหมวดหมู่ใหญ่',
            'any.required': 'กรุณาระบุหมวดหมู่ใหญ่'
        })
    }),
    query: Joi.object({
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับตรวจสอบการอัปเดต Drug Options
 */
export const updateDrugOptions = {
    params: Joi.object({
        category: drugOptionCategoryValidation
    }),
    body: Joi.object({
        values: Joi.array().items(
            Joi.alternatives().try(
                // Support string format for backward compatibility
                Joi.string().trim().max(200).required(),
                // Support object format for multilingual
                Joi.object({
                    th: Joi.string().trim().max(200).required().messages({
                        'string.empty': 'กรุณาระบุข้อมูลภาษาไทย',
                        'any.required': 'กรุณาระบุข้อมูลภาษาไทย'
                    }),
                    en: Joi.string().trim().max(200).allow('')
                })
            ).messages({
                'alternatives.match': 'รูปแบบตัวเลือกยาไม่ถูกต้อง'
            })
        ).min(1).required().messages({
            'array.min': 'กรุณาระบุค่าอย่างน้อย 1 ค่า',
            'array.base': 'ค่าตัวเลือกยาต้องเป็น array',
            'any.required': 'กรุณาระบุค่าตัวเลือกยา'
        }),
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับตรวจสอบการเพิ่ม Drug Option ใหม่
 */
export const addDrugOptionValue = {
    params: Joi.object({
        category: drugOptionCategoryValidation
    }),
    body: Joi.object({
        // Support multiple input formats
        value: Joi.alternatives().try(
            Joi.string().trim().max(200),
            Joi.object({
                th: Joi.string().trim().max(200).required(),
                en: Joi.string().trim().max(200).allow('')
            })
        ),
        th: Joi.string().trim().max(200),
        en: Joi.string().trim().max(200).allow(''),
        branchId: commonValidations.objectId.optional()
    }).custom((value, helpers) => {
        // At least one of value or th must be provided
        if (!value.value && !value.th) {
            return helpers.error('any.required');
        }
        return value;
    }).messages({
        'any.required': 'กรุณาระบุค่าที่ต้องการเพิ่ม'
    })
};

/**
 * Schema สำหรับตรวจสอบการลบ Drug Option
 */
export const removeDrugOptionValue = {
    params: Joi.object({
        category: drugOptionCategoryValidation,
        value: Joi.string().required().messages({
            'string.empty': 'กรุณาระบุค่าที่ต้องการลบ',
            'any.required': 'กรุณาระบุค่าที่ต้องการลบ'
        })
    }),
    query: Joi.object({
        branchId: commonValidations.objectId.optional()
    })
};

/**
 * Schema สำหรับ bulk update drug options
 */
export const bulkUpdateDrugOptions = {
    body: Joi.object({
        operations: Joi.array().items(
            Joi.object({
                category: drugOptionCategoryValidation,
                action: Joi.string().valid('update', 'add', 'remove').required(),
                values: Joi.array().items(
                    Joi.alternatives().try(
                        Joi.string().trim().max(200),
                        Joi.object({
                            th: Joi.string().trim().max(200).required(),
                            en: Joi.string().trim().max(200).allow('')
                        })
                    )
                ).when('action', {
                    is: 'update',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                value: Joi.alternatives().try(
                    Joi.string().trim().max(200),
                    Joi.object({
                        th: Joi.string().trim().max(200).required(),
                        en: Joi.string().trim().max(200).allow('')
                    })
                ).when('action', {
                    is: 'add',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                thValue: Joi.string().trim().max(200).when('action', {
                    is: 'remove',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                })
            })
        ).min(1).required().messages({
            'array.min': 'กรุณาระบุการดำเนินการอย่างน้อย 1 รายการ',
            'any.required': 'กรุณาระบุการดำเนินการ'
        }),
        branchId: commonValidations.objectId.optional()
    })
};

export default {
    createDrug,
    updateDrug,
    getDrugById,
    getDrugByCode,
    searchDrugs,
    getAllDrugs,
    getDrugsByCategory,
    toggleArchiveStatus,
    deleteDrug,
    setDrugLabelConfig,
    bulkOperations,
    exportDrugs,
    generateDrugCode,

    // Drug Options validations
    getDrugOptionsByCategory,
    getSubcategoriesByMainCategory,
    updateDrugOptions,
    addDrugOptionValue,
    removeDrugOptionValue,
    bulkUpdateDrugOptions
};