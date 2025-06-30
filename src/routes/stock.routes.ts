import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as stockController from '../controllers/stock.controller';
import stockValidation from '../validations/stock.validation';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticateToken);

/**
 * @route   GET /api/v1/stock/summary
 * @desc    ดึงสรุป Stock
 * @access  Private
 */
router.get(
    '/summary',
    validate(stockValidation.getStockSummary),
    stockController.getStockSummary
);

/**
 * @route   GET /api/v1/stock/low-stock
 * @desc    ดึงสินค้าที่ใกล้หมด
 * @access  Private
 */
router.get(
    '/low-stock',
    validate(stockValidation.getLowStockProducts),
    stockController.getLowStockProducts
);

/**
 * @route   GET /api/v1/stock/out-of-stock
 * @desc    ดึงสินค้าที่หมด
 * @access  Private
 */
router.get(
    '/out-of-stock',
    stockController.getOutOfStockProducts
);

/**
 * @route   GET /api/v1/stock/branch
 * @desc    ดึงข้อมูล Stock ของ Branch
 * @access  Private
 */
router.get(
    '/branch',
    stockController.getBranchStock
);

/**
 * @route   GET /api/v1/stock/product/:productId
 * @desc    ดึงข้อมูล Stock ของ Product
 * @access  Private
 */
router.get(
    '/product/:productId',
    validate(stockValidation.getProductStock),
    stockController.getProductStock
);

/**
 * @route   POST /api/v1/stock/adjust
 * @desc    ปรับ Stock
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
    '/adjust',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.adjustStock),
    stockController.adjustStock
);

/**
 * @route   POST /api/v1/stock/reserve
 * @desc    จอง Stock
 * @access  Private (Owner, Admin, Manager, Staff, SuperAdmin)
 */
router.post(
    '/reserve',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.reserveStock),
    stockController.reserveStock
);

/**
 * @route   POST /api/v1/stock/unreserve
 * @desc    ยกเลิกการจอง Stock
 * @access  Private (Owner, Admin, Manager, Staff, SuperAdmin)
 */
router.post(
    '/unreserve',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.unreserveStock),
    stockController.unreserveStock
);

/**
 * @route   GET /api/v1/stock/movements
 * @desc    ดึงประวัติการเคลื่อนไหว Stock
 * @access  Private
 */
router.get(
    '/movements',
    validate(stockValidation.getStockMovements),
    stockController.getStockMovements
);

// === Stock Transfer Routes ===

/**
 * @route   GET /api/v1/stock/transfers
 * @desc    ดึงข้อมูลการโอน Stock
 * @access  Private
 */
router.get(
    '/transfers',
    validate(stockValidation.getStockTransfers),
    stockController.getStockTransfers
);

/**
 * @route   GET /api/v1/stock/transfers/:transferId
 * @desc    ดึงข้อมูลการโอน Stock ตาม ID
 * @access  Private
 */
router.get(
    '/transfers/:transferId',
    validate(stockValidation.getById),
    stockController.getStockTransferById
);

/**
 * @route   POST /api/v1/stock/transfers
 * @desc    สร้างคำขอโอน Stock
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
    '/transfers',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.transferStock),
    stockController.createTransferRequest
);

/**
 * @route   PUT /api/v1/stock/transfers/:transferId/approve
 * @desc    อนุมัติการโอน
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
    '/transfers/:transferId/approve',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.approveTransfer),
    stockController.approveTransfer
);

/**
 * @route   PUT /api/v1/stock/transfers/:transferId/send
 * @desc    ส่งสินค้า
 * @access  Private (Owner, Admin, Manager, Staff, SuperAdmin)
 */
router.put(
    '/transfers/:transferId/send',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.sendTransfer),
    stockController.sendTransfer
);

/**
 * @route   PUT /api/v1/stock/transfers/:transferId/receive
 * @desc    รับสินค้า
 * @access  Private (Owner, Admin, Manager, Staff, SuperAdmin)
 */
router.put(
    '/transfers/:transferId/receive',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.receiveTransfer),
    stockController.receiveTransfer
);

/**
 * @route   PUT /api/v1/stock/transfers/:transferId/cancel
 * @desc    ยกเลิกการโอน
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
    '/transfers/:transferId/cancel',
    authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
    validate(stockValidation.cancelTransfer),
    stockController.cancelTransfer
);

export default router;