import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as treatmentController from '../controllers/treatment.controller';
import treatmentValidation from '../validations/treatment.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/treatments/stats/clinic/:clinicId
 * @desc    ดึงสถิติการรักษาตาม clinic ID
 * @access  Private
 */
router.get(
  '/stats/clinic/:clinicId',
  treatmentController.getTreatmentStats
);

/**
 * @route   GET /api/v1/treatments/stats/clinic
 * @desc    ดึงสถิติการรักษาตามคลินิกของผู้ใช้เอง
 * @access  Private
 */
router.get(
  '/stats/clinic',
  treatmentController.getTreatmentStats
);

/**
 * @route   GET /api/v1/treatments/clinic/:clinicId/with-calculations
 * @desc    ดึงข้อมูลการรักษาพร้อมการคำนวณตาม clinic ID
 * @access  Private
 */
router.get(
  '/clinic/:clinicId/with-calculations',
  treatmentController.getTreatmentsByClinicWithCalculations
);

/**
 * @route   GET /api/v1/treatments/clinic/with-calculations
 * @desc    ดึงข้อมูลการรักษาพร้อมการคำนวณตามคลินิกของผู้ใช้เอง
 * @access  Private
 */
router.get(
  '/clinic/with-calculations',
  treatmentController.getTreatmentsByClinicWithCalculations
);

/**
 * @route   POST /api/v1/treatments/:id/calculate-fees
 * @desc    คำนวณค่าธรรมเนียมสำหรับการรักษา
 * @access  Private
 */
router.post(
  '/:id/calculate-fees',
  validate(treatmentValidation.calculateFees),
  treatmentController.calculateFees
);

/**
 * @route   GET /api/v1/treatments
 * @desc    ดึงข้อมูลการรักษาตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  treatmentController.getAllTreatments
);

/**
 * @route   GET /api/v1/treatments/:id
 * @desc    ดึงข้อมูลการรักษาตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(treatmentValidation.getTreatmentById),
  treatmentController.getTreatmentById
);

/**
 * @route   POST /api/v1/treatments
 * @desc    สร้างการรักษาใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(treatmentValidation.createTreatment),
  treatmentController.createTreatment
);

/**
 * @route   PUT /api/v1/treatments/:id
 * @desc    อัปเดตข้อมูลการรักษา
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(treatmentValidation.updateTreatment),
  treatmentController.updateTreatment
);

/**
 * @route   DELETE /api/v1/treatments/:id
 * @desc    ลบการรักษา
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(treatmentValidation.getTreatmentById),
  treatmentController.deleteTreatment
);

export default router;