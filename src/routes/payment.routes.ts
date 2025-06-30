import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as paymentController from '../controllers/payment.controller';
import paymentValidation from '../validations/payment.validation';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticateToken);

/**
 * @route   GET /api/v1/payments
 * @desc    ดึงข้อมูลการชำระเงินทั้งหมด
 * @access  Private
 */
router.get('/', paymentController.getAllPayments);

/**
 * @route   GET /api/v1/payments/:id
 * @desc    ดึงข้อมูลการชำระเงินตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(paymentValidation.getPaymentById),
  paymentController.getPaymentById
);

/**
 * @route   POST /api/v1/payments
 * @desc    สร้างการชำระเงินใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(paymentValidation.createPayment),
  paymentController.createPayment
);

/**
 * @route   PUT /api/v1/payments/:id
 * @desc    อัปเดตการชำระเงิน
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(paymentValidation.updatePayment),
  paymentController.updatePayment
);

/**
 * @route   DELETE /api/v1/payments/:id
 * @desc    ลบการชำระเงิน
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(paymentValidation.getPaymentById),
  paymentController.deletePayment
);

/**
 * @route   POST /api/v1/payments/transactions
 * @desc    สร้างธุรกรรมการชำระเงิน
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/transactions',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(paymentValidation.createPaymentTransaction),
  paymentController.createPaymentTransaction
);

/**
 * @route   PATCH /api/v1/payments/:id/cancel
 * @desc    ยกเลิกการชำระเงิน
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.patch(
  '/:id/cancel',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(paymentValidation.getPaymentById),
  paymentController.cancelPayment
);

export default router;