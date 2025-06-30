import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as patientController from '../controllers/patient.controller';
import patientValidation from '../validations/patient.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

// ============= Search and Lookup Routes =============

/**
 * @route   GET /api/v1/patients/search
 * @desc    ค้นหาผู้ป่วย (ชื่อ, HN, เลขบัตร, เบอร์โทร)
 * @access  Private
 */
router.get(
  '/search',
  validate(patientValidation.searchPatients),
  patientController.searchPatients
);

/**
 * @route   GET /api/v1/patients/hn/:hn
 * @desc    ดึงข้อมูลผู้ป่วยตาม HN
 * @access  Private
 */
router.get(
  '/hn/:hn',
  validate(patientValidation.getPatientByHN),
  patientController.getPatientByHN
);

/**
 * @route   GET /api/v1/patients/national-id/:nationalId
 * @desc    ดึงข้อมูลผู้ป่วยตามเลขบัตรประชาชน
 * @access  Private
 */
router.get(
  '/national-id/:nationalId',
  validate(patientValidation.getPatientByNationalId),
  patientController.getPatientByNationalId
);

/**
 * @route   GET /api/v1/patients/dropdown-options
 * @desc    ดึง dropdown options สำหรับฟอร์มผู้ป่วย
 * @access  Private
 */
router.get(
  '/dropdown-options',
  patientController.getDropdownOptions
);

// ============= Statistics Routes =============

/**
 * @route   GET /api/v1/patients/stats
 * @desc    ดึงสถิติผู้ป่วยของคลินิกตัวเอง
 * @access  Private
 */
router.get(
  '/stats',
  patientController.getPatientStats
);

/**
 * @route   GET /api/v1/patients/clinic/:clinicId/stats
 * @desc    ดึงสถิติผู้ป่วยตามคลินิก
 * @access  Private
 */
router.get(
  '/clinic/:clinicId/stats',
  validate(patientValidation.getPatientStats),
  patientController.getPatientStats
);

/**
 * @route   GET /api/v1/patients/branch/:branchId/stats
 * @desc    ดึงสถิติผู้ป่วยตามสาขา
 * @access  Private
 */
router.get(
  '/branch/:branchId/stats',
  validate(patientValidation.getPatientStats),
  patientController.getPatientStats
);

// ============= Branch and Clinic Routes =============

/**
 * @route   GET /api/v1/patients/branch/:branchId
 * @desc    ดึงข้อมูลผู้ป่วยตามสาขา
 * @access  Private
 */
router.get(
  '/branch/:branchId',
  validate(patientValidation.getPatientsByBranch),
  patientController.getPatientsByBranch
);

/**
 * @route   GET /api/v1/patients/clinic/:clinicId
 * @desc    ดึงข้อมูลผู้ป่วยตามคลินิก ID
 * @access  Private
 */
router.get(
  '/clinic/:clinicId',
  validate(patientValidation.getPatientsByClinic),
  patientController.getPatientsByClinic
);

/**
 * @route   GET /api/v1/patients/clinic
 * @desc    ดึงข้อมูลผู้ป่วยตามคลินิกของผู้ใช้เอง
 * @access  Private
 */
router.get(
  '/clinic',
  patientController.getPatientsByClinic
);

// ============= Main CRUD Routes =============

/**
 * @route   GET /api/v1/patients
 * @desc    ดึงข้อมูลผู้ป่วยทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  validate(patientValidation.getAllPatients),
  patientController.getAllPatients
);

/**
 * @route   GET /api/v1/patients/:id
 * @desc    ดึงข้อมูลผู้ป่วยตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.getPatientById),
  patientController.getPatientById
);

/**
 * @route   POST /api/v1/patients
 * @desc    สร้างผู้ป่วยใหม่
 * @access  Private (All authenticated users can register patients)
 */
router.post(
  '/',
  validate(patientValidation.createPatient),
  patientController.createPatient
);

/**
 * @route   PUT /api/v1/patients/:id
 * @desc    อัปเดตข้อมูลผู้ป่วย
 * @access  Private (Staff can update patients in their clinic)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.updatePatient),
  patientController.updatePatient
);

/**
 * @route   PATCH /api/v1/patients/:id/active
 * @desc    เปลี่ยนสถานะการใช้งานผู้ป่วย (soft delete/restore)
 * @access  Private (Manager, Admin, Owner, SuperAdmin)
 */
router.patch(
  '/:id/active',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.updatePatientActiveStatus),
  patientController.updatePatientActiveStatus
);

/**
 * @route   DELETE /api/v1/patients/:id
 * @desc    ลบผู้ป่วย (hard delete - ใช้ระวัง)
 * @access  Private (Admin, Owner, SuperAdmin only)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(patientValidation.getPatientById),
  patientController.deletePatient
);

export default router;