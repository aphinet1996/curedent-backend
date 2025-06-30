import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import * as appointmentController from '../controllers/appointment.controller';
import appointmentValidation from '../validations/appointment.validation';
import { UserRole } from '../types/user.types';

const router = Router();

// Middleware สำหรับทุกเส้นทาง - ต้องได้รับการยืนยันตัวตน
router.use(authenticateToken);

// ============= Search and Lookup Routes =============

/**
 * @route   GET /api/v1/appointments/search
 * @desc    ค้นหาการนัดหมาย (ชื่อผู้ป่วย, หมายเหตุ, เหตุผล)
 * @access  Private
 */
router.get(
    '/search',
    appointmentController.searchAppointments
);

/**
 * @route   POST /api/v1/appointments/check-availability
 * @desc    ตรวจสอบความพร้อมของเวลา
 * @access  Private
 */
router.post(
    '/check-availability',
    validate(appointmentValidation.checkAvailability),
    appointmentController.checkAvailability
);

/**
 * @route   GET /api/v1/appointments/upcoming
 * @desc    ดึงการนัดหมายที่จะถึงกำหนด
 * @access  Private
 */
router.get(
    '/upcoming',
    appointmentController.getUpcomingAppointments
);

/**
 * @route   GET /api/v1/appointments/today
 * @desc    ดึงการนัดหมายวันนี้
 * @access  Private
 */
router.get(
    '/today',
    appointmentController.getTodayAppointments
);

// ============= Statistics Routes =============

/**
 * @route   GET /api/v1/appointments/stats
 * @desc    ดึงสถิติการนัดหมายของคลินิกตัวเอง
 * @access  Private
 */
router.get(
    '/stats',
    appointmentController.getAppointmentStats
);

/**
 * @route   GET /api/v1/appointments/clinic/:clinicId/stats
 * @desc    ดึงสถิติการนัดหมายตามคลินิก
 * @access  Private
 */
router.get(
    '/clinic/:clinicId/stats',
    validate(appointmentValidation.getAppointmentStats),
    appointmentController.getAppointmentStats
);

/**
 * @route   GET /api/v1/appointments/branch/:branchId/stats
 * @desc    ดึงสถิติการนัดหมายตามสาขา
 * @access  Private
 */
router.get(
    '/branch/:branchId/stats',
    validate(appointmentValidation.getAppointmentStats),
    appointmentController.getAppointmentStats
);

// ============= Branch and Clinic Routes =============

/**
 * @route   GET /api/v1/appointments/branch/:branchId
 * @desc    ดึงข้อมูลการนัดหมายตามสาขา
 * @access  Private
 */
router.get(
    '/branch/:branchId',
    validate(appointmentValidation.getAppointmentsByBranch),
    appointmentController.getAppointmentsByBranch
);

/**
 * @route   GET /api/v1/appointments/clinic/:clinicId
 * @desc    ดึงข้อมูลการนัดหมายตามคลินิก ID
 * @access  Private
 */
router.get(
    '/clinic/:clinicId',
    appointmentController.getAppointmentsByClinic
);

/**
 * @route   GET /api/v1/appointments/clinic
 * @desc    ดึงข้อมูลการนัดหมายตามคลินิกของผู้ใช้เอง
 * @access  Private
 */
router.get(
    '/clinic',
    appointmentController.getAppointmentsByClinic
);

// ============= Doctor-specific Routes =============

/**
 * @route   GET /api/v1/appointments/doctors/:doctorId/schedule
 * @desc    ดึงตารางงานของแพทย์
 * @access  Private
 */
router.get(
    '/doctors/:doctorId/schedule',
    validate(appointmentValidation.getDoctorSchedule),
    appointmentController.getDoctorSchedule
);

// ============= Patient-specific Routes =============

/**
 * @route   GET /api/v1/appointments/patients/:patientId
 * @desc    ดึงการนัดหมายของผู้ป่วย
 * @access  Private
 */
