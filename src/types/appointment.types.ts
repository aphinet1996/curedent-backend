// import { Document, Types } from 'mongoose';
// import { getObjectIdString } from '../utils/mogoose.utils';

// /**
//  * สถานะการนัดหมาย
//  */
// export enum AppointmentStatus {
//     SCHEDULED = 'scheduled',     // นัดหมายแล้ว
//     CONFIRMED = 'confirmed',     // ยืนยันแล้ว
//     IN_PROGRESS = 'in_progress', // กำลังดำเนินการ
//     COMPLETED = 'completed',     // เสร็จสิ้น
//     CANCELLED = 'cancelled',     // ยกเลิก
//     NO_SHOW = 'no_show',        // ไม่มาตามนัด
//     RESCHEDULED = 'rescheduled'  // เลื่อนนัด
// }

// /**
//  * ประเภทการนัดหมาย
//  */
// export enum AppointmentType {
//     CONSULTATION = 'consultation',   // ปรึกษา
//     CHECKUP = 'checkup',            // ตรวจร่างกาย
//     FOLLOW_UP = 'follow_up',        // ติดตามผล
//     TREATMENT = 'treatment',        // รักษา
//     OTHER = 'other'                 // อื่นๆ
// }

// /**
//  * Interface สำหรับข้อมูลผู้ป่วยที่ไม่มีในระบบ
//  */
// export interface IGuestPatientInfo {
//     name: string;           // ชื่อ-นามสกุล
//     phone: string;          // เบอร์โทรศัพท์
//     email?: string;         // อีเมล (optional)
// }

// /**
//  * Interface สำหรับข้อมูลผู้ป่วยในระบบ
//  */
// export interface IRegisteredPatientInfo {
//     patientId: Types.ObjectId | string;  // ID ของผู้ป่วยในระบบ
// }

// /**
//  * Discriminated Union สำหรับข้อมูลผู้ป่วย
//  */
// export type PatientInfo =
//     | ({ isRegistered: true } & IRegisteredPatientInfo)
//     | ({ isRegistered: false } & IGuestPatientInfo);

// /**
//  * Interface สำหรับ Google Calendar integration
//  */
// export interface IGoogleCalendarInfo {
//     eventId?: string;           // Google Calendar Event ID
//     calendarId?: string;        // Google Calendar ID
//     syncStatus?: 'pending' | 'synced' | 'failed';
//     lastSyncAt?: Date;
//     syncError?: string;
// }

// /**
//  * Interface สำหรับ tag
//  */
// export interface IAppointmentTag {
//     name: string;
//     color?: string;             // สีของ tag
//     description?: string;       // คำอธิบาย tag
// }

// /**
//  * Appointment attributes interface
//  */
// export interface IAppointmentAttributes {

//     title: string;
//     patient: PatientInfo;

//     // ข้อมูลการนัดหมาย
//     appointmentDate: Date;                // วันที่นัดหมาย
//     startTime: string;                    // เวลาเริ่มต้น (HH:mm format)
//     endTime: string;                      // เวลาสิ้นสุด (HH:mm format)
//     duration: number;                     // ระยะเวลา (นาที)

//     // ประเภทและสถานะ
//     type?: AppointmentType;                // ประเภทการนัดหมาย
//     status: AppointmentStatus;            // สถานะ

//     // ข้อมูลเพิ่มเติม
//     tags: IAppointmentTag[];              // แท็ก
//     notes?: string;                       // หมายเหตุ

//     // Google Calendar Integration
//     googleCalendar?: IGoogleCalendarInfo;

//     createdBy?: Types.ObjectId | string;  // ผู้สร้างการนัดหมาย
//     createdAt: Date;
//     updatedBy?: Types.ObjectId | string;  // ผู้แก้ไขล่าสุด
//     updatedAt: Date;
//     clinicId: Types.ObjectId | string;    // คลินิก
//     branchId: Types.ObjectId | string;    // สาขา
//     doctorId: Types.ObjectId | string;    // แพทย์
//     isActive: boolean;
// }

// /**
//  * Interface หลักสำหรับ Appointment
//  */
// export interface IAppointment extends IAppointmentAttributes {
//     _id: string | Types.ObjectId;
// }

// /**
//  * Interface สำหรับ Appointment เมื่อเก็บใน MongoDB
//  */
// export interface IAppointmentDocument extends Document, IAppointmentAttributes {
//     _id: Types.ObjectId;

