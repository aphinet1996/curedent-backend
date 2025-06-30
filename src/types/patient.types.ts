import { Document, Types } from 'mongoose';
import { 
  getObjectIdString,
  getPopulatedName,
  getPopulatedDoctorForPatient,
  getMultilingualValue,
  calculateAge,
  createMultilingualFullName,
  IMultilingualText
} from '../utils/mogoose.utils';

/**
 * Interface สำหรับที่อยู่
 */
export interface IAddress {
    address: string;
    subdistrict: string; // แขวง/ตำบล
    district: string;    // เขต/อำเภอ
    province: string;    // จังหวัด
    zipcode: string;     // รหัสไปรษณีย์
}

/**
 * Interface สำหรับบุคคลที่ติดต่อกรณีฉุกเฉิน
 */
export interface IEmergencyContact {
    fullName: string;        // ชื่อ-นามสกุล
    relationship: string;    // ความสัมพันธ์
    address: string;         // ที่อยู่
    phone: string;          // เบอร์มือถือ
}

/**
 * Interface สำหรับข้อมูลจำเพาะทางการแพทย์
 */
export interface IMedicalInfo {
    drugAllergies: string[];      // แพ้ยา/อาการแพ้
    assistantDoctorId?: Types.ObjectId | string; // ผู้ช่วยแพทย์ประจำ
    primaryDoctorId?: Types.ObjectId | string;   // แพทย์ประจำ
    chronicDiseases: string[];    // โรคประจำตัว
    currentMedications: string[]; // ยาที่ใช้อยู่
}

/**
 * Patient attributes interface
 */
export interface IPatientAttributes {
    // ข้อมูลระบบ
    branchId: Types.ObjectId | string;  // สาขา
    clinicId: Types.ObjectId | string;  // คลินิก (for easier querying)
    hn: string;                         // HN number (auto-generated)

    // ข้อมูลทั่วไป
    nationalId: string;                 // เลขบัตรประชาชน
    nationality: IMultilingualText;     // สัญชาติ
    titlePrefix: IMultilingualText;     // คำนำหน้าชื่อ
    firstName: IMultilingualText;       // ชื่อจริง
    lastName: IMultilingualText;        // นามสกุล
    nickname?: string;                  // ชื่อเล่น
    gender: IMultilingualText;          // เพศ
    dateOfBirth: Date;                  // วันเกิด
    patientType: IMultilingualText;     // ประเภท
    bloodGroup?: IMultilingualText;     // กรุ๊ปเลือด
    occupation?: IMultilingualText;     // อาชีพ
    medicalRights?: IMultilingualText;  // สิทธิการรักษา
    maritalStatus?: IMultilingualText;  // สถานภาพ
    referralSource?: IMultilingualText; // รู้จักผ่านช่องทาง

    // ที่อยู่
    idCardAddress: IAddress;            // ที่อยู่ตามบัตรประชาชน
    currentAddress: IAddress;           // ที่อยู่ปัจจุบัน

    // ข้อมูลการติดต่อ
    phone: string;                      // เบอร์มือถือ
    email?: string;                     // อีเมล
    notes?: string;                     // หมายเหตุ

    // ข้อมูลจำเพาะทางการแพทย์
    medicalInfo: IMedicalInfo;

    // บุคคลที่ติดต่อกรณีฉุกเฉิน
    emergencyContact: IEmergencyContact;

    // สถานะ
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Patient
 */
export interface IPatient extends IPatientAttributes {
    _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Patient เมื่อเก็บใน MongoDB
 */
export interface IPatientDocument extends Document, IPatientAttributes {
    _id: Types.ObjectId;
    fullNameTh: string;     // Virtual property
    fullNameEn: string;     // Virtual property
    age: number;           // Virtual property

    // Helper methods
    calculateAge(): number;
    getFullNameTh(): string;
    getFullNameEn(): string;
    getDisplayName(lang?: string): string;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Patient ใหม่
 */
export interface CreatePatientInput {
    branchId: string;
    hn?: string; // Optional, จะ auto-generate ถ้าไม่ใส่
    nationalId: string;
    nationality: IMultilingualText;
    titlePrefix: IMultilingualText;
    firstName: IMultilingualText;
    lastName: IMultilingualText;
    nickname?: string;
    gender: IMultilingualText;
    dateOfBirth: Date | string;
    patientType: IMultilingualText;
    bloodGroup?: IMultilingualText;
    occupation?: IMultilingualText;
    medicalRights?: IMultilingualText;
    maritalStatus?: IMultilingualText;
    referralSource?: IMultilingualText;

