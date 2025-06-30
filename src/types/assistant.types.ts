import { Document, Types } from 'mongoose';

/**
 * เพศ
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

/**
 * ประเภทการจ้างงาน
 */
export enum EmploymentType {
  PART_TIME = 'partTime',
  FULL_TIME = 'fullTime'
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
  day: DayOfWeek;
  time: string[];
}

/**
 * Interface สำหรับ branch ที่ assistant ปฏิบัติงาน
 */
export interface IAssistantBranch {
  branchId: Types.ObjectId | string;
  timetable: ITimetable[];
}

/**
 * Assistant attributes interface
 */
export interface IAssistantAttributes {
  photo?: string;
  name: string;
  surname: string;
  nickname?: string;
  gender: Gender;
  nationality?: string;
  birthday?: Date;
  address?: string;
  employmentType: EmploymentType; // ประเภทการจ้างงาน
  clinicId: Types.ObjectId | string;
  branches: IAssistantBranch[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Assistant
 */
export interface IAssistant extends IAssistantAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Assistant เมื่อเก็บใน MongoDB
 */
export interface IAssistantDocument extends Document, IAssistantAttributes {
  _id: Types.ObjectId;
  fullName: string; // Virtual property
  age?: number; // Virtual property
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Assistant ใหม่
 */
export interface CreateAssistantInput {
  photo?: string;
  name: string;
  surname: string;
  nickname?: string;
  gender: Gender;
  nationality?: string;
  birthday?: Date | string;
  address?: string;
  employmentType: EmploymentType;
  clinicId: string;
  branches?: IAssistantBranch[];
  isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Assistant
 */
export interface UpdateAssistantInput {
  photo?: string;
  name?: string;
  surname?: string;
  nickname?: string;
  gender?: Gender;
  nationality?: string;
  birthday?: Date | string;
  address?: string;
  employmentType?: EmploymentType;
  branches?: IAssistantBranch[];
  isActive?: boolean;
}

/**
 * Interface สำหรับ Assistant response
 */
export interface AssistantResponse {
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
  employmentType: EmploymentType;
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
 * Function สำหรับแปลง IAssistant หรือ IAssistantDocument เป็น AssistantResponse
 */
export const toAssistantResponse = (assistant: IAssistant | IAssistantDocument): AssistantResponse => {
  const id = typeof assistant._id === 'string' ? assistant._id : assistant._id.toString();
  
  // สำหรับ clinic
  let clinicId = '';
  let clinicName: string | undefined = undefined;
  
  if (typeof assistant.clinicId === 'string') {
    clinicId = assistant.clinicId;
  } else if (assistant.clinicId && (assistant.clinicId as any)._id) {
    const clinic = assistant.clinicId as any;
    clinicId = clinic._id.toString();
    clinicName = clinic.name;
  } else if (assistant.clinicId) {
    clinicId = assistant.clinicId.toString();
  }
  
  // สำหรับ branches
  const branches = assistant.branches.map(branch => {
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
    photo: assistant.photo,
    name: assistant.name,
    surname: assistant.surname,
    fullName: 'fullName' in assistant ? assistant.fullName : `${assistant.name} ${assistant.surname}`,
    nickname: assistant.nickname,
    gender: assistant.gender,
    nationality: assistant.nationality,
    birthday: assistant.birthday,
    age: 'age' in assistant ? assistant.age : undefined,
    address: assistant.address,
    employmentType: assistant.employmentType,
    clinicId,
    clinicName,
    branches,
    isActive: assistant.isActive,
    createdAt: assistant.createdAt,
    updatedAt: assistant.updatedAt
  };
};

export const assistantResponseBuilders = {
  // สำหรับ option/dropdown
  option: (assistant: IAssistant | IAssistantDocument) => ({
    id: assistant._id.toString(),
    value: 'fullName' in assistant ? assistant.fullName : `${assistant.name} ${assistant.surname}`,
  })
};

export type AssistantOptionResponse = ReturnType<typeof assistantResponseBuilders.option>;