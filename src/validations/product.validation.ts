// import Joi from 'joi';
// import { ProductType, ProductStatus, StockMovementType } from '../types/product.types';
// import { commonValidations } from '../middlewares/validation.middleware';

// /**
//  * Schema สำหรับ Product Unit
//  */
// const productUnitSchema = Joi.object({
//   unit: Joi.string().required().trim().uppercase().max(10).messages({
//     'string.empty': 'กรุณาระบุหน่วย',
//     'string.max': 'หน่วยต้องไม่เกิน {#limit} ตัวอักษร',
//     'any.required': 'กรุณาระบุหน่วย'
//   }),
//   conversionRate: Joi.number().required().min(0.001).messages({
//     'number.min': 'อัตราแปลงต้องมากกว่า 0',
//     'any.required': 'กรุณาระบุอัตราแปลง'
//   }),
//   isBaseUnit: Joi.boolean().default(false),
//   barcode: Joi.string().trim().allow('').messages({
//     'string.max': 'บาร์โค้ดไม่ถูกต้อง'
//   })
// });

// /**
//  * Schema สำหรับสร้าง Product
//  */
// export const createProduct = {
//   body: Joi.object({
//     sku: Joi.string().required().trim().uppercase().max(50).messages({
//       'string.empty': 'กรุณาระบุรหัสสินค้า',
//       'string.max': 'รหัสสินค้าต้องไม่เกิน {#limit} ตัวอักษร',
//       'any.required': 'กรุณาระบุรหัสสินค้า'
//     }),
//     name: Joi.string().required().trim().max(200).messages({
//       'string.empty': 'กรุณาระบุชื่อสินค้า',
//       'string.max': 'ชื่อสินค้าต้องไม่เกิน {#limit} ตัวอักษร',
//       'any.required': 'กรุณาระบุชื่อสินค้า'
//     }),
//     category: Joi.string().required().trim().max(100).messages({
//       'string.empty': 'กรุณาระบุหมวดหมู่',
//       'string.max': 'หมวดหมู่ต้องไม่เกิน {#limit} ตัวอักษร',
//       'any.required': 'กรุณาระบุหมวดหมู่'
//     }),
//     brand: Joi.string().trim().max(100).allow('').messages({
//       'string.max': 'ยี่ห้อต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     size: Joi.string().trim().max(50).allow('').messages({
//       'string.max': 'ขนาดต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     units: Joi.array().items(productUnitSchema).min(1).required()
//       .custom((value, helpers) => {
//         // ตรวจสอบว่ามี base unit เพียง 1 หน่วย
//         const baseUnits = value.filter((u: any) => u.isBaseUnit);
//         if (baseUnits.length !== 1) {
//           return helpers.error('any.invalid');
//         }
//         // ตรวจสอบว่าไม่มีหน่วยซ้ำ
//         const units = value.map((u: any) => u.unit);
//         if (new Set(units).size !== units.length) {
//           return helpers.error('any.duplicate');
//         }
//         return value;
//       })
//       .messages({
//         'array.min': 'กรุณาระบุหน่วยสินค้าอย่างน้อย 1 หน่วย',
//         'any.required': 'กรุณาระบุหน่วยสินค้า',
//         'any.invalid': 'ต้องมีหน่วยหลัก (base unit) เพียง 1 หน่วยเท่านั้น',
//         'any.duplicate': 'พบหน่วยที่ซ้ำกัน'
//       }),
//     price: Joi.number().required().min(0).messages({
//       'number.min': 'ราคาขายต้องไม่ติดลบ',
//       'any.required': 'กรุณาระบุราคาขาย'
//     }),
//     cost: Joi.number().required().min(0).messages({
//       'number.min': 'ต้นทุนต้องไม่ติดลบ',
//       'any.required': 'กรุณาระบุต้นทุน'
//     }),
//     expiryDate: Joi.date().allow(null).messages({
//       'date.base': 'รูปแบบวันหมดอายุไม่ถูกต้อง'
//     }),
//     image: Joi.string().uri().allow('').messages({
//       'string.uri': 'รูปแบบ URL รูปภาพไม่ถูกต้อง'
//     }),
//     type: Joi.string().valid(...Object.values(ProductType)).required().messages({
//       'any.only': 'ประเภทสินค้าไม่ถูกต้อง',
//       'any.required': 'กรุณาระบุประเภทสินค้า'
//     }),
//     notes: Joi.string().trim().max(1000).allow('').messages({
//       'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     clinicId: commonValidations.objectId.required().messages({
//       'any.required': 'กรุณาระบุคลินิก'
//     }),
//     branchId: commonValidations.objectId.required().messages({
//       'any.required': 'กรุณาระบุสาขา'
//     }),
//     minStockLevel: Joi.number().min(0).default(0).messages({
//       'number.min': 'จำนวนขั้นต่ำต้องไม่ติดลบ'
//     }),
//     maxStockLevel: Joi.number().min(0).messages({
//       'number.min': 'จำนวนสูงสุดต้องไม่ติดลบ'
//     }),
//     reorderLevel: Joi.number().min(0).messages({
//       'number.min': 'จุดสั่งซื้อต้องไม่ติดลบ'
//     })
//   }).custom((value, helpers) => {
//     // ตรวจสอบ stock levels
//     if (value.maxStockLevel && value.minStockLevel && value.maxStockLevel < value.minStockLevel) {
//       return helpers.error('any.invalid', { message: 'จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ' });
//     }
//     if (value.reorderLevel) {
//       if (value.minStockLevel && value.reorderLevel < value.minStockLevel) {
//         return helpers.error('any.invalid', { message: 'จุดสั่งซื้อต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ' });
//       }
//       if (value.maxStockLevel && value.reorderLevel > value.maxStockLevel) {
//         return helpers.error('any.invalid', { message: 'จุดสั่งซื้อต้องน้อยกว่าหรือเท่ากับจำนวนสูงสุด' });
//       }
//     }
//     return value;
//   })
// };

