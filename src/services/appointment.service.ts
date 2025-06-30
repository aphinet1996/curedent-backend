import { FilterQuery } from 'mongoose';
import { Appointment } from '../models/appointment.model';
import Branch from '../models/branch.model';
import { Patient } from '../models/patient.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
    IAppointmentDocument,
    CreateAppointmentInput,
    UpdateAppointmentInput,
    AppointmentStatus,
    AppointmentType,
    combineDateTime,
    calculateDuration
} from '../types/appointment.types';

/**
 * Interface สำหรับ Calendar View Options
 */
interface CalendarViewOptions {
    doctorId?: string;
    branchId?: string;
    clinicId?: string;
    status?: AppointmentStatus;
    timezone?: string;
    populate?: string;
}

/**
 * Interface สำหรับ Calendar Day Response
 */
interface CalendarDayResponse {
    date: string;
    appointments: IAppointmentDocument[];
    summary: {
        total: number;
        byStatus: { [key: string]: number };
        byType: { [key: string]: number };
    };
}

/**
 * Interface สำหรับ Calendar Day ใน Week/Month view
 */
interface CalendarDay {
    date: string;
    dayOfMonth?: number;
    dayOfWeek?: number;
    isCurrentMonth?: boolean;
    appointments: IAppointmentDocument[];
    appointmentCount: number;
}

/**
 * Interface สำหรับ Calendar Week
 */
interface CalendarWeek {
    weekNumber: number;
    days: CalendarDay[];
}

/**
 * Interface สำหรับ Calendar Week Response
 */
interface CalendarWeekResponse {
    weekStart: string;
    weekEnd: string;
    days: CalendarDay[];
    summary: {
        totalAppointments: number;
        byStatus: { [key: string]: number };
        byType: { [key: string]: number };
        byDay: { [key: string]: number };
    };
}

/**
 * Interface สำหรับ Calendar Month Response
 */
interface CalendarMonthResponse {
    year: number;
    month: number;
    monthName: string;
    weeks: CalendarWeek[];
    summary: {
        totalAppointments: number;
        byStatus: { [key: string]: number };
        byType: { [key: string]: number };
        byWeek: { [key: string]: number };
    };
}

/**
 * Interface สำหรับ query options
 */
interface AppointmentQuery {
    clinicId?: string;
    branchId?: string;
    doctorId?: string;
    patientId?: string;
    status?: AppointmentStatus;
    type?: AppointmentType;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    date?: Date;
    search?: string;
}


export class AppointmentService {
    /**
     * ค้นหาการนัดหมายโดยใช้ ID
     */
    async findById(id: string): Promise<IAppointmentDocument | null> {
        try {
            return await Appointment.findById(id)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstName lastName phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('createdBy', 'userName firstName lastName')
                .populate('updatedBy', 'userName firstName lastName');
        } catch (error) {
            logger.error(`Error finding appointment by ID: ${error}`);
            return null;
        }
    }

