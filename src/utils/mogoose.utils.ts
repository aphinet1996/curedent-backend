import { Types } from 'mongoose';

export const getObjectIdString = (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj._id) return obj._id.toString();
  if (obj instanceof Types.ObjectId) return obj.toString();
  return '';
};

export const compareObjectIds = (obj1: any, obj2: any): boolean => {
  const id1 = getObjectIdString(obj1);
  const id2 = getObjectIdString(obj2);
  return id1 === id2 && id1 !== '';
};

/**
 * แปลงค่าเป็น ObjectId
 * @param obj - ค่าที่ต้องการแปลง
 * @returns ObjectId หรือ null ถ้าแปลงไม่ได้
 */
export const toObjectId = (obj: any): Types.ObjectId | null => {
  if (!obj) return null;
  if (obj instanceof Types.ObjectId) return obj;
  if (typeof obj === 'string' && Types.ObjectId.isValid(obj)) {
    return new Types.ObjectId(obj);
  }
  if (obj._id && Types.ObjectId.isValid(obj._id)) {
    return new Types.ObjectId(obj._id);
  }
  return null;
};

/**
 * ตรวจสอบว่าค่าเป็น ObjectId ที่ valid หรือไม่
 * @param obj - ค่าที่ต้องการตรวจสอบ
 * @returns true ถ้าเป็น ObjectId ที่ valid
 */
export const isValidObjectId = (obj: any): boolean => {
  if (!obj) return false;
  if (obj instanceof Types.ObjectId) return true;
  if (typeof obj === 'string') return Types.ObjectId.isValid(obj);
  if (obj._id) return Types.ObjectId.isValid(obj._id);
  return false;
};

/**
 * เปรียบเทียบ ObjectId แบบ strict (ต้องเป็น ObjectId ทั้งคู่)
 * @param obj1 - ObjectId แรก
 * @param obj2 - ObjectId ที่สอง
 * @returns true ถ้าเหมือนกัน
 */
export const strictCompareObjectIds = (obj1: any, obj2: any): boolean => {
  const id1 = toObjectId(obj1);
  const id2 = toObjectId(obj2);

  if (!id1 || !id2) return false;
  return id1.equals(id2);
};

/**
 * สร้าง ObjectId ใหม่
 * @returns ObjectId ใหม่
 */
export const generateObjectId = (): Types.ObjectId => {
  return new Types.ObjectId();
};

/**
 * แปลง array ของ ObjectId strings เป็น array ของ ObjectId
 * @param ids - array ของ strings
 * @returns array ของ ObjectId
 */
export const stringArrayToObjectIds = (ids: string[]): Types.ObjectId[] => {
  return ids
    .filter(id => Types.ObjectId.isValid(id))
    .map(id => new Types.ObjectId(id));
};

/**
 * แปลง array ของ ObjectId เป็น array ของ strings
 * @param ids - array ของ ObjectId
 * @returns array ของ strings
 */
export const objectIdArrayToStrings = (ids: Types.ObjectId[]): string[] => {
  return ids.map(id => id.toString());
};

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูลของคลินิกหรือไม่
 * @param userRole - บทบาทของ user
 * @param userClinicId - clinic ID ของ user
 * @param targetClinicId - clinic ID ของข้อมูลที่ต้องการเข้าถึง
 * @returns true ถ้ามีสิทธิ์เข้าถึง
 */
export const hasClinicAccess = (
  userRole: string,
  userClinicId: any,
  targetClinicId: any
): boolean => {
  // Super admin เข้าถึงได้ทุกอย่าง
  if (userRole === 'superAdmin') return true;

  // Owner เข้าถึงได้เฉพาะคลินิกตัวเอง
  if (userRole === 'owner') {
    return compareObjectIds(userClinicId, targetClinicId);
  }

  // Role อื่นๆ ตรวจสอบตาม clinic
  return compareObjectIds(userClinicId, targetClinicId);
};

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึงข้อมูลของสาขาหรือไม่
 * @param userRole - บทบาทของ user
 * @param userBranchId - branch ID ของ user
 * @param targetBranchId - branch ID ของข้อมูลที่ต้องการเข้าถึง
 * @param userClinicId - clinic ID ของ user (สำหรับ owner/admin)
 * @param targetClinicId - clinic ID ของข้อมูลที่ต้องการเข้าถึง
 * @returns true ถ้ามีสิทธิ์เข้าถึง
 */
