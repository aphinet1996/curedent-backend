import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as roomController from '../controllers/room.controller';
import roomValidation from '../validations/room.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

// ============= Room Type Routes =============

/**
 * @route   GET /api/v1/rooms/types
 * @desc    ดึงข้อมูลประเภทห้องทั้งหมด
 * @access  Private (All authenticated users)
 */
router.get(
  '/types',
  roomController.getAllRoomTypes
);

/**
 * @route   GET /api/v1/rooms/types/:id
 * @desc    ดึงข้อมูลประเภทห้องตาม ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/types/:id',
  validate(roomValidation.getRoomTypeById),
  roomController.getRoomTypeById
);

/**
 * @route   POST /api/v1/rooms/types
 * @desc    สร้างประเภทห้องใหม่
 * @access  Private (SuperAdmin only)
 */
router.post(
  '/types',
  authorizeRoles([UserRole.SUPER_ADMIN]),
  validate(roomValidation.createRoomType),
  roomController.createRoomType
);

/**
 * @route   PUT /api/v1/rooms/types/:id
 * @desc    อัปเดตประเภทห้อง
 * @access  Private (SuperAdmin only)
 */
router.put(
  '/types/:id',
  authorizeRoles([UserRole.SUPER_ADMIN]),
  validate(roomValidation.updateRoomType),
  roomController.updateRoomType
);

/**
 * @route   DELETE /api/v1/rooms/types/:id
 * @desc    ลบประเภทห้อง
 * @access  Private (SuperAdmin only)
 */
router.delete(
  '/types/:id',
  authorizeRoles([UserRole.SUPER_ADMIN]),
  validate(roomValidation.getRoomTypeById),
  roomController.deleteRoomType
);

// ============= Room Routes =============

/**
 * @route   GET /api/v1/rooms/available/:branchId
 * @desc    ดึงห้องที่ว่างตามสาขา
 * @access  Private
 */
router.get(
  '/available/:branchId',
  roomController.getAvailableRoomsByBranch
);

/**
 * @route   GET /api/v1/rooms/by-type/:roomTypeId
 * @desc    ดึงห้องตามประเภท
 * @access  Private
 */
router.get(
  '/by-type/:roomTypeId',
  roomController.getRoomsByType
);

/**
 * @route   GET /api/v1/rooms
 * @desc    ดึงข้อมูลห้องทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
  '/',
  roomController.getAllRooms
);

/**
 * @route   GET /api/v1/rooms/:id
 * @desc    ดึงข้อมูลห้องตาม ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(roomValidation.getRoomById),
  roomController.getRoomById
);

/**
 * @route   POST /api/v1/rooms
 * @desc    สร้างห้องใหม่
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.post(
  '/',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(roomValidation.createRoom),
  roomController.createRoom
);

/**
 * @route   PUT /api/v1/rooms/:id
 * @desc    อัปเดตข้อมูลห้อง
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.put(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(roomValidation.updateRoom),
  roomController.updateRoom
);

/**
 * @route   PATCH /api/v1/rooms/:id/status
 * @desc    อัปเดตสถานะห้อง
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/status',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(roomValidation.updateRoomStatus),
  roomController.updateRoomStatus
);

/**
 * @route   PATCH /api/v1/rooms/:id/active
 * @desc    อัปเดตสถานะการใช้งานห้อง
 * @access  Private (Owner, Admin, Manager, SuperAdmin)
 */
router.patch(
  '/:id/active',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN]),
  validate(roomValidation.updateRoomActiveStatus),
  roomController.updateRoomActiveStatus
);

/**
 * @route   DELETE /api/v1/rooms/:id
 * @desc    ลบห้อง
 * @access  Private (Owner, Admin, SuperAdmin)
 */
router.delete(
  '/:id',
  authorizeRoles([UserRole.OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(roomValidation.getRoomById),
  roomController.deleteRoom
);

export default router;