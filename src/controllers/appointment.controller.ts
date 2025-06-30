import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { AppointmentService } from '../services/appointment.service';
import { toAppointmentResponse, AppointmentStatus } from '../types/appointment.types';
import { UserRole } from '../types/user.types';
import { getObjectIdString } from '../utils/mogoose.utils'; // เพิ่ม import

const appointmentService = new AppointmentService();

export const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
    // filter query parameters
    const filter: any = { isActive: true };

    // Search
    if (req.query.branchId) filter.branchId = req.query.branchId;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    // Date filters
    if (req.query.date) {
        const date = new Date(req.query.date as string);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (req.query.startDate || req.query.endDate) {
        const dateFilter: any = {};
        if (req.query.startDate) dateFilter.$gte = new Date(req.query.startDate as string);
        if (req.query.endDate) dateFilter.$lte = new Date(req.query.endDate as string);
        filter.appointmentDate = dateFilter;
    }

    // Permission
    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        filter.clinicId = getObjectIdString(req.user!.clinicId);
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortBy as string) || 'appointmentDate';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Secondary sort
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };
    if (sortField !== 'startTime') {
        sort.startTime = 1;
    }

    const { appointments, total, totalPages } = await appointmentService.findAll(
        filter,
        sort,
        page,
        limit
    );

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const searchAppointments = catchAsync(async (req: Request, res: Response) => {
    const searchTerm = req.query.q as string;
    const branchId = req.query.branchId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm) {
        return res.status(400).json({
            status: 'error',
            message: 'กรุณาระบุคำค้นหา'
        });
    }

    let clinicId: string | undefined;
    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        clinicId = getObjectIdString(req.user!.clinicId);
    }

    const { appointments, total, totalPages } = await appointmentService.searchAppointments(
        searchTerm,
        clinicId,
        branchId,
        page,
        limit
    );

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
            searchTerm,
        },
    });
});

export const getAppointmentById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.findById(appointmentId);

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        getObjectIdString(appointment.clinicId) !== getObjectIdString(req.user!.clinicId)) {
        return next(new AppError('คุณไม่มีสิทธิ์การนัดหมายนี้', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const createAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentData = req.body;

    if (!appointmentData.clinicId && req.user!.clinicId) {
        appointmentData.clinicId = getObjectIdString(req.user!.clinicId);
    }

    if (typeof appointmentData.tags === 'string') {
        try {
            appointmentData.tags = JSON.parse(appointmentData.tags);
        } catch (error) {
            appointmentData.tags = [];
        }
    }

    const newAppointment = await appointmentService.createAppointment(appointmentData, req.user!._id.toString());

    res.status(201).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(newAppointment),
        },
    });
});

export const updateAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;
    const updateData = req.body;

    const appointment = await appointmentService.findById(appointmentId);
    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        getObjectIdString(appointment.clinicId) !== getObjectIdString(req.user!.clinicId)) {
        return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลการนัดหมายนี้', 403));
    }

    if (updateData.tags && typeof updateData.tags === 'string') {
        try {
            updateData.tags = JSON.parse(updateData.tags);
        } catch (error) {
            updateData.tags = [];
        }
    }

    const updatedAppointment = await appointmentService.updateAppointment(appointmentId, updateData, req.user!._id.toString());

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(updatedAppointment!),
        },
    });
});

export const updateAppointmentActiveStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;
    const { isActive } = req.body;

    const appointment = await appointmentService.findById(appointmentId);
    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        getObjectIdString(appointment.clinicId) !== getObjectIdString(req.user!.clinicId)) { 
        return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยนสถานะการนัดหมายนี้', 403));
    }

    const updatedAppointment = await appointmentService.updateAppointmentActiveStatus(appointmentId, isActive, req.user!._id.toString());

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(updatedAppointment!),
        },
    });
});