//     // Virtual properties
//     appointmentDateTime: Date;    // รวม date + start time
//     isToday: boolean;            // เป็นวันนี้หรือไม่
//     isPast: boolean;             // ผ่านมาแล้วหรือไม่
//     isFuture: boolean;           // อนาคตหรือไม่

//     // Helper methods
//     getPatientName(): string;
//     getPatientPhone(): string;
//     getPatientEmail(): string | undefined;
//     calculateDuration(): number;
//     isConflictWith(other: IAppointmentDocument): boolean;
// }

// /**
//  * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Appointment ใหม่
//  */
// export interface CreateAppointmentInput {
//     // ข้อมูลผู้ป่วย
//     title: string;
//     patient: PatientInfo;

//     // ข้อมูลการนัดหมาย
//     appointmentDate: Date | string;
//     startTime: string;
//     endTime: string;

//     // ประเภทและสถานะ
//     type?: AppointmentType;
//     status?: AppointmentStatus;

//     // ข้อมูลเพิ่มเติม
//     tags?: IAppointmentTag[];
//     notes?: string;

//     // Google Calendar
//     syncWithGoogleCalendar?: boolean;

//     clinicId?: string;  // Optional, จะใช้จาก user ถ้าไม่ระบุ
//     branchId: string;
//     doctorId: string;
//     isActive?: boolean;
// }

// /**
//  * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Appointment
//  */
// export interface UpdateAppointmentInput {
//     // ข้อมูลผู้ป่วย (สามารถเปลี่ยนได้)
//     title?: string;
//     patient?: PatientInfo;

//     // ข้อมูลการนัดหมาย
//     appointmentDate?: Date | string;
//     startTime?: string;
//     endTime?: string;

//     // ประเภทและสถานะ
//     type?: AppointmentType;
//     status?: AppointmentStatus;

//     // ข้อมูลเพิ่มเติม
//     tags?: IAppointmentTag[];
//     notes?: string;

//     // Google Calendar
//     googleCalendar?: Partial<IGoogleCalendarInfo>;
//     doctorId?: string;
//     branchId?: string;

//     isActive?: boolean;
// }

// /**
//  * Interface สำหรับ Appointment response
//  */
// export interface AppointmentResponse {
//     id: string;
//     title: string;
//     // ข้อมูลผู้ป่วย
//     patient: {
//         isRegistered: boolean;
//         id?: string;          // มีถ้าเป็นผู้ป่วยในระบบ
//         hn?: string;          // มีถ้าเป็นผู้ป่วยในระบบ
//         name: string;
//         phone: string;
//         email?: string;
//     };

//     // ข้อมูลการนัดหมาย
//     appointmentDate: Date;
//     startTime: string;
//     endTime: string;
//     duration: number;
//     appointmentDateTime: Date;

//     // ประเภทและสถานะ
//     type?: AppointmentType;
//     status: AppointmentStatus;

//     // ข้อมูลเพิ่มเติม
//     tags: IAppointmentTag[];
//     notes?: string;

//     // สถานะเวลา
//     isToday: boolean;
//     isPast: boolean;
//     isFuture: boolean;

//     // Google Calendar
//     googleCalendar?: {
//         eventId?: string;
//         syncStatus?: string;
//         lastSyncAt?: Date;
//     };

//     clinic: {
//         id: string;
//         name: string;
//     };
//     branch: {
//         id: string;
//         name: string;
//     };
//     doctor: {
//         id: string;
//         name: string;
//         specialty: string;
//     };
//     createdBy?: {
//         id: string;
//         name: string;
//     };
//     isActive: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }

// /**
//  * Helper functions
//  */
// export function calculateDuration(startTime: string, endTime: string): number {
//     const start = parseTime(startTime);
//     const end = parseTime(endTime);
//     return Math.max(0, end - start);
// }

// export function combineDateTime(date: Date, time: string): Date {
//     const dateTime = new Date(date);
//     const timeMinutes = parseTime(time);
//     dateTime.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0);
//     return dateTime;
// }

// export function formatDateTime(date: Date, time: string): string {
//     const dateStr = date.toLocaleDateString('th-TH');
//     return `${dateStr} ${time}`;
// }

