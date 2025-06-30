import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { uploadAssistantPhoto, handleMulterError } from '../middlewares/upload.middleware';
import * as assistantController from '../controllers/assistant.controller';
import assistantValidation from '../validations/assistant.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/assistants
 * @desc    ดึงข้อมูล assistant ทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  assistantController.getAllAssistants
);

/**
 * @route   GET /api/v1/assistants/option
 * @desc    ดึงข้อมูลตัวเลือก assistant ทั้งหมดตามคลินิค
 * @access  Private
 */
router.get(
  '/option',
  assistantController.getOptionAssistants
);

/**
 * @route   GET /api/v1/assistants/employment/:type
 * @desc    ดึงข้อมูล assistant ตามประเภทการจ้างงาน (partTime, fullTime)
 * @access  Private
 */
router.get(
  '/employment/:type',
  assistantController.getAssistantsByEmploymentType
);

/**
 * @route   GET /api/v1/assistants/:id
 * @desc    ดึงข้อมูล assistant ตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(assistantValidation.getAssistantById),
  assistantController.getAssistantById
);

/**
 * @route   POST /api/v1/assistants
 * @desc    สร้าง assistant ใหม่พร้อมอัปโหลดรูปภาพ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  uploadAssistantPhoto,
  handleMulterError,
  validate(assistantValidation.createAssistant),
  assistantController.createAssistant
);

/**
 * @route   PUT /api/v1/assistants/:id
 * @desc    อัปเดตข้อมูล assistant พร้อมอัปโหลดรูปภาพ
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  uploadAssistantPhoto,
  handleMulterError,
  validate(assistantValidation.updateAssistant),
  assistantController.updateAssistant
);

/**
 * @route   PATCH /api/v1/assistants/:id/status
 * @desc    อัปเดตสถานะ assistant
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/status',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(assistantValidation.updateAssistantStatus),
  assistantController.updateAssistantStatus
);

/**
 * @route   DELETE /api/v1/assistants/:id
 * @desc    ลบ assistant
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(assistantValidation.getAssistantById),
  assistantController.deleteAssistant
);

export default router;