export const hasBranchAccess = (
  userRole: string,
  userBranchId: any,
  targetBranchId: any,
  userClinicId?: any,
  targetClinicId?: any
): boolean => {
  // Super admin เข้าถึงได้ทุกอย่าง
  if (userRole === 'superAdmin') return true;

  // Owner/Admin เข้าถึงได้ทุกสาขาในคลินิกตัวเอง
  if (['owner', 'admin'].includes(userRole)) {
    if (userClinicId && targetClinicId) {
      return compareObjectIds(userClinicId, targetClinicId);
    }
  }

  // Manager/Staff เข้าถึงได้เฉพาะสาขาตัวเอง
  return compareObjectIds(userBranchId, targetBranchId);
};

// ===== Populated Data Helper Functions =====

/**
 * ดึงชื่อจาก populated object หรือใช้ default name
 * @param ref - populated reference object หรือ ObjectId string
 * @param defaultName - ชื่อ default ถ้าไม่พบข้อมูล
 * @returns ชื่อจาก populated object หรือ default name
 */
export const getPopulatedName = (ref: any, defaultName: string): string => {
  if (typeof ref === 'string') return defaultName;
  if (ref && typeof ref === 'object' && ref.name) return ref.name;
  return defaultName;
};

/**
 * ดึงชื่อแพทย์จาก populated doctor object
 * @param doctorRef - populated doctor reference
 * @returns ชื่อแพทย์หรือข้อความ default
 */
export const getPopulatedDoctorName = (doctorRef: any): string => {
  if (typeof doctorRef === 'string') return 'ไม่ระบุแพทย์';
  if (doctorRef && typeof doctorRef === 'object') {
    if (doctorRef.fullName) return doctorRef.fullName;
    if (doctorRef.name && doctorRef.surname) return `${doctorRef.name} ${doctorRef.surname}`;
    if (doctorRef.firstNameTh && doctorRef.lastNameTh) return `${doctorRef.firstNameTh} ${doctorRef.lastNameTh}`;
  }
  return 'ไม่ระบุแพทย์';
};

/**
 * ดึงความเชี่ยวชาญของแพทย์จาก populated doctor object
 * @param doctorRef - populated doctor reference
 * @returns ความเชี่ยวชาญหรือ empty string
 */
export const getPopulatedDoctorSpecialty = (doctorRef: any): string => {
  if (typeof doctorRef === 'string') return '';
  if (doctorRef && typeof doctorRef === 'object' && doctorRef.specialty) return doctorRef.specialty;
  return '';
};

/**
 * ดึงชื่อผู้ป่วยจาก populated patient object
 * @param patientRef - populated patient reference
 * @returns ชื่อผู้ป่วยหรือข้อความ default
 */
export const getPopulatedPatientName = (patientRef: any): string => {
  if (typeof patientRef === 'string') return 'ไม่ระบุผู้ป่วย';
  if (patientRef && typeof patientRef === 'object') {
    if (patientRef.fullNameTh) return patientRef.fullNameTh;
    if (patientRef.firstNameTh && patientRef.lastNameTh) {
      return `${patientRef.titlePrefix || ''}${patientRef.firstNameTh} ${patientRef.lastNameTh}`;
    }
  }
  return 'ไม่ระบุผู้ป่วย';
};

/**
 * ดึง HN ของผู้ป่วยจาก populated patient object
 * @param patientRef - populated patient reference
 * @returns HN หรือ empty string
 */
export const getPopulatedPatientHN = (patientRef: any): string => {
  if (typeof patientRef === 'string') return '';
  if (patientRef && typeof patientRef === 'object' && patientRef.hn) return patientRef.hn;
  return '';
};

/**
 * ดึงเบอร์โทรศัพท์ของผู้ป่วยจาก populated patient object
 * @param patientRef - populated patient reference
 * @returns เบอร์โทรศัพท์หรือ empty string
 */
export const getPopulatedPatientPhone = (patientRef: any): string => {
  if (typeof patientRef === 'string') return '';
  if (patientRef && typeof patientRef === 'object' && patientRef.phone) return patientRef.phone;
  return '';
};

/**
 * ดึงอีเมลของผู้ป่วยจาก populated patient object
 * @param patientRef - populated patient reference
 * @returns อีเมลหรือ undefined
 */
export const getPopulatedPatientEmail = (patientRef: any): string | undefined => {
  if (typeof patientRef === 'string') return undefined;
  if (patientRef && typeof patientRef === 'object' && patientRef.email) return patientRef.email;
  return undefined;
};

/**
 * ดึงชื่อผู้ใช้จาก populated user object
 * @param userRef - populated user reference
 * @returns ชื่อผู้ใช้หรือข้อความ default
 */
export const getPopulatedUserName = (userRef: any): string => {
  if (typeof userRef === 'string') return 'ไม่ระบุผู้ใช้';
  if (userRef && typeof userRef === 'object') {
    if (userRef.fullName) return userRef.fullName;
    if (userRef.userName) return userRef.userName;
    if (userRef.firstName && userRef.lastName) return `${userRef.firstName} ${userRef.lastName}`;
  }
  return 'ไม่ระบุผู้ใช้';
};