// export function isToday(date: Date): boolean {
//     const today = new Date();
//     const targetDate = new Date(date);
//     return targetDate.toDateString() === today.toDateString();
// }

// /**
//  * Function สำหรับแปลง IAppointment เป็น AppointmentResponse
//  */
// export function toAppointmentResponse(appointment: IAppointment | IAppointmentDocument): AppointmentResponse {
//     const id = getObjectIdString(appointment._id);

//     // Handle clinic info
//     const clinic = {
//         id: getObjectIdString(appointment.clinicId),
//         name: getPopulatedName(appointment.clinicId, 'ไม่ระบุคลินิก')
//     };

//     // Handle branch info
//     const branch = {
//         // id: typeof appointment.branchId === 'string' ? appointment.branchId : appointment.branchId.toString(),
//         id: getObjectIdString(appointment.branchId),
//         name: getPopulatedName(appointment.branchId, 'ไม่ระบุสาขา')
//     };

//     // Handle doctor info
//     const doctor = {
//         // id: typeof appointment.doctorId === 'string' ? appointment.doctorId : appointment.doctorId.toString(),
//         id: getObjectIdString(appointment.doctorId),
//         name: getPopulatedDoctorName(appointment.doctorId),
//         specialty: getPopulatedDoctorSpecialty(appointment.doctorId)
//     };

//     // Handle patient info
//     const patient = {
//         isRegistered: appointment.patient.isRegistered,
//         ...(appointment.patient.isRegistered ? {
//             // id: typeof appointment.patient.patientId === 'string'
//             //     ? appointment.patient.patientId
//             //     : appointment.patient.patientId.toString(),
//             id: getObjectIdString(appointment.patient.patientId),
//             hn: getPopulatedPatientHN(appointment.patient.patientId),
//             name: getPopulatedPatientName(appointment.patient.patientId),
//             phone: getPopulatedPatientPhone(appointment.patient.patientId),
//             email: getPopulatedPatientEmail(appointment.patient.patientId)
//         } : {
//             name: appointment.patient.name,
//             phone: appointment.patient.phone,
//             email: appointment.patient.email
//         })
//     };

//     // Calculate virtual properties
//     const duration = appointment.duration || calculateDuration(appointment.startTime, appointment.endTime);
//     const appointmentDateTime = combineDateTime(appointment.appointmentDate, appointment.startTime);
//     const today = new Date();
//     const appointmentDateOnly = new Date(appointment.appointmentDate);

//     const isAppointmentToday = appointmentDateOnly.toDateString() === today.toDateString();
//     const isPast = appointmentDateTime < today;
//     const isFuture = appointmentDateTime > today;

//     return {
//         id,
//         title: appointment.title,
//         clinic,
//         branch,
//         doctor,
//         patient,
//         appointmentDate: appointment.appointmentDate,
//         startTime: appointment.startTime,
//         endTime: appointment.endTime,
//         duration,
//         appointmentDateTime,
//         type: appointment.type,
//         status: appointment.status,
//         tags: appointment.tags || [],
//         notes: appointment.notes,
//         isToday: isAppointmentToday,
//         isPast,
//         isFuture,
//         googleCalendar: appointment.googleCalendar ? {
//             eventId: appointment.googleCalendar.eventId,
//             syncStatus: appointment.googleCalendar.syncStatus,
//             lastSyncAt: appointment.googleCalendar.lastSyncAt
//         } : undefined,
//         isActive: appointment.isActive,
//         createdAt: appointment.createdAt,
//         updatedAt: appointment.updatedAt,
//         createdBy: appointment.createdBy ? {
//             // id: typeof appointment.createdBy === 'string' ? appointment.createdBy : appointment.createdBy.toString(),
//             id: getObjectIdString(appointment.createdBy),
//             name: getPopulatedUserName(appointment.createdBy)
//         } : undefined
//     };
// }

// /**
//  * Helper functions for populated data
//  */
// function parseTime(time: string): number {
//     const [hours, minutes] = time.split(':').map(Number);
//     return hours * 60 + minutes;
// }

// function getPopulatedName(ref: any, defaultName: string): string {
//     if (typeof ref === 'string') return defaultName;
//     if (ref && typeof ref === 'object' && ref.name) return ref.name;
//     return defaultName;
// }

