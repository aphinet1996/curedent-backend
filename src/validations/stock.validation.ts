import Joi from 'joi';
import { StockMovementType, TransferStatus } from '../types/stock.types';
import { commonValidations } from '../middlewares/validation.middleware';

/**
 * Schema สำหรับปรับ Stock
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
      is: Joi.valid(
        StockMovementType.ADJUSTMENT, 
        StockMovementType.DAMAGED, 
        StockMovementType.EXPIRED,
        StockMovementType.RETURN
      ),
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
 * Schema สำหรับโอน Stock
 */
export const transferStock = {
  body: Joi.object({
    productId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสินค้า'
    }),
    fromBranchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขาต้นทาง'
    }),
    toBranchId: commonValidations.objectId.required().invalid(Joi.ref('fromBranchId')).messages({
      'any.required': 'กรุณาระบุสาขาปลายทาง',
      'any.invalid': 'สาขาปลายทางต้องแตกต่างจากสาขาต้นทาง'
    }),
    quantity: Joi.number().required().positive().messages({
      'number.positive': 'จำนวนต้องมากกว่า 0',
      'any.required': 'กรุณาระบุจำนวน'
    }),
    unit: Joi.string().required().trim().uppercase().messages({
      'string.empty': 'กรุณาระบุหน่วย',
      'any.required': 'กรุณาระบุหน่วย'
    }),
    reason: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุเหตุผลการโอน',
      'string.max': 'เหตุผลต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุเหตุผลการโอน'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับอนุมัติการโอน
 */
export const approveTransfer = {
  params: Joi.object({
    transferId: commonValidations.objectId.required()
  }),
  body: Joi.object({
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับส่งสินค้า
 */
export const sendTransfer = {
  params: Joi.object({
    transferId: commonValidations.objectId.required()
  }),
  body: Joi.object({
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับรับสินค้า
 */
export const receiveTransfer = {
  params: Joi.object({
    transferId: commonValidations.objectId.required()
  }),
  body: Joi.object({
    receivedQuantity: Joi.number().positive().messages({
      'number.positive': 'จำนวนที่รับต้องมากกว่า 0'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับยกเลิกการโอน
 */
export const cancelTransfer = {
  params: Joi.object({
    transferId: commonValidations.objectId.required()
  }),
  body: Joi.object({
    reason: Joi.string().required().trim().max(200).messages({
      'string.empty': 'กรุณาระบุเหตุผลการยกเลิก',
      'string.max': 'เหตุผลต้องไม่เกิน {#limit} ตัวอักษร',
      'any.required': 'กรุณาระบุเหตุผลการยกเลิก'
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
 * Schema สำหรับดึง Stock ของ Product
 */
export const getProductStock = {
  params: Joi.object({
    productId: commonValidations.objectId.required()
  }),
  query: Joi.object({
    branchId: commonValidations.objectId
  })
};

/**
 * Schema สำหรับดึง Stock Movement History
 */
export const getStockMovements = {
  query: Joi.object({
    productId: commonValidations.objectId,
    branchId: commonValidations.objectId,
    movementType: Joi.string().valid(...Object.values(StockMovementType)),
    startDate: Joi.date(),
    endDate: Joi.date().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
      otherwise: Joi.date()
    }),
    referenceType: Joi.string().trim(),
    referenceId: Joi.string().trim(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

/**
 * Schema สำหรับดึง Stock Transfers
 */
export const getStockTransfers = {
  query: Joi.object({
    productId: commonValidations.objectId,
    fromBranchId: commonValidations.objectId,
    toBranchId: commonValidations.objectId,
    status: Joi.string().valid(...Object.values(TransferStatus)),
    startDate: Joi.date(),
    endDate: Joi.date().when('startDate', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('startDate')),
      otherwise: Joi.date()
    }),
    requestedBy: commonValidations.objectId,
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

/**
 * Schema สำหรับดึง Stock Summary
 */
export const getStockSummary = {
  query: Joi.object({
    branchId: commonValidations.objectId,
    clinicId: commonValidations.objectId,
    includeValue: Joi.boolean().default(false)
  })
};

/**
 * Schema สำหรับดึงสินค้าที่ใกล้หมด
 */
export const getLowStockProducts = {
  query: Joi.object({
    branchId: commonValidations.objectId,
    clinicId: commonValidations.objectId,
    threshold: Joi.number().min(0).default(0), // ระดับต่ำสุดที่จะแสดง
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

/**
 * Schema สำหรับการจอง Stock
 */
export const reserveStock = {
  body: Joi.object({
    productId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสินค้า'
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา'
    }),
    quantity: Joi.number().required().positive().messages({
      'number.positive': 'จำนวนที่จองต้องมากกว่า 0',
      'any.required': 'กรุณาระบุจำนวนที่ต้องการจอง'
    }),
    unit: Joi.string().required().trim().uppercase().messages({
      'string.empty': 'กรุณาระบุหน่วย',
      'any.required': 'กรุณาระบุหน่วย'
    }),
    referenceType: Joi.string().required().trim().messages({
      'string.empty': 'กรุณาระบุประเภทการจอง',
      'any.required': 'กรุณาระบุประเภทการจอง'
    }),
    referenceId: Joi.string().required().trim().messages({
      'string.empty': 'กรุณาระบุหมายเลขอ้างอิง',
      'any.required': 'กรุณาระบุหมายเลขอ้างอิง'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

/**
 * Schema สำหรับการยกเลิกจอง Stock
 */
export const unreserveStock = {
  body: Joi.object({
    productId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสินค้า'
    }),
    branchId: commonValidations.objectId.required().messages({
      'any.required': 'กรุณาระบุสาขา'
    }),
    quantity: Joi.number().required().positive().messages({
      'number.positive': 'จำนวนที่ยกเลิกต้องมากกว่า 0',
      'any.required': 'กรุณาระบุจำนวนที่ต้องการยกเลิก'
    }),
    unit: Joi.string().required().trim().uppercase().messages({
      'string.empty': 'กรุณาระบุหน่วย',
      'any.required': 'กรุณาระบุหน่วย'
    }),
    referenceType: Joi.string().required().trim().messages({
      'string.empty': 'กรุณาระบุประเภทการยกเลิกจอง',
      'any.required': 'กรุณาระบุประเภทการยกเลิกจอง'
    }),
    referenceId: Joi.string().required().trim().messages({
      'string.empty': 'กรุณาระบุหมายเลขอ้างอิง',
      'any.required': 'กรุณาระบุหมายเลขอ้างอิง'
    }),
    notes: Joi.string().trim().max(500).allow('').messages({
      'string.max': 'หมายเหตุต้องไม่เกิน {#limit} ตัวอักษร'
    })
  })
};

export default {
  adjustStock,
  transferStock,
  approveTransfer,
  sendTransfer,
  receiveTransfer,
  cancelTransfer,
  getById,
  getProductStock,
  getStockMovements,
  getStockTransfers,
  getStockSummary,
  getLowStockProducts,
  reserveStock,
  unreserveStock
};