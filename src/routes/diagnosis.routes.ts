import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as diagnosisController from '../controllers/diagnosis.controller';
import diagnosisValidation from '../validations/diagnosis.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/diagnoses
 * @desc    ดึงข้อมูลการวินิจฉัยตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  diagnosisController.getAllDiagnoses
);

/**
 * @route   GET /api/v1/diagnoses/:id
 * @desc    ดึงข้อมูลการวินิจฉัยตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(diagnosisValidation.getDiagnosisById),
  diagnosisController.getDiagnosisById
);

/**
 * @route   POST /api/v1/diagnoses
 * @desc    สร้างการวินิจฉัยใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(diagnosisValidation.createDiagnosis),
  diagnosisController.createDiagnosis
);

/**
 * @route   PUT /api/v1/diagnoses/:id
 * @desc    อัปเดตข้อมูลการวินิจฉัย
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(diagnosisValidation.updateDiagnosis),
  diagnosisController.updateDiagnosis
);

/**
 * @route   DELETE /api/v1/diagnoses/:id
 * @desc    ลบการวินิจฉัย
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(diagnosisValidation.getDiagnosisById),
  diagnosisController.deleteDiagnosis
);

export default router;