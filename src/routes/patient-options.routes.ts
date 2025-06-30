import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as patientOptionsController from '../controllers/patient-options.controller';
import patientValidation from '../validations/patient.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   POST /api/v1/patient-options/init
 * @desc    สร้างข้อมูลเริ่มต้นของระบบ
 * @access  Private (SuperAdmin only)
 */
router.post(
    '/init',
    authorizeRoles([UserRole.SUPER_ADMIN]),
    patientOptionsController.initializeDefaultOptions
  );

/**
 * @route   GET /api/v1/patient-options
 * @desc    ดึงตัวเลือก dropdown ทั้งหมด
 * @access  Private
 */
router.get(
  '/',
  patientOptionsController.getAllDropdownOptions
);

/**
 * @route   GET /api/v1/patient-options/:category
 * @desc    ดึงตัวเลือกตามประเภท
 * @access  Private
 */
router.get(
  '/:category',
  validate(patientValidation.getPatientOptionsByCategory),
  patientOptionsController.getOptionsByCategory
);

/**
 * @route   PUT /api/v1/patient-options/:category
 * @desc    อัปเดตตัวเลือกทั้งหมดของประเภท
 * @access  Private (Manager+)
 */
router.put(
  '/:category',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.updatePatientOptions),
  patientOptionsController.updateOptionsForClinic
);

/**
 * @route   POST /api/v1/patient-options/:category
 * @desc    เพิ่มตัวเลือกใหม่
 * @access  Private (Manager+)
 */
router.post(
  '/:category',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.addPatientOptionValue),
  patientOptionsController.addOptionValue
);

/**
 * @route   DELETE /api/v1/patient-options/:category/:value
 * @desc    ลบตัวเลือก
 * @access  Private (Manager+)
 */
router.delete(
  '/:category/:value',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.removePatientOptionValue),
  patientOptionsController.removeOptionValue
);

export default router;