    // ที่อยู่
    idCardAddress: IAddress;
    currentAddress: IAddress;

    // ข้อมูลการติดต่อ
    phone: string;
    email?: string;
    notes?: string;

    // ข้อมูลจำเพาะทางการแพทย์
    medicalInfo: IMedicalInfo;

    // บุคคลที่ติดต่อกรณีฉุกเฉิน
    emergencyContact: IEmergencyContact;

    isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Patient
 */
export interface UpdatePatientInput {
    nationality?: Partial<IMultilingualText>;
    titlePrefix?: Partial<IMultilingualText>;
    firstName?: Partial<IMultilingualText>;
    lastName?: Partial<IMultilingualText>;
    nickname?: string;
    gender?: Partial<IMultilingualText>;
    dateOfBirth?: Date | string;
    patientType?: Partial<IMultilingualText>;
    bloodGroup?: Partial<IMultilingualText>;
    occupation?: Partial<IMultilingualText>;
    medicalRights?: Partial<IMultilingualText>;
    maritalStatus?: Partial<IMultilingualText>;
    referralSource?: Partial<IMultilingualText>;

    // ที่อยู่
    idCardAddress?: Partial<IAddress>;
    currentAddress?: Partial<IAddress>;

    // ข้อมูลการติดต่อ
    phone?: string;
    email?: string;
    notes?: string;

    // ข้อมูลจำเพาะทางการแพทย์
    medicalInfo?: Partial<IMedicalInfo>;

    // บุคคลที่ติดต่อกรณีฉุกเฉิน
    emergencyContact?: Partial<IEmergencyContact>;

    isActive?: boolean;
}

/**
 * Interface สำหรับ Patient response
 */
export interface PatientResponse {
    id: string;
    hn: string;
    branchId: string;
    branchName: string;
    nationalId: string;
    nationality: string;
    titlePrefix: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    fullName: string;
    gender: string;
    dateOfBirth: Date;
    age: number;
    patientType: string;
    bloodGroup?: string;
    occupation?: string;
    medicalRights?: string;
    maritalStatus?: string;
    referralSource?: string;

    // ที่อยู่
    idCardAddress: IAddress;
    currentAddress: IAddress;

    // ข้อมูลการติดต่อ
    phone: string;
    email?: string;
    notes?: string;

    // ข้อมูลจำเพาะทางการแพทย์
    medicalInfo: {
        drugAllergies: string[];
        assistantDoctor?: {
            id: string;
            name: string;
        };
        primaryDoctor?: {
            id: string;
            name: string;
        };
        chronicDiseases: string[];
        currentMedications: string[];
    };

