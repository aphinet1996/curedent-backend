import { Router } from 'express';
import { validate } from '../middlewares/validation.middleware';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware';
import * as authController from '../controllers/auth.controller';
import * as authValidation from '../validations/auth.validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    ลงทะเบียนผู้ใช้ใหม่
 * @access  Public
 */
router.post(
  '/register',
  validate(authValidation.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    เข้าสู่ระบบและรับ token
 * @access  Public
 */
router.post(
  '/login', 
  validate(authValidation.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    รีเฟรช access token
 * @access  Public (with refresh token)
 */
router.post(
  '/refresh-token',
  validate(authValidation.refreshToken),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    ขอรีเซ็ตรหัสผ่าน
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    รีเซ็ตรหัสผ่าน
 * @access  Public (with reset token)
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    ยืนยันอีเมล
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    ส่งอีเมลยืนยันใหม่
 * @access  Public
 */
router.post(
  '/resend-verification',
  validate(authValidation.resendVerificationEmail),
  authController.resendVerificationEmail
);

// Protected routes - ต้องเข้าสู่ระบบ
router.use(authenticateToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    ออกจากระบบ (เพิกถอน token)
 * @access  Private
 */
router.post(
  '/logout',
  authController.logout
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    ดึงข้อมูลผู้ใช้ปัจจุบัน
 * @access  Private
 */
router.get(
  '/profile',
  authController.getCurrentUser
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    อัปเดตโปรไฟล์ผู้ใช้ปัจจุบัน
 * @access  Private
 */
router.put(
  '/profile',
  validate(authValidation.updateProfile),
  authController.updateProfile
);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    เปลี่ยนรหัสผ่าน
 * @access  Private
 */
router.patch(
  '/change-password',
  validate(authValidation.changePassword),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    ดึงรายการ active sessions
 * @access  Private
 */
router.get(
  '/sessions',
  authController.getActiveSessions
);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    ยกเลิก session ที่ระบุ
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authController.revokeSession
);

/**
 * @route   DELETE /api/v1/auth/sessions
 * @desc    ยกเลิก sessions ทั้งหมด (ยกเว้น session ปัจจุบัน)
 * @access  Private
 */
router.delete(
  '/sessions',
  authController.revokeAllSessions
);

/**
 * @route   GET /api/v1/auth/check-username
 * @desc    ตรวจสอบว่าชื่อผู้ใช้สามารถใช้ได้หรือไม่
 * @access  Public (Optional Auth)
 */
router.get(
  '/check-username/:username',
  optionalAuth,
  authController.checkUsernameAvailability
);

/**
 * @route   GET /api/v1/auth/check-email
 * @desc    ตรวจสอบว่าอีเมลสามารถใช้ได้หรือไม่
 * @access  Public (Optional Auth)
 */
router.get(
  '/check-email/:email',
  optionalAuth,
  authController.checkEmailAvailability
);

export default router;