    /**
     * ดึงข้อมูลการนัดหมายทั้งหมดพร้อมเงื่อนไขการค้นหา
     */
    async findAll(
        filter: FilterQuery<IAppointmentDocument> = {},
        sort: Record<string, 1 | -1> = { appointmentDate: 1, startTime: 1 },
        page = 1,
        limit = 10
    ): Promise<{ appointments: IAppointmentDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const skip = (page - 1) * limit;
            const appointments = await Appointment.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstName lastName phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('createdBy', 'userName firstName lastName');

            const total = await Appointment.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            return {
                appointments,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            logger.error(`Error finding all appointments: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมาย', 500);
        }
    }

    /**
     * ค้นหาการนัดหมายแบบ text search
     */
    async searchAppointments(
        searchTerm: string,
        clinicId?: string,
        branchId?: string,
        page = 1,
        limit = 10
    ): Promise<{ appointments: IAppointmentDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const filter: any = { isActive: true };

            if (clinicId) filter.clinicId = clinicId;
            if (branchId) filter.branchId = branchId;

            if (searchTerm) {
                // ค้นหาใน notes และ guest patient name
                filter.$or = [
                    { 'patient.name': { $regex: searchTerm, $options: 'i' } },
                    { notes: { $regex: searchTerm, $options: 'i' } }
                ];
            }

            const skip = (page - 1) * limit;
            const appointments = await Appointment.find(filter)
                .sort({ appointmentDate: -1, startTime: -1 })
                .skip(skip)
                .limit(limit)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstName lastName phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name');

            const total = await Appointment.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            return {
                appointments,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            logger.error(`Error searching appointments: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการค้นหาข้อมูลการนัดหมาย', 500);
        }
    }

    /**
     * ดึงข้อมูลการนัดหมายตามสาขา
     */
    async findByBranch(
        branchId: string,
        page = 1,
        limit = 10
    ): Promise<{ appointments: IAppointmentDocument[]; total: number; page: number; totalPages: number }> {
        try {
            return await this.findAll({ branchId, isActive: true }, { appointmentDate: 1, startTime: 1 }, page, limit);
        } catch (error) {
            logger.error(`Error finding appointments by branch: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมายตามสาขา', 500);
        }
    }

    /**
     * ดึงข้อมูลการนัดหมายตามคลินิก
     */
    async findByClinic(
        clinicId: string,
        page = 1,
        limit = 10
    ): Promise<{ appointments: IAppointmentDocument[]; total: number; page: number; totalPages: number }> {
        try {
            return await this.findAll({ clinicId, isActive: true }, { appointmentDate: 1, startTime: 1 }, page, limit);
        } catch (error) {
            logger.error(`Error finding appointments by clinic: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมายตามคลินิก', 500);
        }
    }

    /**
     * ดึงข้อมูลการนัดหมายตามแพทย์
     */
    async findByDoctor(
        doctorId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IAppointmentDocument[]> {
        try {
            const filter: any = { doctorId, isActive: true };

            if (startDate && endDate) {
                filter.appointmentDate = { $gte: startDate, $lte: endDate };
            } else if (startDate) {
                filter.appointmentDate = { $gte: startDate };
            } else if (endDate) {
                filter.appointmentDate = { $lte: endDate };
            }

            return await Appointment.find(filter)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstName lastName phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ appointmentDate: 1, startTime: 1 });
        } catch (error) {
            logger.error(`Error finding appointments by doctor: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมายตามแพทย์', 500);
        }
    }

    /**
     * ดึงข้อมูลการนัดหมายตามผู้ป่วย
     */
    async findByPatient(patientId: string): Promise<IAppointmentDocument[]> {
        try {
            return await Appointment.find({
                'patient.patientId': patientId,
                'patient.isRegistered': true,
                isActive: true
            })
                .populate('patient.patientId', 'hn firstName lastName titlePrefix phone email')
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ appointmentDate: -1 });
        } catch (error) {
            logger.error(`Error finding appointments by patient: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการนัดหมายตามผู้ป่วย', 500);
        }
    }

    /**
     * สร้างการนัดหมายใหม่
     */
    async createAppointment(appointmentData: CreateAppointmentInput, userId?: string): Promise<IAppointmentDocument> {
        try {
            // ตรวจสอบว่า branch มีอยู่จริงและดึง clinicId
            const branch = await Branch.findById(appointmentData.branchId);
            if (!branch) {
                throw new AppError('ไม่พบสาขาที่ระบุ', 400);
            }

            // ตรวจสอบว่าผู้ป่วยในระบบมีอยู่จริงหรือไม่
            if (appointmentData.patient.isRegistered) {
                const patient = await Patient.findById(appointmentData.patient.patientId);
                if (!patient) {
                    throw new AppError('ไม่พบผู้ป่วยในระบบ', 400);
                }
            }

            // ตรวจสอบการทับซ้อนของเวลา
            await this.checkTimeConflict(
                appointmentData.doctorId,
                new Date(appointmentData.appointmentDate),
                appointmentData.startTime,
                appointmentData.endTime
            );

            // สร้างการนัดหมายใหม่
            const newAppointment = await Appointment.create({
                ...appointmentData,
                clinicId: appointmentData.clinicId || branch.clinicId,
                createdBy: userId,
                status: appointmentData.status || AppointmentStatus.SCHEDULED,
                isActive: appointmentData.isActive !== undefined ? appointmentData.isActive : true,
            });

            // ดึงข้อมูลพร้อม populate
            const appointment = await this.findById(newAppointment._id.toString());
            return appointment!;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            logger.error(`Error creating appointment: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูลการนัดหมาย', 500);
        }
    }

    /**
     * อัปเดตข้อมูลการนัดหมาย
     */
    async updateAppointment(
        appointmentId: string,
        updateData: UpdateAppointmentInput,
        userId?: string
    ): Promise<IAppointmentDocument | null> {
        try {
            // ตรวจสอบว่ามีการนัดหมายนี้หรือไม่
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404);
            }

            // ตรวจสอบการทับซ้อนของเวลา (ถ้ามีการเปลี่ยนแปลงเวลาหรือแพทย์)
            const needTimeCheck = updateData.doctorId || updateData.appointmentDate ||
                updateData.startTime || updateData.endTime;

            if (needTimeCheck) {
                const doctorId = updateData.doctorId || appointment.doctorId.toString();
                const appointmentDate = updateData.appointmentDate ? new Date(updateData.appointmentDate) : appointment.appointmentDate;
                const startTime = updateData.startTime || appointment.startTime;
                const endTime = updateData.endTime || appointment.endTime;

                await this.checkTimeConflict(doctorId, appointmentDate, startTime, endTime, appointmentId);
            }

            // ตรวจสอบผู้ป่วยในระบบ (ถ้ามีการเปลี่ยนแปลง)
            if (updateData.patient?.isRegistered) {
                const patient = await Patient.findById(updateData.patient.patientId);
                if (!patient) {
                    throw new AppError('ไม่พบผู้ป่วยในระบบ', 400);
                }
            }

            // อัปเดตข้อมูล
            const updatedAppointment = await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    ...updateData,
                    updatedBy: userId,
                    updatedAt: new Date()
                },
                { new: true }
            );

            // ดึงข้อมูลใหม่พร้อม populate
            return await this.findById(updatedAppointment!._id.toString());
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            logger.error(`Error updating appointment: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตข้อมูลการนัดหมาย', 500);
        }
    }

    /**
     * เปลี่ยนสถานะการใช้งานการนัดหมาย (soft delete)
     */
    async updateAppointmentActiveStatus(appointmentId: string, isActive: boolean, userId?: string): Promise<IAppointmentDocument | null> {
        try {
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404);
            }

            const updatedAppointment = await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    $set: { isActive },
                    updatedBy: userId,
                    updatedAt: new Date()
                },
                { new: true }
            );

            return await this.findById(updatedAppointment!._id.toString());
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Error updating appointment active status: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะการนัดหมาย', 500);
        }
    }

    /**
     * ลบการนัดหมาย (hard delete - ใช้ระวัง)
     */
    async deleteAppointment(appointmentId: string): Promise<boolean> {
        try {
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new AppError('ไม่พบข้อมูลการนัดหมายนี้', 404);
            }

            await Appointment.findByIdAndDelete(appointmentId);
            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Error deleting appointment: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูลการนัดหมาย', 500);
        }
    }

    /**
     * ตรวจสอบความพร้อมของเวลา
     */
    async checkAvailability(
        doctorId: string,
        appointmentDate: Date,
        startTime: string,
        endTime: string,
        excludeAppointmentId?: string
    ): Promise<boolean> {
        try {
            await this.checkTimeConflict(doctorId, appointmentDate, startTime, endTime, excludeAppointmentId);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * อัปเดตสถานะการนัดหมายหลายรายการ
     */
    async bulkUpdateStatus(
        appointmentIds: string[],
        status: AppointmentStatus,
        userId?: string
    ): Promise<number> {
        try {
            const result = await Appointment.updateMany(
                { _id: { $in: appointmentIds }, isActive: true },
                {
                    status,
                    updatedBy: userId,
                    updatedAt: new Date()
                }
            );

            return result.modifiedCount;
        } catch (error) {
            logger.error(`Error bulk updating appointment status: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะการนัดหมายหลายรายการ', 500);
        }
    }

    /**
     * ดึงสถิติการนัดหมาย
     */
    async getAppointmentStats(clinicId?: string, branchId?: string, startDate?: Date, endDate?: Date): Promise<any> {
        try {
            const filter: any = { isActive: true };
            if (clinicId) filter.clinicId = clinicId;
            if (branchId) filter.branchId = branchId;
            if (startDate && endDate) {
                filter.appointmentDate = { $gte: startDate, $lte: endDate };
            }

            // วันนี้
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // เดือนนี้
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

            const [
                totalAppointments,
                todayAppointments,
                thisMonthAppointments,
                statusDistribution,
                typeDistribution
            ] = await Promise.all([
                Appointment.countDocuments(filter),
                Appointment.countDocuments({
                    ...filter,
                    appointmentDate: { $gte: today, $lt: tomorrow }
                }),
                Appointment.countDocuments({
                    ...filter,
                    appointmentDate: { $gte: startOfMonth, $lt: startOfNextMonth }
                }),
                Appointment.aggregate([
                    { $match: filter },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Appointment.aggregate([
                    { $match: filter },
                    { $group: { _id: '$type', count: { $sum: 1 } } }
                ])
            ]);

            // แปลงข้อมูลสถิติให้อยู่ในรูปแบบ object
            const statusStats: { [key: string]: number } = {};
            statusDistribution.forEach((item: any) => {
                statusStats[item._id] = item.count;
            });

            const typeStats: { [key: string]: number } = {};
            typeDistribution.forEach((item: any) => {
                typeStats[item._id] = item.count;
            });

            return {
                totalAppointments,
                todayAppointments,
                thisMonthAppointments,
                statusDistribution: statusStats,
                typeDistribution: typeStats,
            };
        } catch (error) {
            logger.error(`Error getting appointment stats: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติการนัดหมาย', 500);
        }
    }

    /**
     * ดึงการนัดหมายที่จะถึงกำหนด
     */
    async getUpcomingAppointments(doctorId?: string, hours: number = 24): Promise<IAppointmentDocument[]> {
        try {
            const now = new Date();
            const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));

            const filter: any = {
                isActive: true,
                status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
                appointmentDate: { $gte: now, $lte: futureTime }
            };

            if (doctorId) {
                filter.doctorId = doctorId;
            }

            return await Appointment.find(filter)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstNameTh lastNameTh phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ appointmentDate: 1, startTime: 1 });
        } catch (error) {
            logger.error(`Error getting upcoming appointments: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงการนัดหมายที่จะถึงกำหนด', 500);
        }
    }

    // แก้ไข service methods ให้ใช้ Appointment model ที่ import มาแล้ว

    /**
     * ดึงการนัดหมายสำหรับ Calendar Day View
     */
    async getCalendarDayView(
        date: Date,
        options: CalendarViewOptions = {}
    ): Promise<CalendarDayResponse> {
        try {
            // สร้าง date range สำหรับวันนั้น
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // สร้าง filter
            const filter: any = {
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                isActive: true
            };

            if (options.doctorId) filter.doctorId = options.doctorId;
            if (options.branchId) filter.branchId = options.branchId;
            if (options.clinicId) filter.clinicId = options.clinicId;
            if (options.status) filter.status = options.status;

            // ดึงข้อมูลการนัดหมาย
            const appointments = await Appointment.find(filter)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstNameTh lastNameTh phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ startTime: 1 });

            // สร้าง summary
            const summary = this.createAppointmentSummary(appointments);

            return {
                date: startOfDay.toISOString().split('T')[0],
                appointments,
                summary
            };
        } catch (error) {
            logger.error(`Error getting calendar day view: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทินรายวัน', 500);
        }
    }

    /**
     * ดึงการนัดหมายสำหรับ Calendar Week View
     */
    async getCalendarWeekView(
        date: Date,
        weekStartsOn: number = 1, // 1 = Monday, 0 = Sunday
        options: CalendarViewOptions = {}
    ): Promise<CalendarWeekResponse> {
        try {
            // คำนวณ start และ end ของสัปดาห์
            const { weekStart, weekEnd } = this.getWeekRange(date, weekStartsOn);

            // สร้าง filter
            const filter: any = {
                appointmentDate: { $gte: weekStart, $lte: weekEnd },
                isActive: true
            };

            if (options.doctorId) filter.doctorId = options.doctorId;
            if (options.branchId) filter.branchId = options.branchId;
            if (options.clinicId) filter.clinicId = options.clinicId;
            if (options.status) filter.status = options.status;

            // ดึงข้อมูลการนัดหมาย
            const appointments = await Appointment.find(filter)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstNameTh lastNameTh phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ appointmentDate: 1, startTime: 1 });

            // จัดกลุ่มการนัดหมายตามวัน
            const appointmentsByDate = this.groupAppointmentsByDate(appointments);

            // สร้างข้อมูลสำหรับทุกวันในสัปดาห์
            const days = [];
            const currentDate = new Date(weekStart);

            while (currentDate <= weekEnd) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayAppointments = appointmentsByDate[dateStr] || [];

                days.push({
                    date: dateStr,
                    dayOfWeek: currentDate.getDay(),
                    appointments: dayAppointments,
                    appointmentCount: dayAppointments.length
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // สร้าง summary
            const summary = {
                totalAppointments: appointments.length,
                byStatus: this.countByField(appointments, 'status'),
                byType: this.countByField(appointments, 'type'),
                byDay: days.reduce((acc, day) => {
                    acc[day.date] = day.appointmentCount;
                    return acc;
                }, {} as { [key: string]: number })
            };

            return {
                weekStart: weekStart.toISOString().split('T')[0],
                weekEnd: weekEnd.toISOString().split('T')[0],
                days,
                summary
            };
        } catch (error) {
            logger.error(`Error getting calendar week view: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทินรายสัปดาห์', 500);
        }
    }

    /**
     * ดึงการนัดหมายสำหรับ Calendar Month View
     */
    async getCalendarMonthView(
        year: number,
        month: number,
        includeAdjacentDays: boolean = false,
        options: CalendarViewOptions = {}
    ): Promise<CalendarMonthResponse> {
        try {
            // คำนวณ range ของเดือน
            const { monthStart, monthEnd, calendarStart, calendarEnd } =
                this.getMonthRange(year, month, includeAdjacentDays);

            // สร้าง filter
            const filter: any = {
                appointmentDate: {
                    $gte: includeAdjacentDays ? calendarStart : monthStart,
                    $lte: includeAdjacentDays ? calendarEnd : monthEnd
                },
                isActive: true
            };

            if (options.doctorId) filter.doctorId = options.doctorId;
            if (options.branchId) filter.branchId = options.branchId;
            if (options.clinicId) filter.clinicId = options.clinicId;
            if (options.status) filter.status = options.status;

            // ดึงข้อมูลการนัดหมาย
            const appointments = await Appointment.find(filter)
                .populate('doctorId', 'name surname specialty firstNameTh lastNameTh')
                .populate('patient.patientId', 'hn titlePrefix firstNameTh lastNameTh phone email')
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .sort({ appointmentDate: 1, startTime: 1 });

            // จัดกลุ่มการนัดหมายตามวัน
            const appointmentsByDate = this.groupAppointmentsByDate(appointments);

            // สร้าง calendar grid (weeks และ days)
            const weeks = this.buildCalendarGrid(year, month, appointmentsByDate, includeAdjacentDays);

            // สร้าง summary
            const monthAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.appointmentDate);
                return aptDate >= monthStart && aptDate <= monthEnd;
            });

            const summary = {
                totalAppointments: monthAppointments.length,
                byStatus: this.countByField(monthAppointments, 'status'),
                byType: this.countByField(monthAppointments, 'type'),
                byWeek: weeks.reduce(
                    (acc: { [key: string]: number }, week: CalendarWeek, index: number) => {
                        const weekTotal = week.days.reduce(
                            (sum: number, day: CalendarDay) => sum + day.appointmentCount,
                            0
                        );
                        acc[`week_${index + 1}`] = weekTotal;
                        return acc;
                    },
                    {} as { [key: string]: number }
                )
            };

            return {
                year,
                month,
                monthName: new Date(year, month - 1).toLocaleDateString('th-TH', { month: 'long' }),
                weeks,
                summary
            };
        } catch (error) {
            logger.error(`Error getting calendar month view: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทินรายเดือน', 500);
        }
    }


    /**
     * Private Methods
     */

    /**
     * ตรวจสอบการทับซ้อนของเวลา
     */
    private async checkTimeConflict(
        doctorId: string,
        appointmentDate: Date,
        startTime: string,
        endTime: string,
        excludeId?: string
    ): Promise<void> {
        try {
            const conflicts = await this.findConflicts(doctorId, appointmentDate, startTime, endTime, excludeId);

            if (conflicts.length > 0) {
                throw new AppError('มีการนัดหมายในช่วงเวลาดังกล่าวแล้ว', 409);
            }
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Error checking time conflict: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบการทับซ้อนของเวลา', 500);
        }
    }

    /**
     * ค้นหาการนัดหมายที่ทับซ้อน
     */
    private async findConflicts(
        doctorId: string,
        appointmentDate: Date,
        startTime: string,
        endTime: string,
        excludeId?: string
    ): Promise<IAppointmentDocument[]> {
        const query: any = {
            doctorId,
            appointmentDate,
            isActive: true,
            status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }
        };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const appointments = await Appointment.find(query);
        const newStart = combineDateTime(appointmentDate, startTime);
        const newEnd = combineDateTime(appointmentDate, endTime);

        return appointments.filter(appointment => {
            const existingStart = combineDateTime(appointment.appointmentDate, appointment.startTime);
            const existingEnd = combineDateTime(appointment.appointmentDate, appointment.endTime);

            return newStart < existingEnd && newEnd > existingStart;
        });
    }

    /**
     * Helper Methods (แก้ไขแล้ว)
     */

    private buildCalendarGrid(
        year: number,
        month: number,
        appointmentsByDate: { [key: string]: IAppointmentDocument[] },
        includeAdjacentDays: boolean
    ): CalendarWeek[] {
        const weeks: CalendarWeek[] = [];
        const { monthStart, calendarStart } = this.getMonthRange(year, month, includeAdjacentDays);

        const currentDate = new Date(includeAdjacentDays ? calendarStart : monthStart);

        while (currentDate.getMonth() === month - 1 ||
            (includeAdjacentDays && weeks.length < 6)) {

            const week: CalendarWeek = {
                weekNumber: weeks.length + 1,
                days: []
            };

            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const dayAppointments = appointmentsByDate[dateStr] || [];
                const isCurrentMonth = currentDate.getMonth() === month - 1;

                const day: CalendarDay = {
                    date: dateStr,
                    dayOfMonth: currentDate.getDate(),
                    isCurrentMonth,
                    appointments: dayAppointments,
                    appointmentCount: dayAppointments.length
                };

                week.days.push(day);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            weeks.push(week);

            // หยุดถ้าไม่ include adjacent days และออกจากเดือนแล้ว
            if (!includeAdjacentDays && currentDate.getMonth() !== month - 1) {
                break;
            }

            // หยุดที่ 6 สัปดาห์สำหรับ adjacent days
            if (includeAdjacentDays && weeks.length >= 6) {
                break;
            }
        }

        return weeks;
    }


    private getWeekRange(date: Date, weekStartsOn: number): { weekStart: Date; weekEnd: Date } {
        const weekStart = new Date(date);
        const dayOfWeek = weekStart.getDay();
        const diff = (dayOfWeek + 7 - weekStartsOn) % 7;

        weekStart.setDate(weekStart.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return { weekStart, weekEnd };
    }

    private getMonthRange(year: number, month: number, includeAdjacentDays: boolean): {
        monthStart: Date;
        monthEnd: Date;
        calendarStart: Date;
        calendarEnd: Date;
    } {
        const monthStart = new Date(year, month - 1, 1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(year, month, 0);
        monthEnd.setHours(23, 59, 59, 999);

        let calendarStart = monthStart;
        let calendarEnd = monthEnd;

        if (includeAdjacentDays) {
            // เริ่มจากวันจันทร์ของสัปดาห์แรก
            calendarStart = new Date(monthStart);
            const startDayOfWeek = monthStart.getDay();
            const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
            calendarStart.setDate(calendarStart.getDate() - daysToSubtract);
            calendarStart.setHours(0, 0, 0, 0);

            // สิ้นสุดที่วันอาทิตย์ของสัปดาห์สุดท้าย
            calendarEnd = new Date(monthEnd);
            const endDayOfWeek = monthEnd.getDay();
            const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
            calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
            calendarEnd.setHours(23, 59, 59, 999);
        }

        return { monthStart, monthEnd, calendarStart, calendarEnd };
    }

    private groupAppointmentsByDate(appointments: IAppointmentDocument[]): { [key: string]: IAppointmentDocument[] } {
        return appointments.reduce(
            (acc: { [key: string]: IAppointmentDocument[] }, appointment: IAppointmentDocument) => {
                const dateStr = appointment.appointmentDate.toISOString().split('T')[0];
                if (!acc[dateStr]) {
                    acc[dateStr] = [];
                }
                acc[dateStr].push(appointment);
                return acc;
            },
            {} as { [key: string]: IAppointmentDocument[] }
        );
    }

    private createAppointmentSummary(appointments: IAppointmentDocument[]): {
        total: number;
        byStatus: { [key: string]: number };
        byType: { [key: string]: number };
    } {
        return {
            total: appointments.length,
            byStatus: this.countByField(appointments, 'status'),
            byType: this.countByField(appointments, 'type')
        };
    }

    private countByField(appointments: IAppointmentDocument[], field: string): { [key: string]: number } {
        return appointments.reduce(
            (acc: { [key: string]: number }, appointment: IAppointmentDocument) => {
                const value = (appointment as any)[field] || 'unknown';
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            },
            {} as { [key: string]: number }
        );
    }

}

export default AppointmentService;