export const deleteAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.findById(appointmentId);
    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        getObjectIdString(appointment.clinicId) !== getObjectIdString(req.user!.clinicId)) { 
        return next(new AppError('คุณไม่มีสิทธิ์ลบการนัดหมายนี้', 403));
    }

    await appointmentService.deleteAppointment(appointmentId);

    res.status(200).json({
        status: 'success',
        data: null,
    });
});

export const getAppointmentsByBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const branchId = req.params.branchId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        // TODO: ตรวจสอบว่าสาขานี้อยู่ในคลินิกของผู้ใช้หรือไม่
    }

    const { appointments, total, totalPages } = await appointmentService.findByBranch(branchId, page, limit);

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            branchId,
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const getAppointmentsByClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.params.clinicId || getObjectIdString(req.user!.clinicId); 
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        clinicId !== getObjectIdString(req.user!.clinicId)) { 
        return next(new AppError('คุณไม่มีสิทธิ์การนัดหมายของคลินิกนี้', 403));
    }

    const { appointments, total, totalPages } = await appointmentService.findByClinic(clinicId, page, limit);

    res.status(200).json({
        status: 'success',
        results: appointments.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            clinicId,
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const getDoctorSchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return next(new AppError('ต้องระบุช่วงวันที่', 400));
    }

    const appointments = await appointmentService.findByDoctor(
        doctorId,
        new Date(startDate as string),
        new Date(endDate as string)
    );

    res.status(200).json({
        status: 'success',
        data: {
            doctorId,
            startDate,
            endDate,
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const getPatientAppointments = catchAsync(async (req: Request, res: Response) => {
    const { patientId } = req.params;

    const appointments = await appointmentService.findByPatient(patientId);

    res.status(200).json({
        status: 'success',
        data: {
            patientId,
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const checkAvailability = catchAsync(async (req: Request, res: Response) => {
    const {
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        excludeAppointmentId
    } = req.body;

    const isAvailable = await appointmentService.checkAvailability(
        doctorId,
        new Date(appointmentDate),
        startTime,
        endTime,
        excludeAppointmentId
    );

    res.status(200).json({
        status: 'success',
        data: {
            available: isAvailable,
            message: isAvailable ? 'ว่าง' : 'ไม่ว่าง'
        }
    });
});

export const bulkUpdateStatus = catchAsync(async (req: Request, res: Response) => {
    const { appointmentIds, status } = req.body;

    const updatedCount = await appointmentService.bulkUpdateStatus(
        appointmentIds,
        status,
        req.user!._id.toString()
    );

    res.status(200).json({
        status: 'success',
        data: {
            updatedCount,
        },
    });
});

export const cancelAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        { status: AppointmentStatus.CANCELLED },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const confirmAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        { status: AppointmentStatus.CONFIRMED },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const startAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        { status: AppointmentStatus.IN_PROGRESS },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const completeAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        { status: AppointmentStatus.COMPLETED },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const markNoShow = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        { status: AppointmentStatus.NO_SHOW },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const rescheduleAppointment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const appointmentId = req.params.id;
    const updateData = req.body;

    const appointment = await appointmentService.updateAppointment(
        appointmentId,
        {
            ...updateData,
            status: AppointmentStatus.RESCHEDULED
        },
        req.user!._id.toString()
    );

    if (!appointment) {
        return next(new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            appointment: toAppointmentResponse(appointment),
        },
    });
});

export const getAppointmentStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.params.clinicId || getObjectIdString(req.user!.clinicId); 
    const branchId = req.params.branchId;
    const { startDate, endDate } = req.query;

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }
    
    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        clinicId !== getObjectIdString(req.user!.clinicId)) { 
        return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงสถิติการนัดหมายของคลินิกนี้', 403));
    }

    const stats = await appointmentService.getAppointmentStats(
        clinicId,
        branchId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
        status: 'success',
        data: {
            clinicId,
            branchId,
            stats,
        },
    });
});

export const getUpcomingAppointments = catchAsync(async (req: Request, res: Response) => {
    const {
        doctorId,
        hours = '24'
    } = req.query;

    const appointments = await appointmentService.getUpcomingAppointments(
        doctorId as string,
        parseInt(hours as string)
    );

    res.status(200).json({
        status: 'success',
        data: {
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
        },
    });
});

export const getTodayAppointments = catchAsync(async (req: Request, res: Response) => {
    const {
        doctorId,
        branchId,
        status
    } = req.query;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: any = {
        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        isActive: true
    };

    if (doctorId) filter.doctorId = doctorId;
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        filter.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    const { appointments, total } = await appointmentService.findAll(filter, {
        startTime: 1
    }, 1, 100);

    res.status(200).json({
        status: 'success',
        data: {
            appointments: appointments.map(appointment => toAppointmentResponse(appointment)),
            total,
        },
    });
});

export const getCalendarDayView = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        date,
        doctorId,
        branchId,
        status,
        timezone = 'Asia/Bangkok',
        populate
    } = req.query;

    const options: any = {};
    if (doctorId) options.doctorId = doctorId as string;
    if (branchId) options.branchId = branchId as string;
    if (status) options.status = status as AppointmentStatus;
    if (populate) options.populate = populate as string;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        options.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    const result = await appointmentService.getCalendarDayView(
        new Date(date as string),
        options
    );

    res.status(200).json({
        status: 'success',
        data: {
            view: 'day',
            timezone,
            ...result,
            appointments: result.appointments.map(appointment => toAppointmentResponse(appointment))
        }
    });
});