// function getPopulatedDoctorName(doctorRef: any): string {
//     if (typeof doctorRef === 'string') return 'ไม่ระบุแพทย์';
//     if (doctorRef && typeof doctorRef === 'object') {
//         if (doctorRef.fullName) return doctorRef.fullName;
//         if (doctorRef.name && doctorRef.surname) return `${doctorRef.name} ${doctorRef.surname}`;
//         if (doctorRef.firstNameTh && doctorRef.lastNameTh) return `${doctorRef.firstNameTh} ${doctorRef.lastNameTh}`;
//     }
//     return 'ไม่ระบุแพทย์';
// }

// function getPopulatedDoctorSpecialty(doctorRef: any): string {
//     if (typeof doctorRef === 'string') return '';
//     if (doctorRef && typeof doctorRef === 'object' && doctorRef.specialty) return doctorRef.specialty;
//     return '';
// }

// function getPopulatedPatientName(patientRef: any): string {
//     if (typeof patientRef === 'string') return 'ไม่ระบุผู้ป่วย';
//     if (patientRef && typeof patientRef === 'object') {
//         if (patientRef.fullNameTh) return patientRef.fullNameTh;
//         if (patientRef.firstNameTh && patientRef.lastNameTh) {
//             return `${patientRef.titlePrefix || ''}${patientRef.firstNameTh} ${patientRef.lastNameTh}`;
//         }
//     }
//     return 'ไม่ระบุผู้ป่วย';
// }

// function getPopulatedPatientHN(patientRef: any): string {
//     if (typeof patientRef === 'string') return '';
//     if (patientRef && typeof patientRef === 'object' && patientRef.hn) return patientRef.hn;
//     return '';
// }

// function getPopulatedPatientPhone(patientRef: any): string {
//     if (typeof patientRef === 'string') return '';
//     if (patientRef && typeof patientRef === 'object' && patientRef.phone) return patientRef.phone;
//     return '';
// }

// function getPopulatedPatientEmail(patientRef: any): string | undefined {
//     if (typeof patientRef === 'string') return undefined;
//     if (patientRef && typeof patientRef === 'object' && patientRef.email) return patientRef.email;
//     return undefined;
// }

// function getPopulatedUserName(userRef: any): string {
//     if (typeof userRef === 'string') return 'ไม่ระบุผู้ใช้';
//     if (userRef && typeof userRef === 'object') {
//         if (userRef.fullName) return userRef.fullName;
//         if (userRef.userName) return userRef.userName;
//         if (userRef.firstName && userRef.lastName) return `${userRef.firstName} ${userRef.lastName}`;
//     }
//     return 'ไม่ระบุผู้ใช้';
// }

import { Document, Types } from 'mongoose';
import { 
  getObjectIdString,
  getPopulatedClinicInfo,
  getPopulatedBranchInfo,
  getPopulatedDoctorInfo,
  getPopulatedPatientName,
  getPopulatedPatientHN,
  getPopulatedPatientPhone,
  getPopulatedPatientEmail,
  getPopulatedUserInfo
} from '../utils/mongoose.utils';

/**
 * สถานะการนัดหมาย
 */
export enum AppointmentStatus {
    SCHEDULED = 'scheduled',     // นัดหมายแล้ว
    CONFIRMED = 'confirmed',     // ยืนยันแล้ว
    IN_PROGRESS = 'in_progress', // กำลังดำเนินการ
    COMPLETED = 'completed',     // เสร็จสิ้น
    CANCELLED = 'cancelled',     // ยกเลิก
    NO_SHOW = 'no_show',        // ไม่มาตามนัด
    RESCHEDULED = 'rescheduled'  // เลื่อนนัด
}

/**
 * ประเภทการนัดหมาย
 */
export enum AppointmentType {
    CONSULTATION = 'consultation',   // ปรึกษา
    CHECKUP = 'checkup',            // ตรวจร่างกาย
    FOLLOW_UP = 'follow_up',        // ติดตามผล
    TREATMENT = 'treatment',        // รักษา
    OTHER = 'other'                 // อื่นๆ
}

/**
 * Interface สำหรับข้อมูลผู้ป่วยที่ไม่มีในระบบ
 */
export interface IGuestPatientInfo {
    name: string;           // ชื่อ-นามสกุล
    phone: string;          // เบอร์โทรศัพท์
    email?: string;         // อีเมล (optional)
}

/**
 * Interface สำหรับข้อมูลผู้ป่วยในระบบ
 */
