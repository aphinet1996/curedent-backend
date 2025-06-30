import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as opdController from '../controllers/opd.controller';
import opdValidation from '../validations/opd.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/opds
 * @desc    ดึงข้อมูล OPD ทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  validate(opdValidation.searchOpd),
  opdController.getAllOpds
);

/**
 * @route   GET /api/v1/opds/statistics
 * @desc    ดึงสถิติ OPD
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.get(
  '/statistics',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  opdController.getOpdStatistics
);

/**
 * @route   GET /api/v1/opds/patient/:patientId
 * @desc    ดึงข้อมูล OPD ตามผู้ป่วย
 * @access  Private
 */
router.get(
  '/patient/:patientId',
  opdController.getOpdsByPatient
);

/**
 * @route   GET /api/v1/opds/patient/:patientId/tooth-chart
 * @desc    ดึงชาร์ตฟันของผู้ป่วย
 * @access  Private
 */
router.get(
  '/patient/:patientId/tooth-chart',
  opdController.getPatientToothChart
);

/**
 * @route   GET /api/v1/opds/dentist/:dentistId
 * @desc    ดึงข้อมูล OPD ตามทันตแพทย์
 * @access  Private
 */
router.get(
  '/dentist/:dentistId',
  opdController.getOpdsByDentist
);

/**
 * @route   GET /api/v1/opds/:id
 * @desc    ดึงข้อมูล OPD ตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(opdValidation.getOpdById),
  opdController.getOpdById
);

/**
 * @route   POST /api/v1/opds
 * @desc    สร้าง OPD ใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.post(
  '/',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR, 
    // UserRole.STAFF
  ]),
  validate(opdValidation.createOpd),
  opdController.createOpd
);

/**
 * @route   PUT /api/v1/opds/:id
 * @desc    อัปเดตข้อมูล OPD
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.put(
  '/:id',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR, 
    // UserRole.STAFF
  ]),
  validate(opdValidation.updateOpd),
  opdController.updateOpd
);

/**
 * @route   PATCH /api/v1/opds/:id/status
 * @desc    อัปเดตสถานะ OPD
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.patch(
  '/:id/status',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR, 
    // UserRole.STAFF
  ]),
  validate(opdValidation.updateOpdStatus),
  opdController.updateOpdStatus
);

/**
 * @route   POST /api/v1/opds/:id/teeth
 * @desc    เพิ่มข้อมูลฟัน
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.post(
  '/:id/teeth',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR,
    // UserRole.STAFF
  ]),
  validate(opdValidation.addTooth),
  opdController.addTooth
);

/**
 * @route   DELETE /api/v1/opds/:id/teeth/:toothNumber
 * @desc    ลบข้อมูลฟัน
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.delete(
  '/:id/teeth/:toothNumber',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR, 
    // UserRole.STAFF
  ]),
  validate(opdValidation.removeTooth),
  opdController.removeTooth
);

/**
 * @route   PATCH /api/v1/opds/:id/teeth/:toothNumber
 * @desc    อัปเดตสภาพฟัน
 * @access  Private (Owner, Admin, Manager, SuperAdmin, Doctor, Staff)
 */
router.patch(
  '/:id/teeth/:toothNumber',
  authorizeRoles([
    UserRole.OWNER, 
    UserRole.ADMIN, 
    UserRole.MANAGER, 
    UserRole.SUPER_ADMIN, 
    // UserRole.DOCTOR, 
    // UserRole.STAFF
  ]),
  validate(opdValidation.updateToothCondition),
  opdController.updateToothCondition
);

/**
 * @route   DELETE /api/v1/opds/:id
 * @desc    ลบ OPD
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(opdValidation.getOpdById),
  opdController.deleteOpd
);

export default router;