// /**
//  * Schema สำหรับอัปเดต Product
//  */
// export const updateProduct = {
//   params: Joi.object({
//     id: commonValidations.objectId.required()
//   }),
//   body: Joi.object({
//     name: Joi.string().trim().max(200).messages({
//       'string.max': 'ชื่อสินค้าต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     category: Joi.string().trim().max(100).messages({
//       'string.max': 'หมวดหมู่ต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     brand: Joi.string().trim().max(100).allow('').messages({
//       'string.max': 'ยี่ห้อต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     size: Joi.string().trim().max(50).allow('').messages({
//       'string.max': 'ขนาดต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     units: Joi.array().items(productUnitSchema).min(1)
//       .custom((value, helpers) => {
//         const baseUnits = value.filter((u: any) => u.isBaseUnit);
//         if (baseUnits.length !== 1) {
//           return helpers.error('any.invalid');
//         }
//         const units = value.map((u: any) => u.unit);
//         if (new Set(units).size !== units.length) {
//           return helpers.error('any.duplicate');
//         }
//         return value;
//       })
//       .messages({
//         'array.min': 'กรุณาระบุหน่วยสินค้าอย่างน้อย 1 หน่วย',
//         'any.invalid': 'ต้องมีหน่วยหลัก (base unit) เพียง 1 หน่วยเท่านั้น',
//         'any.duplicate': 'พบหน่วยที่ซ้ำกัน'
//       }),
//     price: Joi.number().min(0).messages({
//       'number.min': 'ราคาขายต้องไม่ติดลบ'
//     }),
//     cost: Joi.number().min(0).messages({
//       'number.min': 'ต้นทุนต้องไม่ติดลบ'
//     }),
//     expiryDate: Joi.date().allow(null).messages({
//       'date.base': 'รูปแบบวันหมดอายุไม่ถูกต้อง'
//     }),
//     image: Joi.string().uri().allow('').messages({
//       'string.uri': 'รูปแบบ URL รูปภาพไม่ถูกต้อง'
//     }),
//     type: Joi.string().valid(...Object.values(ProductType)).messages({
//       'any.only': 'ประเภทสินค้าไม่ถูกต้อง'
//     }),
//     status: Joi.string().valid(...Object.values(ProductStatus)).messages({
//       'any.only': 'สถานะสินค้าไม่ถูกต้อง'
//     }),
//     notes: Joi.string().trim().max(1000).allow('').messages({
//       'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     minStockLevel: Joi.number().min(0).messages({
//       'number.min': 'จำนวนขั้นต่ำต้องไม่ติดลบ'
//     }),
//     maxStockLevel: Joi.number().min(0).messages({
//       'number.min': 'จำนวนสูงสุดต้องไม่ติดลบ'
//     }),
//     reorderLevel: Joi.number().min(0).messages({
//       'number.min': 'จุดสั่งซื้อต้องไม่ติดลบ'
//     })
//   }).min(1).messages({
//     'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
//   })
// };

