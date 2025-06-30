// routes/drug.routes.ts
import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as drugController from '../controllers/drug.controller';
import drugValidation from '../validations/drug.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

// ============= Search and Lookup Routes =============

/**
 * @route   GET /api/v1/drugs/search
 * @desc    ค้นหายา (ชื่อ, รหัส, หมวดหมู่)
 * @access  Private
 */
router.get(
  '/search',
  validate(drugValidation.searchDrugs),
  drugController.searchDrugs
);

/**
 * @route   GET /api/v1/drugs/code/:drugCode
 * @desc    ดึงข้อมูลยาตามรหัส
 * @access  Private
 */
router.get(
  '/code/:drugCode',
  validate(drugValidation.getDrugByCode),
  drugController.getDrugByCode
);

/**
 * @route   GET /api/v1/drugs/generate-code
 * @desc    สร้างรหัสยาใหม่
 * @access  Private
 */
router.get(
  '/generate-code',
  validate(drugValidation.generateDrugCode),
  drugController.generateDrugCode
);

/**
 * @route   GET /api/v1/drugs/dropdown-options
 * @desc    ดึง dropdown options สำหรับฟอร์มยา
 * @access  Private
 */
router.get(
  '/dropdown-options',
  drugController.getDropdownOptions
);

// ============= Category and Stock Routes =============

/**
 * @route   GET /api/v1/drugs/category/:category
 * @desc    ดึงข้อมูลยาตามหมวดหมู่
 * @access  Private
 */
router.get(
  '/category/:category',
  validate(drugValidation.getDrugsByCategory),
  drugController.getDrugsByCategory
);

/**
 * @route   GET /api/v1/drugs/low-stock
 * @desc    ดึงยาที่ stock ต่ำ - REMOVED (ไว้เพิ่มทีหลัง)
 * @access  Private
 */
// router.get('/low-stock', validate(drugValidation.getLowStockDrugs), drugController.getLowStockDrugs);

// ============= Export and Bulk Operations Routes =============

/**
 * @route   GET /api/v1/drugs/export
 * @desc    Export ข้อมูลยา
 * @access  Private (Manager+)
 */
router.get(
  '/export',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.exportDrugs),
  drugController.exportDrugs
);

/**
 * @route   POST /api/v1/drugs/bulk
 * @desc    Bulk operations (create, update, delete หลายรายการ)
 * @access  Private (Manager+)
 */
router.post(
  '/bulk',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.bulkOperations),
  drugController.bulkOperations
);

// ============= Main CRUD Routes =============

/**
 * @route   GET /api/v1/drugs
 * @desc    ดึงข้อมูลยาทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  validate(drugValidation.getAllDrugs),
  drugController.getAllDrugs
);

/**
 * @route   GET /api/v1/drugs/:id
 * @desc    ดึงข้อมูลยาตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(drugValidation.getDrugById),
  drugController.getDrugById
);

/**
 * @route   POST /api/v1/drugs
 * @desc    สร้างยาใหม่
 * @access  Private (All authenticated users can create drugs)
 */
router.post(
  '/',
  validate(drugValidation.createDrug),
  drugController.createDrug
);

/**
 * @route   PUT /api/v1/drugs/:id
 * @desc    อัปเดตข้อมูลยา
 * @access  Private (Staff can update drugs in their clinic)
 */
router.put(
  '/:id',
  validate(drugValidation.updateDrug),
  drugController.updateDrug
);

/**
 * @route   DELETE /api/v1/drugs/:id
 * @desc    ลบยา (soft delete)
 * @access  Private (Manager+)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.deleteDrug),
  drugController.deleteDrug
);

// ============= Stock Management Routes - REMOVED (ไว้เพิ่มทีหลัง) =============

/**
 * @route   PATCH /api/v1/drugs/:id/stock
 * @desc    อัปเดต stock ยา - REMOVED
 * @access  Private (Manager+)
 */
// router.patch('/:id/stock', authorizeRoles([...]), validate(drugValidation.updateDrugStock), drugController.updateDrugStock);

/**
 * @route   PATCH /api/v1/drugs/:id/archive
 * @desc    Archive/Restore ยา
 * @access  Private (Manager+)
 */
router.patch(
  '/:id/archive',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.toggleArchiveStatus),
  drugController.toggleArchiveStatus
);

// ============= Label Configuration Routes =============

/**
 * @route   PUT /api/v1/drugs/:id/label-config
 * @desc    ตั้งค่าฉลากยาหลายภาษา
 * @access  Private (Manager+)
 */
router.put(
  '/:id/label-config',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.setDrugLabelConfig),
  drugController.setDrugLabelConfig
);

export default router;