export const getCalendarWeekView = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        date,
        startDate,
        endDate,
        doctorId,
        branchId,
        status,
        timezone = 'Asia/Bangkok',
        weekStartsOn = 1,
        populate
    } = req.query;

    let targetDate: Date;

    if (startDate && endDate) {
        targetDate = new Date(startDate as string);
    } else {
        targetDate = date ? new Date(date as string) : new Date();
    }

    
    const options: any = {};
    if (doctorId) options.doctorId = doctorId as string;
    if (branchId) options.branchId = branchId as string;
    if (status) options.status = status as AppointmentStatus;
    if (populate) options.populate = populate as string;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        options.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    const result = await appointmentService.getCalendarWeekView(
        targetDate,
        parseInt(weekStartsOn as string),
        options
    );

    const formattedResult = {
        ...result,
        days: result.days.map(day => ({
            ...day,
            appointments: day.appointments.map(appointment => toAppointmentResponse(appointment))
        }))
    };

    res.status(200).json({
        status: 'success',
        data: {
            view: 'week',
            timezone,
            weekStartsOn: parseInt(weekStartsOn as string),
            ...formattedResult
        }
    });
});

export const getCalendarMonthView = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        date,
        year,
        month,
        doctorId,
        branchId,
        status,
        timezone = 'Asia/Bangkok',
        includeAdjacentDays = false,
        populate
    } = req.query;

    let targetYear: number;
    let targetMonth: number;

    if (date) {
        const targetDate = new Date(date as string);
        targetYear = targetDate.getFullYear();
        targetMonth = targetDate.getMonth() + 1;
    } else if (year && month) {
        targetYear = parseInt(year as string);
        targetMonth = parseInt(month as string);
    } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth() + 1;
    }
    
    const options: any = {};
    if (doctorId) options.doctorId = doctorId as string;
    if (branchId) options.branchId = branchId as string;
    if (status) options.status = status as AppointmentStatus;
    if (populate) options.populate = populate as string;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        options.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    const result = await appointmentService.getCalendarMonthView(
        targetYear,
        targetMonth,
        includeAdjacentDays === 'true',
        options
    );

    const formattedResult = {
        ...result,
        weeks: result.weeks.map(week => ({
            ...week,
            days: week.days.map(day => ({
                ...day,
                appointments: day.appointments.map(appointment => toAppointmentResponse(appointment))
            }))
        }))
    };

    res.status(200).json({
        status: 'success',
        data: {
            view: 'month',
            timezone,
            includeAdjacentDays: includeAdjacentDays === 'true',
            ...formattedResult
        }
    });
});