    // บุคคลที่ติดต่อกรณีฉุกเฉิน
    emergencyContact: IEmergencyContact;

    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface สำหรับ HN Counter
 */
export interface IHNCounter {
    date: string;           // YYMMDD format
    sequence: number;       // running number
    clinicId: Types.ObjectId | string;
}

/**
 * Interface สำหรับตัวเลือกหลายภาษา
 */
export interface IMultilingualOption {
    th: string;
    en?: string;
}

/**
 * Interface สำหรับ dropdown options ที่แยกตามคลินิก
 */
export interface IPatientDropdownOptions {
    nationalities: IMultilingualOption[];
    titlePrefixes: IMultilingualOption[];
    genders: IMultilingualOption[];
    patientTypes: IMultilingualOption[];
    bloodGroups: IMultilingualOption[];
    occupations: IMultilingualOption[];
    medicalRights: IMultilingualOption[];
    maritalStatuses: IMultilingualOption[];
    referralSources: IMultilingualOption[];
}

/**
 * Interface สำหรับ Patient Options
 */
export interface IPatientOptions {
    clinicId: Types.ObjectId | string;
    category: 'nationality' | 'titlePrefix' | 'gender' | 'patientType' | 'bloodGroup' | 'occupation' | 'medicalRight' | 'maritalStatus' | 'referralSource';
    values: IMultilingualOption[];
    isActive: boolean;
    isDefault: boolean; // สำหรับข้อมูลเริ่มต้นของระบบ
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface สำหรับ Patient Options เมื่อเก็บใน MongoDB
 */
export interface IPatientOptionsDocument extends Document, IPatientOptions {
    _id: Types.ObjectId;
}

/**
 * Type สำหรับ Patient Options Category
 */
export type PatientOptionCategory = 'nationality' | 'titlePrefix' | 'gender' | 'patientType' | 'bloodGroup' | 'occupation' | 'medicalRight' | 'maritalStatus' | 'referralSource';

/**
 * Interface สำหรับการสร้าง Patient Options ใหม่
 */
export interface CreatePatientOptionsInput {
    clinicId: string;
    category: PatientOptionCategory;
    values: IMultilingualOption[];
    isActive?: boolean;
    isDefault?: boolean;
}

/**
 * Interface สำหรับการอัปเดต Patient Options
 */
export interface UpdatePatientOptionsInput {
    values?: IMultilingualOption[];
    isActive?: boolean;
}

/**
 * Function สำหรับแปลง IPatient เป็น PatientResponse
 */
export const toPatientResponse = (patient: IPatient | IPatientDocument, lang = 'th'): PatientResponse => {
    const id = getObjectIdString(patient._id);
    const branchId = getObjectIdString(patient.branchId);

    // Handle branch name using utility function
    const branchName = getPopulatedName(patient.branchId, 'ไม่ระบุสาขา');

    // Handle doctors using utility function
    const assistantDoctor = getPopulatedDoctorForPatient(patient.medicalInfo.assistantDoctorId);
    const primaryDoctor = getPopulatedDoctorForPatient(patient.medicalInfo.primaryDoctorId);

    // Get multilingual values using utility function
    const titlePrefix = getMultilingualValue(patient.titlePrefix, lang);
    const firstName = getMultilingualValue(patient.firstName, lang);
    const lastName = getMultilingualValue(patient.lastName, lang);
    const nationality = getMultilingualValue(patient.nationality, lang);
    const gender = getMultilingualValue(patient.gender, lang);
    const patientType = getMultilingualValue(patient.patientType, lang);
    const bloodGroup = getMultilingualValue(patient.bloodGroup, lang);
    const occupation = getMultilingualValue(patient.occupation, lang);
    const medicalRights = getMultilingualValue(patient.medicalRights, lang);
    const maritalStatus = getMultilingualValue(patient.maritalStatus, lang);
    const referralSource = getMultilingualValue(patient.referralSource, lang);

    // Create full name using utility function
    const fullName = createMultilingualFullName(
        // patient.titlePrefix,
        patient.firstName,
        patient.lastName,
        lang
    );

    // Calculate age using utility function
    const age = 'age' in patient ? patient.age : calculateAge(patient.dateOfBirth);

    return {
        id,
        hn: patient.hn,
        branchId,
        branchName,
        nationalId: patient.nationalId,
        nationality,
        titlePrefix,
        firstName,
        lastName,
        nickname: patient.nickname,
        fullName,
        gender,
        dateOfBirth: patient.dateOfBirth,
        age,
        patientType,
        bloodGroup,
        occupation,
        medicalRights,
        maritalStatus,
        referralSource,
        idCardAddress: patient.idCardAddress,
        currentAddress: patient.currentAddress,
        phone: patient.phone,
        email: patient.email,
        notes: patient.notes,
        medicalInfo: {
            drugAllergies: patient.medicalInfo.drugAllergies,
            assistantDoctor,
            primaryDoctor,
            chronicDiseases: patient.medicalInfo.chronicDiseases,
            currentMedications: patient.medicalInfo.currentMedications,
        },
        emergencyContact: patient.emergencyContact,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
    };
};

// Re-export utility functions and interfaces for backward compatibility
export { 
    getMultilingualValue, 
    calculateAge, 
    IMultilingualText 
} from '../utils/mogoose.utils';