/**
 * ดึงข้อมูลสำคัญจาก populated clinic object
 * @param clinicRef - populated clinic reference
 * @returns object ที่มี id และ name
 */
export const getPopulatedClinicInfo = (clinicRef: any): { id: string; name: string } => {
  return {
    id: getObjectIdString(clinicRef),
    name: getPopulatedName(clinicRef, 'ไม่ระบุคลินิก')
  };
};

/**
 * ดึงข้อมูลสำคัญจาก populated branch object
 * @param branchRef - populated branch reference
 * @returns object ที่มี id และ name
 */
export const getPopulatedBranchInfo = (branchRef: any): { id: string; name: string } => {
  return {
    id: getObjectIdString(branchRef),
    name: getPopulatedName(branchRef, 'ไม่ระบุสาขา')
  };
};

/**
 * ดึงข้อมูลสำคัญจาก populated doctor object
 * @param doctorRef - populated doctor reference
 * @returns object ที่มี id, name และ specialty
 */
export const getPopulatedDoctorInfo = (doctorRef: any): { id: string; name: string; specialty: string } => {
  return {
    id: getObjectIdString(doctorRef),
    name: getPopulatedDoctorName(doctorRef),
    specialty: getPopulatedDoctorSpecialty(doctorRef)
  };
};

/**
 * ดึงข้อมูลสำคัญจาก populated user object (สำหรับ createdBy, updatedBy)
 * @param userRef - populated user reference
 * @returns object ที่มี id และ name หรือ undefined
 */
export const getPopulatedUserInfo = (userRef: any): { id: string; name: string } | undefined => {
  if (!userRef) return undefined;
  return {
    id: getObjectIdString(userRef),
    name: getPopulatedUserName(userRef)
  };
};

// ===== Patient & Multilingual Helper Functions =====

/**
 * Interface สำหรับข้อมูลหลายภาษา
 */
export interface IMultilingualText {
  th: string;
  en?: string;
}

/**
 * ดึงค่าจากข้อมูลหลายภาษาตามภาษาที่ระบุ
 * @param multilingualText - ข้อมูลหลายภาษา
 * @param lang - ภาษาที่ต้องการ ('th' หรือ 'en')
 * @returns ค่าตามภาษาที่ระบุ
 */
export const getMultilingualValue = (multilingualText: IMultilingualText | undefined, lang = 'th'): string => {
  if (!multilingualText) return '';

  if (lang === 'en' && multilingualText.en) {
    return multilingualText.en;
  }
  return multilingualText.th;
};

/**
 * คำนวณอายุจากวันเกิด
 * @param dateOfBirth - วันเกิด
 * @returns อายุเป็นปี
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * ดึงข้อมูลแพทย์สำหรับ Patient response
 * @param doctorRef - populated doctor reference
 * @returns object ที่มี id และ name หรือ undefined
 */
export const getPopulatedDoctorForPatient = (doctorRef: any): { id: string; name: string } | undefined => {
  if (!doctorRef) return undefined;
  if (typeof doctorRef === 'string') return undefined;

  if (doctorRef && typeof doctorRef === 'object') {
    const id = getObjectIdString(doctorRef);
    let name = '';

    if (doctorRef.name) {
      name = doctorRef.name;
    } else if (doctorRef.firstNameTh && doctorRef.lastNameTh) {
      name = `${doctorRef.firstNameTh} ${doctorRef.lastNameTh}`;
    } else if (doctorRef.firstName && doctorRef.lastName) {
      name = `${doctorRef.firstName} ${doctorRef.lastName}`;
    } else {
      name = 'ไม่ระบุชื่อแพทย์';
    }

    return { id, name };
  }

  return undefined;
};

/**
 * สร้างชื่อเต็มจากข้อมูลหลายภาษา
 * @param titlePrefix - คำนำหน้า
 * @param firstName - ชื่อ
 * @param lastName - นามสกุล
 * @param lang - ภาษา ('th' หรือ 'en')
 * @returns ชื่อเต็ม
 */
export const createMultilingualFullName = (
  // titlePrefix: IMultilingualText,
  firstName: IMultilingualText,
  lastName: IMultilingualText,
  lang = 'th'
): string => {
  // const prefix = getMultilingualValue(titlePrefix, lang);
  const first = getMultilingualValue(firstName, lang);
  const last = getMultilingualValue(lastName, lang);

  // if (lang === 'en' && firstName.en && lastName.en) {
  //   return `${prefix ? prefix + ' ' : ''}${first} ${last}`.trim();
  // }

  // ภาษาไทย - คำนำหน้าติดกับชื่อ
  return `${first} ${last}`;
};