// /**
//  * Schema สำหรับปรับ Stock
//  */
// export const adjustStock = {
//   body: Joi.object({
//     productId: commonValidations.objectId.required().messages({
//       'any.required': 'กรุณาระบุสินค้า'
//     }),
//     branchId: commonValidations.objectId.required().messages({
//       'any.required': 'กรุณาระบุสาขา'
//     }),
//     quantity: Joi.number().required().not(0).messages({
//       'number.base': 'จำนวนต้องเป็นตัวเลข',
//       'any.invalid': 'จำนวนต้องไม่เป็น 0',
//       'any.required': 'กรุณาระบุจำนวน'
//     }),
//     unit: Joi.string().required().trim().uppercase().messages({
//       'string.empty': 'กรุณาระบุหน่วย',
//       'any.required': 'กรุณาระบุหน่วย'
//     }),
//     movementType: Joi.string().valid(...Object.values(StockMovementType)).required().messages({
//       'any.only': 'ประเภทการเคลื่อนไหวไม่ถูกต้อง',
//       'any.required': 'กรุณาระบุประเภทการเคลื่อนไหว'
//     }),
//     reason: Joi.string().trim().max(200).when('movementType', {
//       is: Joi.valid(StockMovementType.ADJUSTMENT, StockMovementType.DAMAGED, StockMovementType.EXPIRED),
//       then: Joi.required(),
//       otherwise: Joi.optional()
//     }).messages({
//       'string.empty': 'กรุณาระบุเหตุผล',
//       'string.max': 'เหตุผลต้องไม่เกิน {#limit} ตัวอักษร',
//       'any.required': 'กรุณาระบุเหตุผล'
//     }),
//     notes: Joi.string().trim().max(500).allow('').messages({
//       'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     referenceType: Joi.string().trim().max(50).messages({
//       'string.max': 'ประเภทเอกสารอ้างอิงต้องไม่เกิน {#limit} ตัวอักษร'
//     }),
//     referenceId: Joi.string().trim().max(50).messages({
//       'string.max': 'เลขที่เอกสารอ้างอิงต้องไม่เกิน {#limit} ตัวอักษร'
//     })
//   })
// };

// /**
//  * Schema สำหรับดึงข้อมูลตาม ID
//  */
// export const getById = {
//   params: Joi.object({
//     id: commonValidations.objectId.required()
//   })
// };

// /**
//  * Schema สำหรับดึง Stock History
//  */
// export const getStockHistory = {
//   params: Joi.object({
//     productId: commonValidations.objectId.required()
//   }),
//   query: Joi.object({
//     branchId: commonValidations.objectId,
//     startDate: Joi.date(),
//     endDate: Joi.date().when('startDate', {
//       is: Joi.exist(),
//       then: Joi.date().greater(Joi.ref('startDate')),
//       otherwise: Joi.date()
//     }),
//     movementType: Joi.string().valid(...Object.values(StockMovementType)),
//     page: Joi.number().min(1).default(1),
//     limit: Joi.number().min(1).max(100).default(20)
//   })
// };

// export default {
//   createProduct,
//   updateProduct,
//   adjustStock,
//   getById,
//   getStockHistory
// };

import Joi from 'joi';
import { ProductType, ProductStatus } from '../types/product.types';
import { StockMovementType } from '../types/stock.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับ Product Unit
 */
const productUnitSchema = Joi.object({
  unit: Joi.string().required().trim().uppercase().max(10).messages({
    'string.empty': 'กรุณาระบุหน่วย',
    'string.max': 'หน่วยต้องไม่เกิน {#limit} ตัวอักษร',
    'any.required': 'กรุณาระบุหน่วย'
  }),
  conversionRate: Joi.number().required().min(0.001).messages({
    'number.min': 'อัตราแปลงต้องมากกว่า 0',
    'any.required': 'กรุณาระบุอัตราแปลง'
  }),
  isBaseUnit: Joi.boolean().default(false),
  barcode: Joi.string().trim().allow('').messages({
    'string.max': 'บาร์โค้ดไม่ถูกต้อง'
  })
});

/**
 * Schema สำหรับสร้าง Product
 */