router.get(
    '/patients/:patientId',
    validate(appointmentValidation.getPatientAppointments),
    appointmentController.getPatientAppointments
);

// ============= Bulk Operations Routes =============

/**
 * @route   PATCH /api/v1/appointments/bulk/status
 * @desc    อัปเดตสถานะการนัดหมายหลายรายการ
 * @access  Private (Manager, Admin, Owner, SuperAdmin)
 */
router.patch(
    '/bulk/status',
    authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
    validate(appointmentValidation.bulkUpdateStatus),
    appointmentController.bulkUpdateStatus
);

// ============= Status Management Routes =============

/**
 * @route   PATCH /api/v1/appointments/:id/cancel
 * @desc    ยกเลิกการนัดหมาย
 * @access  Private
 */
router.patch(
    '/:id/cancel',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.cancelAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/confirm
 * @desc    ยืนยันการนัดหมาย
 * @access  Private
 */
router.patch(
    '/:id/confirm',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.confirmAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/start
 * @desc    เริ่มการนัดหมาย (เปลี่ยนสถานะเป็น in_progress)
 * @access  Private
 */
router.patch(
    '/:id/start',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.startAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/complete
 * @desc    เสร็จสิ้นการนัดหมาย
 * @access  Private
 */
router.patch(
    '/:id/complete',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.completeAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/no-show
 * @desc    บันทึกผู้ป่วยไม่มาตามนัด
 * @access  Private
 */
router.patch(
    '/:id/no-show',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.markNoShow
);

/**
 * @route   PATCH /api/v1/appointments/:id/reschedule
 * @desc    เลื่อนการนัดหมาย
 * @access  Private
 */
router.patch(
    '/:id/reschedule',
    validate(appointmentValidation.updateAppointment),
    appointmentController.rescheduleAppointment
);

// ============= Main CRUD Routes =============

/**
 * @route   GET /api/v1/appointments
 * @desc    ดึงข้อมูลการนัดหมายทั้งหมดตามสิทธิ์ผู้ใช้
 * @access  Private
 */
router.get(
    '/',
    validate(appointmentValidation.getAppointments),
    appointmentController.getAllAppointments
);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    ดึงข้อมูลการนัดหมายตาม ID
 * @access  Private
 */
router.get(
    '/:id',
    validate(appointmentValidation.getAppointmentById),
    appointmentController.getAppointmentById
);

/**
 * @route   POST /api/v1/appointments
 * @desc    สร้างการนัดหมายใหม่
 * @access  Private (All authenticated users can create appointments)
 */
router.post(
    '/',
    validate(appointmentValidation.createAppointment),
    appointmentController.createAppointment
);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    อัปเดตข้อมูลการนัดหมาย
 * @access  Private (Staff can update appointments in their clinic)
 */
router.put(
    '/:id',
    validate(appointmentValidation.updateAppointment),
    appointmentController.updateAppointment
);

/**
 * @route   PATCH /api/v1/appointments/:id/active
 * @desc    เปลี่ยนสถานะการใช้งานการนัดหมาย (soft delete/restore)
 * @access  Private (Manager, Admin, Owner, SuperAdmin)
 */
router.patch(
    '/:id/active',
    authorizeRoles([UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
    appointmentController.updateAppointmentActiveStatus
);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    ลบการนัดหมาย (hard delete - ใช้ระวัง)
 * @access  Private (Admin, Owner, SuperAdmin only)
 */
router.delete(
    '/:id',
    authorizeRoles([UserRole.ADMIN, UserRole.OWNER, UserRole.SUPER_ADMIN]),
    validate(appointmentValidation.getAppointmentById),
    appointmentController.deleteAppointment
);

// ============= Calendar View Routes =============

/**
 * @route   GET /api/v1/appointments/calendar/day
 * @desc    ดึงการนัดหมายสำหรับ Calendar Day View
 * @access  Private
 */
router.get(
    '/calendar/day',
    validate(appointmentValidation.getCalendarDayView),
    appointmentController.getCalendarDayView
);

/**
 * @route   GET /api/v1/appointments/calendar/week
 * @desc    ดึงการนัดหมายสำหรับ Calendar Week View
 * @access  Private
 */
router.get(
    '/calendar/week',
    validate(appointmentValidation.getCalendarWeekView),
    appointmentController.getCalendarWeekView
);

/**
 * @route   GET /api/v1/appointments/calendar/month
 * @desc    ดึงการนัดหมายสำหรับ Calendar Month View
 * @access  Private
 */
router.get(
    '/calendar/month',
    validate(appointmentValidation.getCalendarMonthView),
    appointmentController.getCalendarMonthView
);

/**
 * @route   GET /api/v1/appointments/calendar/overview
 * @desc    ดึงการนัดหมายสำหรับหลาย view พร้อมกัน (dashboard)
 * @access  Private
 */
router.get(
    '/calendar/overview',
    appointmentController.getCalendarOverview
);

/**
 * @route   GET /api/v1/appointments/calendar/summary
 * @desc    ดึงสรุปสถิติการนัดหมายแบบ quick summary
 * @access  Private
 */
router.get(
    '/calendar/summary',
    appointmentController.getCalendarQuickSummary
);

export default router;

/**
 * Route Summary:
 * 
 * ============= Search and Lookup =============
 * GET    /search                              - ค้นหาการนัดหมาย
 * POST   /check-availability                  - ตรวจสอบความพร้อมของเวลา
 * GET    /upcoming                           - ดึงการนัดหมายที่จะถึงกำหนด
 * GET    /today                              - ดึงการนัดหมายวันนี้
 * 
 * ============= Statistics =============
 * GET    /stats                              - ดึงสถิติการนัดหมายของคลินิกตัวเอง
 * GET    /clinic/:clinicId/stats             - ดึงสถิติการนัดหมายตามคลินิก
 * GET    /branch/:branchId/stats             - ดึงสถิติการนัดหมายตามสาขา
 * 
 * ============= Branch and Clinic =============
 * GET    /branch/:branchId                   - ดึงข้อมูลการนัดหมายตามสาขา
 * GET    /clinic/:clinicId                   - ดึงข้อมูลการนัดหมายตามคลินิก ID
 * GET    /clinic                             - ดึงข้อมูลการนัดหมายตามคลินิกของผู้ใช้เอง
 * 
 * ============= Doctor-specific =============
 * GET    /doctors/:doctorId/schedule         - ดึงตารางงานของแพทย์
 * 
 * ============= Patient-specific =============
 * GET    /patients/:patientId                - ดึงการนัดหมายของผู้ป่วย
 * 
 * ============= Bulk Operations =============
 * PATCH  /bulk/status                        - อัปเดตสถานะการนัดหมายหลายรายการ
 * 
 * ============= Status Management =============
 * PATCH  /:id/cancel                         - ยกเลิกการนัดหมาย
 * PATCH  /:id/confirm                        - ยืนยันการนัดหมาย
 * PATCH  /:id/start                          - เริ่มการนัดหมาย
 * PATCH  /:id/complete                       - เสร็จสิ้นการนัดหมาย
 * PATCH  /:id/no-show                        - บันทึกผู้ป่วยไม่มาตามนัด
 * PATCH  /:id/reschedule                     - เลื่อนการนัดหมาย
 * 
 * ============= Main CRUD =============
 * GET    /                                   - ดึงข้อมูลการนัดหมายทั้งหมด (with filters)
 * GET    /:id                                - ดึงข้อมูลการนัดหมายตาม ID
 * POST   /                                   - สร้างการนัดหมายใหม่
 * PUT    /:id                                - อัปเดตข้อมูลการนัดหมาย
 * PATCH  /:id/active                         - เปลี่ยนสถานะการใช้งาน
 * DELETE /:id                                - ลบการนัดหมาย (hard delete)
 */