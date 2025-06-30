import { Document, Types } from 'mongoose';

/**
 * ด้านของฟัน/ปาก
 */
export enum OpdSide {
    RIGHT = 'right',
    LEFT = 'left',
    UPPER = 'upper',
    LOWER = 'lower',
    UPPER_RIGHT = 'upper_right',
    UPPER_LEFT = 'upper_left',
    LOWER_RIGHT = 'lower_right',
    LOWER_LEFT = 'lower_left',
    BILATERAL = 'bilateral',
    FULL_MOUTH = 'full_mouth'
}

/**
 * หน้าฟัน (Tooth Surface)
 */
export enum ToothSurface {
    MESIAL = 'M',        // หน้าใกล้กลาง
    DISTAL = 'D',        // หน้าไกลกลาง
    OCCLUSAL = 'O',      // หน้าบด/หน้าตัด
    BUCCAL = 'B',        // หน้าแก้ม
    LINGUAL = 'L',       // หน้าลิ้น
    INCISAL = 'I',       // หน้าตัด (ฟันหน้า)
    FACIAL = 'F',        // หน้าหน้า
    PALATAL = 'P'        // หน้าเพดาน
}

/**
 * สภาพฟัน/การรักษา
 */
export enum ToothCondition {
    HEALTHY = 'healthy',
    CARIES = 'caries',
    FILLED = 'filled',
    CROWN = 'crown',
    BRIDGE = 'bridge',
    IMPLANT = 'implant',
    EXTRACTED = 'extracted',
    MISSING = 'missing',
    IMPACTED = 'impacted',
    ROOT_CANAL = 'root_canal',
    FRACTURED = 'fractured'
}

/**
 * ประเภทการรักษา
 */
export enum TreatmentType {
    EXAMINATION = 'examination',
    CLEANING = 'cleaning',
    FILLING = 'filling',
    EXTRACTION = 'extraction',
    ROOT_CANAL = 'root_canal',
    CROWN = 'crown',
    BRIDGE = 'bridge',
    IMPLANT = 'implant',
    SCALING = 'scaling',
    WHITENING = 'whitening',
    ORTHODONTICS = 'orthodontics',
    SURGERY = 'surgery'
}

/**
 * Interface สำหรับข้อมูลฟัน
 */
export interface IToothData {
    toothNumber: string;              // หมายเลขซี่ฟัน (FDI: 11-18, 21-28, 31-38, 41-48)
    surfaces: ToothSurface[];         // หน้าฟันที่เกี่ยวข้อง
    condition: ToothCondition;        // สภาพฟัน
    treatment?: TreatmentType;        // การรักษาที่ทำ
    notes?: string;                   // หมายเหตุเพิ่มเติม
}

/**
 * Interface สำหรับการวินิจฉัย
 */
export interface IDiagnosis {
    code?: string;                    // รหัสการวินิจฉัย (ICD-10)
    name: string;                     // ชื่อการวินิจฉัย
    description?: string;             // รายละเอียด
}

/**
 * Interface สำหรับการรักษา
 */
export interface ITreatment {
    code?: string;                    // รหัสการรักษา
    name: string;                     // ชื่อการรักษา
    description?: string;             // รายละเอียด
    cost?: number;                    // ค่าใช้จ่าย
}

/**
 * OPD attributes interface
 */
export interface IOpdAttributes {
    title: string;                    // วันที่ในรูปแบบ DD/MM/YYYY
    date: Date;                       // วันที่ในรูปแบบ Date object
    patientId: Types.ObjectId | string; // ผู้ป่วย
    dentistId: Types.ObjectId | string; // ทันตแพทย์
    clinicId: Types.ObjectId | string;  // คลินิก
    branchId?: Types.ObjectId | string; // สาขา (optional)
    chiefComplaint: string;           // ข้อร้องเรียนหลัก
    side: OpdSide;                    // ด้าน
    teeth: IToothData[];              // ข้อมูลฟัน
    io: string;                       // I/O (Intra-oral/Extra-oral examination)
    diagnosis: IDiagnosis[];          // การวินิจฉัย
    treatment: ITreatment[];          // การรักษา
    remark?: string;                  // หมายเหตุ
    status: 'draft' | 'completed' | 'cancelled'; // สถานะ
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface หลักสำหรับ OPD
 */
export interface IOpd extends IOpdAttributes {
    _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ OPD เมื่อเก็บใน MongoDB
 */
export interface IOpdDocument extends Document, IOpdAttributes {
    _id: Types.ObjectId;

    // Virtual properties
    totalCost: number;
    teethCount: number;
    affectedTeethNumbers: string[];