export const createProduct = {
  body: Joi.object({
    sku: Joi.string().required().trim().uppercase().max(50).messages({
      'string.empty': 'กรุณาระบุรหัสสินค้า',
      'string.max': 'รหัสสินค้าต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุรหัสสินค้า'
    }),
    name: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุชื่อสินค้า',
      'string.max': 'ชื่อสินค้าต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุชื่อสินค้า'
    }),
    category: Joi.string().required().trim().max(100).messages({
      'string.empty': 'กรุณาระบุหมวดหมู่',
      'string.max': 'หมวดหมู่ต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุหมวดหมู่'
    }),
    brand: Joi.string().trim().max(100).allow('').messages({
      'string.max': 'ยี่ห้อต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    size: Joi.string().trim().max(50).allow('').messages({
      'string.max': 'ขนาดต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    units: Joi.array().items(productUnitSchema).min(1).required()
      .custom((value, helpers) => {
        // ตรวจสอบว่ามี base unit เพียง 1 หน่วย
        const baseUnits = value.filter((u: any) => u.isBaseUnit);
        if (baseUnits.length !== 1) {
          return helpers.error('any.invalid');
        }
        // ตรวจสอบว่าไม่มีหน่วยซ้ำ
        const units = value.map((u: any) => u.unit);
        if (new Set(units).size !== units.length) {
          return helpers.error('any.duplicate');
        }
        return value;
      })
      .messages({
        'array.min': 'กรุณาระบุหน่วยสินค้าอย่างน้อย 1 หน่วย',
        'any.required': 'กรุณาระบุหน่วยสินค้า',
        'any.invalid': 'ต้องมีหน่วยหลัก (base unit) เพียง 1 หน่วยเท่านั้น',
        'any.duplicate': 'พบหน่วยที่ซ้ำกัน'
      }),
    price: Joi.number().required().min(0).messages({
      'number.min': 'ราคาขายต้องไม่ติดลบ',
      'any.required': 'กรุณาระบุราคาขาย'
    }),
    cost: Joi.number().required().min(0).messages({
      'number.min': 'ต้นทุนต้องไม่ติดลบ',
      'any.required': 'กรุณาระบุต้นทุน'
    }),
    expiryDate: Joi.date().allow(null).messages({
      'date.base': 'รูปแบบวันหมดอายุไม่ถูกต้อง'
    }),
    image: Joi.string().uri().allow('').messages({
      'string.uri': 'รูปแบบ URL รูปภาพไม่ถูกต้อง'
    }),
    type: Joi.string().valid(...Object.values(ProductType)).required().messages({
      'any.only': 'ประเภทสินค้าไม่ถูกต้อง',
      'any.required': 'กรุณาระบุประเภทสินค้า'
    }),
    notes: Joi.string().trim().max(1000).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    clinicId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุคลินิก'
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา'
    }),
    minStockLevel: Joi.number().min(0).default(0).messages({
      'number.min': 'จำนวนขั้นต่ำต้องไม่ติดลบ'
    }),
    maxStockLevel: Joi.number().min(0).messages({
      'number.min': 'จำนวนสูงสุดต้องไม่ติดลบ'
    }),
    reorderLevel: Joi.number().min(0).messages({
      'number.min': 'จุดสั่งซื้อต้องไม่ติดลบ'
    })
  }).custom((value, helpers) => {
    // ตรวจสอบ stock levels
    if (value.maxStockLevel && value.minStockLevel && value.maxStockLevel < value.minStockLevel) {
      return helpers.error('any.invalid', { message: 'จำนวนสูงสุดต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ' });
    }
    if (value.reorderLevel) {
      if (value.minStockLevel && value.reorderLevel < value.minStockLevel) {
        return helpers.error('any.invalid', { message: 'จุดสั่งซื้อต้องมากกว่าหรือเท่ากับจำนวนขั้นต่ำ' });
      }
      if (value.maxStockLevel && value.reorderLevel > value.maxStockLevel) {
        return helpers.error('any.invalid', { message: 'จุดสั่งซื้อต้องน้อยกว่าหรือเท่ากับจำนวนสูงสุด' });
      }
    }
    return value;
  })
};

/**
 * Schema สำหรับอัปเดต Product
 */
