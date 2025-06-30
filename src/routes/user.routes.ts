import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware';
import { 
  authenticateToken, 
  authorizeRoles, 
  authorizeOwnership, 
  authorizeClinic,
  authorizeBranch
} from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';
import * as userValidation from '../validations/user.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง user - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

/**
 * @route   GET /api/v1/users
 * @desc    ดึงรายการผู้ใช้ทั้งหมด
 * @access  Private (Admin, Manager, Owner)
 */
router.get(
  '/',
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]),
  validate(userValidation.findUsers),
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    ดึงข้อมูลผู้ใช้ตาม ID
 * @access  Private (Admin, Manager, Owner หรือเจ้าของบัญชี)
 */
router.get(
  '/:id',
  validate(userValidation.getUserById),
  userController.getUserById
);

/**
 * @route   POST /api/v1/users
 * @desc    สร้างผู้ใช้ใหม่ (โดย Admin, Owner)
 * @access  Private (Super Admin, Owner, Admin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]),
  validate(userValidation.createUser),
  userController.createUser
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    อัปเดตข้อมูลผู้ใช้
 * @access  Private (Admin, Owner หรือเจ้าของบัญชี)
 */
router.put(
  '/:id',
  validate(userValidation.updateUser),
  userController.updateUser
);

/**
 * @route   PATCH /api/v1/users/:id/roles
 * @desc    อัปเดต roles ของผู้ใช้ (เฉพาะ Admin, Owner)
 * @access  Private (Super Admin, Owner, Admin)
 */
router.patch(
  '/:id/roles',
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]),
  validate(userValidation.updateUserRoles),
  userController.updateUserRoles
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    ลบผู้ใช้ (soft delete)
 * @access  Private (Super Admin, Owner, Admin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]),
  userController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/change-password
 * @desc    เปลี่ยนรหัสผ่าน
 * @access  Private (Admin, Owner หรือเจ้าของบัญชี)
 */
router.patch(
  '/:id/change-password',
  validate(userValidation.changePassword),
  userController.changePassword
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    เปลี่ยนสถานะผู้ใช้ (เปิด/ปิดการใช้งาน)
 * @access  Private (Super Admin, Owner, Admin)
 */
router.patch(
  '/:id/status',
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]),
  validate(userValidation.updateUserStatus),
  userController.updateUserStatus
);

/**
 * @route   GET /api/v1/users/:id/permissions
 * @desc    ดึงข้อมูลสิทธิ์ของผู้ใช้
 * @access  Private (Admin, Owner หรือเจ้าของบัญชี)
 */
router.get(
  '/:id/permissions',
  validate(userValidation.getUserById),
  userController.getUserPermissions
);

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    ยืนยันอีเมล
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(userValidation.verifyEmail),
  userController.verifyEmail
);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    ส่งอีเมลยืนยันใหม่
 * @access  Public
 */
router.post(
  '/resend-verification',
  validate(userValidation.resendVerificationEmail),
  userController.resendVerificationEmail
);

// Routes สำหรับ clinic-specific operations
/**
 * @route   GET /api/v1/users/clinic/:clinicId
 * @desc    ดึงผู้ใช้ในคลินิกที่ระบุ
 * @access  Private (Super Admin, Owner, Admin ของคลินิกนั้น)
 */
router.get(
  '/clinic/:clinicId',
  authorizeClinic((req) => req.params.clinicId),
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]),
  userController.getAllUsers
);

/**
 * @route   GET /api/v1/users/branch/:branchId
 * @desc    ดึงผู้ใช้ในสาขาที่ระบุ
 * @access  Private (Super Admin, Owner, Admin, Manager ของสาขานั้น)
 */
router.get(
  '/branch/:branchId',
  authorizeBranch((req) => req.params.branchId),
  authorizeRoles([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER]),
  userController.getAllUsers
);

export default router;