    // Instance methods
    getTeethByCondition(condition: ToothCondition): IToothData[];
    getTeethByTreatment(treatment: TreatmentType): IToothData[];
    addTooth(toothData: IToothData): Promise<IOpdDocument>;
    removeTooth(toothNumber: string): Promise<IOpdDocument>;
    updateToothCondition(toothNumber: string, condition: ToothCondition, treatment?: TreatmentType): Promise<IOpdDocument>;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง OPD ใหม่
 */
export interface CreateOpdInput {
    title: string;
    date: Date | string;
    patientId: string;
    dentistId: string;
    clinicId: string;
    branchId?: string;
    chiefComplaint: string;
    side: OpdSide;
    teeth?: IToothData[];
    io: string;
    diagnosis?: IDiagnosis[];
    treatment?: ITreatment[];
    remark?: string;
    status?: 'draft' | 'completed' | 'cancelled';
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต OPD
 */
export interface UpdateOpdInput {
    title?: string;
    date?: Date | string;
    dentistId?: string;
    branchId?: string;
    chiefComplaint?: string;
    side?: OpdSide;
    teeth?: IToothData[];
    io?: string;
    diagnosis?: IDiagnosis[];
    treatment?: ITreatment[];
    remark?: string;
    status?: 'draft' | 'completed' | 'cancelled';
}

/**
 * Interface สำหรับ OPD response
 */
export interface OpdResponse {
    id: string;
    title: string;
    date: Date;
    patientId: string;
    patientName?: string;
    dentistId: string;
    dentistName?: string;
    clinicId: string;
    clinicName?: string;
    branchId?: string;
    branchName?: string;
    chiefComplaint: string;
    side: OpdSide;
    teeth: IToothData[];
    io: string;
    diagnosis: IDiagnosis[];
    treatment: ITreatment[];
    remark?: string;
    status: 'draft' | 'completed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Function สำหรับแปลง IOpd หรือ IOpdDocument เป็น OpdResponse
 */
export const toOpdResponse = (opd: IOpd | IOpdDocument): OpdResponse => {
    const id = typeof opd._id === 'string' ? opd._id : opd._id.toString();

    // สำหรับ patient
    let patientId = '';
    let patientName: string | undefined = undefined;

    if (typeof opd.patientId === 'string') {
        patientId = opd.patientId;
    } else if (opd.patientId && (opd.patientId as any)._id) {
        const patient = opd.patientId as any;
        patientId = patient._id.toString();
        patientName = `${patient.name || ''} ${patient.surname || ''}`.trim();
    } else if (opd.patientId) {
        patientId = opd.patientId.toString();
    }

    // สำหรับ dentist
    let dentistId = '';
    let dentistName: string | undefined = undefined;

    if (typeof opd.dentistId === 'string') {
        dentistId = opd.dentistId;
    } else if (opd.dentistId && (opd.dentistId as any)._id) {
        const dentist = opd.dentistId as any;
        dentistId = dentist._id.toString();
        dentistName = `${dentist.name || ''} ${dentist.surname || ''}`.trim();
    } else if (opd.dentistId) {
        dentistId = opd.dentistId.toString();
    }

    // สำหรับ clinic
    let clinicId = '';
    let clinicName: string | undefined = undefined;

    if (typeof opd.clinicId === 'string') {
        clinicId = opd.clinicId;
    } else if (opd.clinicId && (opd.clinicId as any)._id) {
        const clinic = opd.clinicId as any;
        clinicId = clinic._id.toString();
        clinicName = clinic.name;
    } else if (opd.clinicId) {
        clinicId = opd.clinicId.toString();
    }

    // สำหรับ branch
    let branchId: string | undefined = undefined;
    let branchName: string | undefined = undefined;

    if (opd.branchId) {
        if (typeof opd.branchId === 'string') {
            branchId = opd.branchId;
        } else if ((opd.branchId as any)._id) {
            const branch = opd.branchId as any;
            branchId = branch._id.toString();
            branchName = branch.name;
        } else {
            branchId = opd.branchId.toString();
        }
    }

    return {
        id,
        title: opd.title,
        date: opd.date,
        patientId,
        patientName,
        dentistId,
        dentistName,
        clinicId,
        clinicName,
        branchId,
        branchName,
        chiefComplaint: opd.chiefComplaint,
        side: opd.side,
        teeth: opd.teeth,
        io: opd.io,
        diagnosis: opd.diagnosis,
        treatment: opd.treatment,
        remark: opd.remark,
        status: opd.status,
        createdAt: opd.createdAt,
        updatedAt: opd.updatedAt
    };
};

/**
 * Response builders
 */
export const opdResponseBuilders = {
    // สำหรับ option/dropdown
    option: (opd: IOpd | IOpdDocument) => ({
        id: opd._id.toString(),
        value: opd.title,
        date: opd.date
    }),

    // สำหรับ summary
    summary: (opd: IOpd | IOpdDocument) => ({
        id: opd._id.toString(),
        title: opd.title,
        date: opd.date,
        chiefComplaint: opd.chiefComplaint,
        status: opd.status
    })
};

export type OpdOptionResponse = ReturnType<typeof opdResponseBuilders.option>;
export type OpdSummaryResponse = ReturnType<typeof opdResponseBuilders.summary>;

/**
 * Utility functions สำหรับฟัน
 */
export const toothUtils = {
    // แปลงหมายเลขฟันเป็นชื่อ
    getToothName: (toothNumber: string): string => {
        const toothNames: { [key: string]: string } = {
            // ฟันบน ขวา (Upper Right)
            '11': 'ฟันหน้าซี่ที่ 1 ขวาบน', '12': 'ฟันหน้าซี่ที่ 2 ขวาบน',
            '13': 'ฟันเขี้ยวขวาบน', '14': 'ฟันกรามน้อยซี่ที่ 1 ขวาบน',
            '15': 'ฟันกรามน้อยซี่ที่ 2 ขวาบน', '16': 'ฟันกรามใหญ่ซี่ที่ 1 ขวาบน',
            '17': 'ฟันกรามใหญ่ซี่ที่ 2 ขวาบน', '18': 'ฟันกรามใหญ่ซี่ที่ 3 ขวาบน',

            // ฟันบน ซ้าย (Upper Left)
            '21': 'ฟันหน้าซี่ที่ 1 ซ้ายบน', '22': 'ฟันหน้าซี่ที่ 2 ซ้ายบน',
            '23': 'ฟันเขี้ยวซ้ายบน', '24': 'ฟันกรามน้อยซี่ที่ 1 ซ้ายบน',
            '25': 'ฟันกรามน้อยซี่ที่ 2 ซ้ายบน', '26': 'ฟันกรามใหญ่ซี่ที่ 1 ซ้ายบน',
            '27': 'ฟันกรามใหญ่ซี่ที่ 2 ซ้ายบน', '28': 'ฟันกรามใหญ่ซี่ที่ 3 ซ้ายบน',

            // ฟันล่าง ซ้าย (Lower Left)
            '31': 'ฟันหน้าซี่ที่ 1 ซ้ายล่าง', '32': 'ฟันหน้าซี่ที่ 2 ซ้ายล่าง',
            '33': 'ฟันเขี้ยวซ้ายล่าง', '34': 'ฟันกรามน้อยซี่ที่ 1 ซ้ายล่าง',
            '35': 'ฟันกรามน้อยซี่ที่ 2 ซ้ายล่าง', '36': 'ฟันกรามใหญ่ซี่ที่ 1 ซ้ายล่าง',
            '37': 'ฟันกรามใหญ่ซี่ที่ 2 ซ้ายล่าง', '38': 'ฟันกรามใหญ่ซี่ที่ 3 ซ้ายล่าง',

            // ฟันล่าง ขวา (Lower Right)
            '41': 'ฟันหน้าซี่ที่ 1 ขวาล่าง', '42': 'ฟันหน้าซี่ที่ 2 ขวาล่าง',
            '43': 'ฟันเขี้ยวขวาล่าง', '44': 'ฟันกรามน้อยซี่ที่ 1 ขวาล่าง',
            '45': 'ฟันกรามน้อยซี่ที่ 2 ขวาล่าง', '46': 'ฟันกรามใหญ่ซี่ที่ 1 ขวาล่าง',
            '47': 'ฟันกรามใหญ่ซี่ที่ 2 ขวาล่าง', '48': 'ฟันกรามใหญ่ซี่ที่ 3 ขวาล่าง'
        };

        return toothNames[toothNumber] || `ฟันซี่ ${toothNumber}`;
    },

    // ตรวจสอบว่าเป็นหมายเลขฟันที่ถูกต้องหรือไม่
    isValidToothNumber: (toothNumber: string): boolean => {
        const validNumbers = [
            '11', '12', '13', '14', '15', '16', '17', '18',
            '21', '22', '23', '24', '25', '26', '27', '28',
            '31', '32', '33', '34', '35', '36', '37', '38',
            '41', '42', '43', '44', '45', '46', '47', '48'
        ];
        return validNumbers.includes(toothNumber);
    },

    // แปลงหน้าฟันเป็นชื่อ
    getSurfaceName: (surface: ToothSurface): string => {
        const surfaceNames: { [key in ToothSurface]: string } = {
            [ToothSurface.MESIAL]: 'หน้าใกล้กลาง',
            [ToothSurface.DISTAL]: 'หน้าไกลกลาง',
            [ToothSurface.OCCLUSAL]: 'หน้าบด',
            [ToothSurface.BUCCAL]: 'หน้าแก้ม',
            [ToothSurface.LINGUAL]: 'หน้าลิ้น',
            [ToothSurface.INCISAL]: 'หน้าตัด',
            [ToothSurface.FACIAL]: 'หน้าหน้า',
            [ToothSurface.PALATAL]: 'หน้าเพดาน'
        };
        return surfaceNames[surface];
    }
};