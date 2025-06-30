// routes/clinic.routes.ts
import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import * as clinicController from '../controllers/clinic.controller';
import * as clinicValidation from '../validations/clinic.validation';
import { checkRole, isSuperAdmin } from '../middlewares/role.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง clinic - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/clinics
 * @desc    ดึงรายการคลินิกทั้งหมด
 * @access  SuperAdmin only
 */
router.get(
  '/',
  isSuperAdmin,
  clinicController.getAllClinics
);

/**
 * @route   GET /api/v1/clinics/:id
 * @desc    ดึงข้อมูลคลินิกตาม ID
 * @access  SuperAdmin or User from that clinic
 */
router.get(
  '/:id',
  validate(clinicValidation.getClinicById),
  clinicController.getClinicById
);

/**
 * @route   POST /api/v1/clinics
 * @desc    สร้างคลินิกใหม่
 * @access  SuperAdmin only
 */
router.post(
  '/',
  isSuperAdmin,
  validate(clinicValidation.createClinic),
  clinicController.createClinic
);

/**
 * @route   POST /api/v1/clinics/:id/owners
 * @desc    สร้าง Owner สำหรับคลินิก
 * @access  SuperAdmin only
 */
router.post(
  '/:id/owners',
  isSuperAdmin,
  validate(clinicValidation.createClinicUser),
  clinicController.createClinicOwner
);

/**
 * @route   POST /api/v1/clinics/:id/admins
 * @desc    สร้าง Admin สำหรับคลินิก
 * @access  SuperAdmin or Owner of that clinic
 */
router.post(
  '/:id/admins',
  validate(clinicValidation.createClinicUser),
  clinicController.createClinicAdmin
);

/**
 * @route   PUT /api/v1/clinics/:id
 * @desc    อัปเดตข้อมูลคลินิก
 * @access  SuperAdmin only
 */
router.put(
  '/:id',
  isSuperAdmin,
  validate(clinicValidation.updateClinic),
  clinicController.updateClinic
);

/**
 * @route   PATCH /api/v1/clinics/:id/status
 * @desc    อัปเดตสถานะของคลินิก
 * @access  SuperAdmin only
 */
router.patch(
  '/:id/status',
  isSuperAdmin,
  validate(clinicValidation.updateClinicStatus),
  clinicController.updateClinicStatus
);

export default router;