export interface IRegisteredPatientInfo {
    patientId: Types.ObjectId | string;  // ID ของผู้ป่วยในระบบ
}

/**
 * Discriminated Union สำหรับข้อมูลผู้ป่วย
 */
export type PatientInfo =
    | ({ isRegistered: true } & IRegisteredPatientInfo)
    | ({ isRegistered: false } & IGuestPatientInfo);

/**
 * Interface สำหรับ Google Calendar integration
 */
export interface IGoogleCalendarInfo {
    eventId?: string;           // Google Calendar Event ID
    calendarId?: string;        // Google Calendar ID
    syncStatus?: 'pending' | 'synced' | 'failed';
    lastSyncAt?: Date;
    syncError?: string;
}

/**
 * Interface สำหรับ tag
 */
export interface IAppointmentTag {
    name: string;
    color?: string;             // สีของ tag
    description?: string;       // คำอธิบาย tag
}

/**
 * Appointment attributes interface
 */
export interface IAppointmentAttributes {

    title: string;
    patient: PatientInfo;

    // ข้อมูลการนัดหมาย
    appointmentDate: Date;                // วันที่นัดหมาย
    startTime: string;                    // เวลาเริ่มต้น (HH:mm format)
    endTime: string;                      // เวลาสิ้นสุด (HH:mm format)
    duration: number;                     // ระยะเวลา (นาที)

    // ประเภทและสถานะ
    type?: AppointmentType;                // ประเภทการนัดหมาย
    status: AppointmentStatus;            // สถานะ

    // ข้อมูลเพิ่มเติม
    tags: IAppointmentTag[];              // แท็ก
    notes?: string;                       // หมายเหตุ

    // Google Calendar Integration
    googleCalendar?: IGoogleCalendarInfo;

    createdBy?: Types.ObjectId | string;  // ผู้สร้างการนัดหมาย
    createdAt: Date;
    updatedBy?: Types.ObjectId | string;  // ผู้แก้ไขล่าสุด
    updatedAt: Date;
    clinicId: Types.ObjectId | string;    // คลินิก
    branchId: Types.ObjectId | string;    // สาขา
    doctorId: Types.ObjectId | string;    // แพทย์
    isActive: boolean;
}

/**
 * Interface หลักสำหรับ Appointment
 */
export interface IAppointment extends IAppointmentAttributes {
    _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Appointment เมื่อเก็บใน MongoDB
 */
export interface IAppointmentDocument extends Document, IAppointmentAttributes {
    _id: Types.ObjectId;

    // Virtual properties
    appointmentDateTime: Date;    // รวม date + start time
    isToday: boolean;            // เป็นวันนี้หรือไม่
    isPast: boolean;             // ผ่านมาแล้วหรือไม่
    isFuture: boolean;           // อนาคตหรือไม่

    // Helper methods
    getPatientName(): string;
    getPatientPhone(): string;
    getPatientEmail(): string | undefined;
    calculateDuration(): number;
    isConflictWith(other: IAppointmentDocument): boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Appointment ใหม่
 */
export interface CreateAppointmentInput {
    // ข้อมูลผู้ป่วย
    title: string;
    patient: PatientInfo;

    // ข้อมูลการนัดหมาย
    appointmentDate: Date | string;
    startTime: string;
    endTime: string;

    // ประเภทและสถานะ
    type?: AppointmentType;
    status?: AppointmentStatus;

    // ข้อมูลเพิ่มเติม
    tags?: IAppointmentTag[];
    notes?: string;

    // Google Calendar
    syncWithGoogleCalendar?: boolean;

    clinicId?: string;  // Optional, จะใช้จาก user ถ้าไม่ระบุ
    branchId: string;
    doctorId: string;
    isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Appointment
 */
export interface UpdateAppointmentInput {
    // ข้อมูลผู้ป่วย (สามารถเปลี่ยนได้)
    title?: string;
    patient?: PatientInfo;

    // ข้อมูลการนัดหมาย
    appointmentDate?: Date | string;
    startTime?: string;
    endTime?: string;

    // ประเภทและสถานะ
    type?: AppointmentType;
    status?: AppointmentStatus;

    // ข้อมูลเพิ่มเติม
    tags?: IAppointmentTag[];
    notes?: string;

    // Google Calendar
    googleCalendar?: Partial<IGoogleCalendarInfo>;
    doctorId?: string;
    branchId?: string;

