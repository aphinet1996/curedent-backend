import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as productController from '../controllers/product.controller';
import productValidation from '../validations/product.validation';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticateToken);

/**
 * @route   GET /api/v1/products
 * @desc    ดึงข้อมูลสินค้าทั้งหมด
 * @access  Private
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/v1/products/low-stock
 * @desc    ดึงสินค้าที่ใกล้หมด
 * @access  Private
 */
router.get('/low-stock', productController.getLowStockProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    ดึงข้อมูลสินค้าตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(productValidation.getById),
  productController.getProductById
);

/**
 * @route   POST /api/v1/products
 * @desc    สร้างสินค้าใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(productValidation.createProduct),
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    อัปเดตสินค้า
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(productValidation.updateProduct),
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    ลบสินค้า (Soft delete)
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(productValidation.getById),
  productController.deleteProduct
);

/**
 * @route   POST /api/v1/products/stock/adjust
 * @desc    ปรับ stock สินค้า
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/stock/adjust',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(productValidation.adjustStock),
  productController.adjustStock
);

/**
 * @route   GET /api/v1/products/:productId/stock/history
 * @desc    ดึงประวัติการเคลื่อนไหว stock
 * @access  Private
 */
router.get(
  '/:productId/stock/history',
  validate(productValidation.getStockHistory),
  productController.getStockHistory
);

export default router;