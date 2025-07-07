import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as drugOptionsController from '../controllers/drug-options.controller';
import drugValidation from '../validations/drug.validation';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticateToken);

/**
 * @route   POST /api/v1/drug-options/init
 * @desc    สร้างข้อมูลเริ่มต้นของระบบยา
 * @access  Private (SuperAdmin only)
 */
router.post(
    '/init',
    authorizeRoles([UserRole.SUPER_ADMIN]),
    drugOptionsController.initializeDefaultOptions
);

/**
 * @route   POST /api/v1/drug-options/bulk
 * @desc    Bulk operations สำหรับจัดการตัวเลือกหลายรายการ
 * @access  Private (Manager+)
 */
router.post(
    '/bulk',
    authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
    validate(drugValidation.bulkUpdateDrugOptions),
    drugOptionsController.bulkUpdateOptions
);

/**
 * @route   GET /api/v1/drug-options
 * @desc    ดึงตัวเลือก dropdown ทั้งหมดสำหรับยา
 * @access  Private
 */
router.get(
  '/',
  drugOptionsController.getAllDropdownOptions
);

/**
 * @route   GET /api/v1/drug-options/:category
 * @desc    ดึงตัวเลือกตามประเภท
 * @access  Private
 */
router.get(
  '/:category',
  validate(drugValidation.getDrugOptionsByCategory),
  drugOptionsController.getOptionsByCategory
);

/**
 * @route   POST /api/v1/drug-options/:category
 * @desc    เพิ่มตัวเลือกใหม่
 * @access  Private (Manager+)
 */
router.post(
  '/:category',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.addDrugOptionValue),
  drugOptionsController.addOptionValue
);

/**
 * @route   PUT /api/v1/drug-options/:category
 * @desc    อัปเดตตัวเลือกทั้งหมดของประเภท
 * @access  Private (Manager+)
 */
router.put(
    '/:category',
    authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
    validate(drugValidation.updateDrugOptions),
    drugOptionsController.updateOptionsForClinic
  );
  

/**
 * @route   DELETE /api/v1/drug-options/:category/:value
 * @desc    ลบตัวเลือก
 * @access  Private (Manager+)
 */
router.delete(
  '/:category/:value',
  authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
  validate(drugValidation.removeDrugOptionValue),
  drugOptionsController.removeOptionValue
);

export default router;