export const updateProduct = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  }),
  body: Joi.object({
    name: Joi.string().trim().max(200).messages({
      'string.max': 'ชื่อสินค้าต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    category: Joi.string().trim().max(100).messages({
      'string.max': 'หมวดหมู่ต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    brand: Joi.string().trim().max(100).allow('').messages({
      'string.max': 'ยี่ห้อต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    size: Joi.string().trim().max(50).allow('').messages({
      'string.max': 'ขนาดต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    units: Joi.array().items(productUnitSchema).min(1)
      .custom((value, helpers) => {
        const baseUnits = value.filter((u: any) => u.isBaseUnit);
        if (baseUnits.length !== 1) {
          return helpers.error('any.invalid');
        }
        const units = value.map((u: any) => u.unit);
        if (new Set(units).size !== units.length) {
          return helpers.error('any.duplicate');
        }
        return value;
      })
      .messages({
        'array.min': 'กรุณาระบุหน่วยสินค้าอย่างน้อย 1 หน่วย',
        'any.invalid': 'ต้องมีหน่วยหลัก (base unit) เพียง 1 หน่วยเท่านั้น',
        'any.duplicate': 'พบหน่วยที่ซ้ำกัน'
      }),
    price: Joi.number().min(0).messages({
      'number.min': 'ราคาขายต้องไม่ติดลบ'
    }),
    cost: Joi.number().min(0).messages({
      'number.min': 'ต้นทุนต้องไม่ติดลบ'
    }),
    expiryDate: Joi.date().allow(null).messages({
      'date.base': 'รูปแบบวันหมดอายุไม่ถูกต้อง'
    }),
    image: Joi.string().uri().allow('').messages({
      'string.uri': 'รูปแบบ URL รูปภาพไม่ถูกต้อง'
    }),
    type: Joi.string().valid(...Object.values(ProductType)).messages({
      'any.only': 'ประเภทสินค้าไม่ถูกต้อง'
    }),
    status: Joi.string().valid(...Object.values(ProductStatus)).messages({
      'any.only': 'สถานะสินค้าไม่ถูกต้อง'
    }),
    notes: Joi.string().trim().max(1000).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    minStockLevel: Joi.number().min(0).messages({
      'number.min': 'จำนวนขั้นต่ำต้องไม่ติดลบ'
    }),
    maxStockLevel: Joi.number().min(0).messages({
      'number.min': 'จำนวนสูงสุดต้องไม่ติดลบ'
    }),
    reorderLevel: Joi.number().min(0).messages({
      'number.min': 'จุดสั่งซื้อต้องไม่ติดลบ'
    })
  }).min(1).messages({
    'object.min': 'กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง'
  })
};

/**
 * Schema สำหรับปรับ Stock (ใช้จาก stock module)
 */
export const adjustStock = {
  body: Joi.object({
    productId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสินค้า'
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา'
    }),
    quantity: Joi.number().required().not(0).messages({
      'number.base': 'จำนวนต้องเป็นตัวเลข',
      'any.invalid': 'จำนวนต้องไม่เป็น 0',
      'any.required': 'กรุณาระบุจำนวน'
    }),
    unit: Joi.string().required().trim().uppercase().messages({
      'string.empty': 'กรุณาระบุหน่วย',
      'any.required': 'กรุณาระบุหน่วย'
    }),
    movementType: Joi.string().valid(...Object.values(StockMovementType)).required().messages({
      'any.only': 'ประเภทการเคลื่อนไหวไม่ถูกต้อง',
      'any.required': 'กรุณาระบุประเภทการเคลื่อนไหว'
    }),
    reason: Joi.string().trim().max(200).when('movementType', {
      is: Joi.valid(StockMovementType.ADJUSTMENT, StockMovementType.DAMAGED, StockMovementType.EXPIRED),
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'string.empty': 'กรุณาระบุเหตุผล',
      'string.max': 'เหตุผลต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุเหตุผล'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    referenceType: Joi.string().trim().max(50).messages({
      'string.max': 'ประเภทเอกสารอ้างอิงต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    referenceId: Joi.string().trim().max(50).messages({
      'string.max': 'เลขที่เอกสารอ้างอิงต้องไม่เกิน {#limit} ตัวอักษร'
    }),
    cost: Joi.number().min(0).when('movementType', {
      is: StockMovementType.PURCHASE,
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.min': 'ต้นทุนต้องไม่ติดลบ',
      'any.required': 'กรุณาระบุต้นทุนสำหรับการซื้อ'
    })
  })
};

/**
 * Schema สำหรับดึงข้อมูลตาม ID
 */
export const getById = {
  params: Joi.object({
    id: commonValidations.objectId.required()
  })
};

/**
 * Schema สำหรับดึง Stock History
 */
export const getStockHistory = {
  params: Joi.object({
    productId: commonValidations.objectId.required()
  }),
  query: Joi.object({
    branchId: commonValidations.objectId,
    startDate: Joi.date(),
    endDate: Joi.date().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
      otherwise: Joi.date()
    }),
    movementType: Joi.string().valid(...Object.values(StockMovementType)),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

export default {
  createProduct,
  updateProduct,
  adjustStock,
  getById,
  getStockHistory
};