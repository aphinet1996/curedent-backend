import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { uploadDoctorPhoto, handleMulterError } from '../middlewares/upload.middleware';
import * as doctorController from '../controllers/doctor.controller';
import doctorValidation from '../validations/doctor.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/doctors
 * @desc    ดึงข้อมูลหมอทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  doctorController.getAllDoctors
);

/**
 * @route   GET /api/v1/doctors-option
 * @desc    ดึงข้อมูลตัวเลือกหมอทั้งหมดตามคลินิค
 * @access  Private
 */
router.get(
  '/option',
  doctorController.getOptionDoctors
);

/**
 * @route   GET /api/v1/doctors/used-colors
 * @desc    ดึงสีที่ใช้แล้วในคลินิก
 * @access  Private
 */
router.get(
  '/used-colors',
  doctorController.getUsedColorsInClinic
);

/**
 * @route   GET /api/v1/doctors/suggested-color
 * @desc    ดึงสีที่แนะนำสำหรับคลินิก
 * @access  Private
 */
router.get(
  '/suggested-color',
  doctorController.getSuggestedColorForClinic
);

/**
 * @route   GET /api/v1/doctors/:id
 * @desc    ดึงข้อมูลหมอตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(doctorValidation.getDoctorById),
  doctorController.getDoctorById
);

/**
 * @route   POST /api/v1/doctors
 * @desc    สร้างหมอใหม่พร้อมอัปโหลดรูปภาพ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  uploadDoctorPhoto,
  handleMulterError,
  validate(doctorValidation.createDoctor),
  doctorController.createDoctor
);

/**
 * @route   PUT /api/v1/doctors/:id
 * @desc    อัปเดตข้อมูลหมอพร้อมอัปโหลดรูปภาพ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  uploadDoctorPhoto,
  handleMulterError,
  validate(doctorValidation.updateDoctor),
  doctorController.updateDoctor
);

/**
 * @route   PATCH /api/v1/doctors/:id/color
 * @desc    อัปเดตสีของหมอ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/color',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(doctorValidation.updateDoctorColor),
  doctorController.updateDoctorColor
);

/**
 * @route   PATCH /api/v1/doctors/:id/status
 * @desc    อัปเดตสถานะหมอ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/status',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(doctorValidation.updateDoctorStatus),
  doctorController.updateDoctorStatus
);

/**
 * @route   DELETE /api/v1/doctors/:id
 * @desc    ลบหมอ
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(doctorValidation.getDoctorById),
  doctorController.deleteDoctor
);

export default router;