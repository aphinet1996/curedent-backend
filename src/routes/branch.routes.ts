import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as branchController from '../controllers/branch.controller';
import branchValidation from '../validations/branch.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/branches/clinic/:clinicId/stats
 * @desc    ดึงสถิติสาขาของคลินิกตาม ID
 * @access  Private
 */
router.get(
  '/clinic/:clinicId/stats',
  branchController.getClinicBranchesStats
);

/**
 * @route   GET /api/v1/branches/clinic/stats
 * @desc    ดึงสถิติสาขาของคลินิกตัวเอง
 * @access  Private
 */
router.get(
  '/clinic/stats',
  branchController.getClinicBranchesStats
);

/**
 * @route   GET /api/v1/branches/clinic/:clinicId
 * @desc    ดึงข้อมูลสาขาตามคลินิก ID
 * @access  Private
 */
router.get(
  '/clinic/:clinicId',
  branchController.getBranchesByClinic
);

/**
 * @route   GET /api/v1/branches/clinic
 * @desc    ดึงข้อมูลสาขาตามคลินิกของผู้ใช้เอง
 * @access  Private
 */
router.get(
  '/clinic',
  branchController.getBranchesByClinic
);

/**
 * @route   GET /api/v1/branches/:id/stats
 * @desc    ดึงสถิติของสาขา
 * @access  Private
 */
router.get(
  '/:id/stats',
  validate(branchValidation.getBranchById),
  branchController.getBranchStats
);

/**
 * @route   GET /api/v1/branches
 * @desc    ดึงข้อมูลสาขาตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  branchController.getAllBranches
);

/**
 * @route   GET /api/v1/branches/:id
 * @desc    ดึงข้อมูลสาขาตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(branchValidation.getBranchById),
  branchController.getBranchById
);

/**
 * @route   POST /api/v1/branches
 * @desc    สร้างสาขาใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(branchValidation.createBranch),
  branchController.createBranch
);

/**
 * @route   PUT /api/v1/branches/:id
 * @desc    อัปเดตข้อมูลสาขา
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(branchValidation.updateBranch),
  branchController.updateBranch
);

/**
 * @route   PATCH /api/v1/branches/:id/status
 * @desc    อัปเดตสถานะสาขา
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/status',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(branchValidation.updateBranchStatus),
  branchController.updateBranchStatus
);

/**
 * @route   DELETE /api/v1/branches/:id
 * @desc    ลบสาขา
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(branchValidation.getBranchById),
  branchController.deleteBranch
);

export default router;