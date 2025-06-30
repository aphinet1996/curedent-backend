import { Document, Types } from 'mongoose';

/**
 * เพศ
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

/**
 * วันในสัปดาห์
 */
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

/**
 * Interface สำหรับ timetable
 */
export interface ITimetable {
  day: DayOfWeek; // เปลี่ยนจาก date: Date เป็น day: DayOfWeek
  time: string[];
}

/**
 * Interface สำหรับ branch ที่หมอปฏิบัติงาน
 */
export interface IDoctorBranch {
  branchId: Types.ObjectId | string;
  timetable: ITimetable[];
}

/**
 * Doctor attributes interface
 */
export interface IDoctorAttributes {
  photo?: string;
  name: string;
  surname: string;
  nickname?: string;
  gender: Gender;
  nationality?: string;
  birthday?: Date;
  address?: string;
  specialty: string;
  color: string; // เพิ่ม field สำหรับสีของหมอ (hex color code)
  clinicId: Types.ObjectId | string;
  branches: IDoctorBranch[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Doctor
 */
export interface IDoctor extends IDoctorAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Doctor เมื่อเก็บใน MongoDB
 */
export interface IDoctorDocument extends Document, IDoctorAttributes {
  _id: Types.ObjectId;
  fullName: string; // Virtual property
  age?: number; // Virtual property
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Doctor ใหม่
 */
export interface CreateDoctorInput {
  photo?: string;
  name: string;
  surname: string;
  nickname?: string;
  gender: Gender;
  nationality?: string;
  birthday?: Date | string;
  address?: string;
  specialty: string;
  color: string; // เพิ่ม field สำหรับสีของหมอ
  clinicId: string;
  branches?: IDoctorBranch[];
  isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Doctor
 */
export interface UpdateDoctorInput {
  photo?: string;
  name?: string;
  surname?: string;
  nickname?: string;
  gender?: Gender;
  nationality?: string;
  birthday?: Date | string;
  address?: string;
  specialty?: string;
  color?: string; // เพิ่ม field สำหรับสีของหมอ
  branches?: IDoctorBranch[];
  isActive?: boolean;
}

/**
 * Interface สำหรับ Doctor response
 */
export interface DoctorResponse {
  id: string;
  photo?: string;
  name: string;
  surname: string;
  fullName: string;
  nickname?: string;
  gender: Gender;
  nationality?: string;
  birthday?: Date;
  age?: number;
  address?: string;
  specialty: string;
  color: string; // เพิ่ม field สำหรับสีของหมอ
  clinicId: string;
  clinicName?: string;
  branches: Array<{
    branchId: string;
    name: string;
    timetable: ITimetable[];
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IDoctor หรือ IDoctorDocument เป็น DoctorResponse
 */
export const toDoctorResponse = (doctor: IDoctor | IDoctorDocument): DoctorResponse => {
  const id = typeof doctor._id === 'string' ? doctor._id : doctor._id.toString();
  
  // สำหรับ clinic
  let clinicId = '';
  let clinicName: string | undefined = undefined;
  
  if (typeof doctor.clinicId === 'string') {
    clinicId = doctor.clinicId;
  } else if (doctor.clinicId && (doctor.clinicId as any)._id) {
    const clinic = doctor.clinicId as any;
    clinicId = clinic._id.toString();
    clinicName = clinic.name;
  } else if (doctor.clinicId) {
    clinicId = doctor.clinicId.toString();
  }
  
  // สำหรับ branches
  const branches = doctor.branches.map(branch => {
    let branchId = '';
    let branchName = 'ไม่ระบุชื่อสาขา';
    
    if (typeof branch.branchId === 'string') {
      branchId = branch.branchId;
    } else if (branch.branchId && (branch.branchId as any)._id) {
      const branchData = branch.branchId as any;
      branchId = branchData._id.toString();
      branchName = branchData.name || 'ไม่ระบุชื่อสาขา';
    } else if (branch.branchId) {
      branchId = branch.branchId.toString();
    }
    
    return {
      branchId,
      name: branchName,
      timetable: branch.timetable
    };
  });
  
  return {
    id,
    photo: doctor.photo,
    name: doctor.name,
    surname: doctor.surname,
    fullName: 'fullName' in doctor ? doctor.fullName : `${doctor.name} ${doctor.surname}`,
    nickname: doctor.nickname,
    gender: doctor.gender,
    nationality: doctor.nationality,
    birthday: doctor.birthday,
    age: 'age' in doctor ? doctor.age : undefined,
    address: doctor.address,
    specialty: doctor.specialty,
    color: doctor.color,
    clinicId,
    clinicName,
    branches,
    isActive: doctor.isActive,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt
  };
};

export const doctorResponseBuilders = {
  // สำหรับ option/dropdown
  option: (doctor: IDoctor | IDoctorDocument) => ({
    id: doctor._id.toString(),
    value: 'fullName' in doctor ? doctor.fullName : `${doctor.name} ${doctor.surname}`,
    color: doctor.color // เพิ่มสีในตัวเลือก dropdown
  })

};

export type DoctorOptionResponse = ReturnType<typeof doctorResponseBuilders.option>;