    isActive?: boolean;
}

/**
 * Interface สำหรับ Appointment response
 */
export interface AppointmentResponse {
    id: string;
    title: string;
    // ข้อมูลผู้ป่วย
    patient: {
        isRegistered: boolean;
        id?: string;          // มีถ้าเป็นผู้ป่วยในระบบ
        hn?: string;          // มีถ้าเป็นผู้ป่วยในระบบ
        name: string;
        phone: string;
        email?: string;
    };

    // ข้อมูลการนัดหมาย
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    duration: number;
    appointmentDateTime: Date;

    // ประเภทและสถานะ
    type?: AppointmentType;
    status: AppointmentStatus;

    // ข้อมูลเพิ่มเติม
    tags: IAppointmentTag[];
    notes?: string;

    // สถานะเวลา
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;

    // Google Calendar
    googleCalendar?: {
        eventId?: string;
        syncStatus?: string;
        lastSyncAt?: Date;
    };

    clinic: {
        id: string;
        name: string;
    };
    branch: {
        id: string;
        name: string;
    };
    doctor: {
        id: string;
        name: string;
        specialty: string;
    };
    createdBy?: {
        id: string;
        name: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Helper functions
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return Math.max(0, end - start);
}

export function combineDateTime(date: Date, time: string): Date {
    const dateTime = new Date(date);
    const timeMinutes = parseTime(time);
    dateTime.setHours(Math.floor(timeMinutes / 60), timeMinutes % 60, 0, 0);
    return dateTime;
}

export function formatDateTime(date: Date, time: string): string {
    const dateStr = date.toLocaleDateString('th-TH');
    return `${dateStr} ${time}`;
}

export function isToday(date: Date): boolean {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate.toDateString() === today.toDateString();
}

/**
 * Function สำหรับแปลง IAppointment เป็น AppointmentResponse
 */
export function toAppointmentResponse(appointment: IAppointment | IAppointmentDocument): AppointmentResponse {
    const id = getObjectIdString(appointment._id);

    // Handle clinic info using utility function
    const clinic = getPopulatedClinicInfo(appointment.clinicId);

    // Handle branch info using utility function
    const branch = getPopulatedBranchInfo(appointment.branchId);

    // Handle doctor info using utility function
    const doctor = getPopulatedDoctorInfo(appointment.doctorId);

    // Handle patient info
    const patient = {
        isRegistered: appointment.patient.isRegistered,
        ...(appointment.patient.isRegistered ? {
            id: getObjectIdString(appointment.patient.patientId),
            hn: getPopulatedPatientHN(appointment.patient.patientId),
            name: getPopulatedPatientName(appointment.patient.patientId),
            phone: getPopulatedPatientPhone(appointment.patient.patientId),
            email: getPopulatedPatientEmail(appointment.patient.patientId)
        } : {
            name: appointment.patient.name,
            phone: appointment.patient.phone,
            email: appointment.patient.email
        })
    };

    // Calculate virtual properties
    const duration = appointment.duration || calculateDuration(appointment.startTime, appointment.endTime);
    const appointmentDateTime = combineDateTime(appointment.appointmentDate, appointment.startTime);
    const today = new Date();
    const appointmentDateOnly = new Date(appointment.appointmentDate);

    const isAppointmentToday = appointmentDateOnly.toDateString() === today.toDateString();
    const isPast = appointmentDateTime < today;
    const isFuture = appointmentDateTime > today;

    // Handle createdBy using utility function
    const createdBy = getPopulatedUserInfo(appointment.createdBy);

    return {
        id,
        title: appointment.title,
        clinic,
        branch,
        doctor,
        patient,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration,
        appointmentDateTime,
        type: appointment.type,
        status: appointment.status,
        tags: appointment.tags || [],
        notes: appointment.notes,
        isToday: isAppointmentToday,
        isPast,
        isFuture,
        googleCalendar: appointment.googleCalendar ? {
            eventId: appointment.googleCalendar.eventId,
            syncStatus: appointment.googleCalendar.syncStatus,
            lastSyncAt: appointment.googleCalendar.lastSyncAt
        } : undefined,
        isActive: appointment.isActive,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        createdBy
    };
}

/**
 * Helper function สำหรับแปลงเวลาเป็นนาที
 */
function parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}