export const getCalendarOverview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        date,
        doctorId,
        branchId,
        status,
        timezone = 'Asia/Bangkok'
    } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();

    
    const options: any = {};
    if (doctorId) options.doctorId = doctorId as string;
    if (branchId) options.branchId = branchId as string;
    if (status) options.status = status as AppointmentStatus;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        options.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    const [dayView, weekView, monthView] = await Promise.all([
        appointmentService.getCalendarDayView(targetDate, options),
        appointmentService.getCalendarWeekView(targetDate, 1, options),
        appointmentService.getCalendarMonthView(
            targetDate.getFullYear(),
            targetDate.getMonth() + 1,
            false,
            options
        )
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            timezone,
            date: targetDate.toISOString().split('T')[0],
            day: {
                ...dayView,
                appointments: dayView.appointments.map(appointment => toAppointmentResponse(appointment))
            },
            week: {
                ...weekView,
                days: weekView.days.map(day => ({
                    ...day,
                    appointments: day.appointments.map(appointment => toAppointmentResponse(appointment))
                }))
            },
            month: {
                ...monthView,
                weeks: monthView.weeks.map(week => ({
                    ...week,
                    days: week.days.map(day => ({
                        ...day,
                        appointments: day.appointments.map(appointment => toAppointmentResponse(appointment))
                    }))
                }))
            }
        }
    });
});

export const getCalendarQuickSummary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const {
        doctorId,
        branchId,
        timezone = 'Asia/Bangkok'
    } = req.query;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const weekAfterNext = new Date(today);
    weekAfterNext.setDate(weekAfterNext.getDate() + 14);

    const options: any = {};
    if (doctorId) options.doctorId = doctorId as string;
    if (branchId) options.branchId = branchId as string;

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        options.clinicId = getObjectIdString(req.user!.clinicId); 
    }

    try {
        const [
            todayData,
            tomorrowData,
            thisWeekData,
            nextWeekData
        ] = await Promise.all([
            // Today
            appointmentService.findAll({
                ...options,
                appointmentDate: {
                    $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    $lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
                },
                isActive: true
            }, {}, 1, 1000),

            // Tomorrow
            appointmentService.findAll({
                ...options,
                appointmentDate: {
                    $gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
                    $lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
                },
                isActive: true
            }, {}, 1, 1000),

            // 7 Days
            appointmentService.findAll({
                ...options,
                appointmentDate: {
                    $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    $lt: nextWeek
                },
                isActive: true
            }, {}, 1, 1000),

            // Next week
            appointmentService.findAll({
                ...options,
                appointmentDate: {
                    $gte: nextWeek,
                    $lt: weekAfterNext
                },
                isActive: true
            }, {}, 1, 1000)
        ]);

        const allUpcomingAppointments = thisWeekData.appointments.concat(nextWeekData.appointments);
        const pendingCount = allUpcomingAppointments.filter(apt => apt.status === AppointmentStatus.SCHEDULED).length;
        const confirmedCount = allUpcomingAppointments.filter(apt => apt.status === AppointmentStatus.CONFIRMED).length;

        res.status(200).json({
            status: 'success',
            data: {
                timezone,
                summary: {
                    today: todayData.total,
                    tomorrow: tomorrowData.total,
                    thisWeek: thisWeekData.total,
                    nextWeek: nextWeekData.total,
                    pending: pendingCount,
                    confirmed: confirmedCount,
                    total: thisWeekData.total + nextWeekData.total
                },
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        return next(new AppError('เกิดข้อผิดพลาดในการดึงสรุปสถิติการนัดหมาย', 500));
    }
});