import { FilterQuery } from 'mongoose';
import { Patient } from '../models/patient.model';
import Branch from '../models/branch.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { PatientOptionsService } from './patient-options.service';
import {
    IPatientDocument,
    CreatePatientInput,
    UpdatePatientInput,
    IPatientDropdownOptions,
} from '../types/patient.types';

export class PatientService {
    private patientOptionsService: PatientOptionsService;

    constructor() {
        this.patientOptionsService = new PatientOptionsService();
    }

    /**
     * ค้นหาผู้ป่วยโดยใช้ ID
     */
    async findById(id: string): Promise<IPatientDocument | null> {
        try {
            return await Patient.findById(id)
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');
        } catch (error) {
            logger.error(`Error finding patient by ID: ${error}`);
            return null;
        }
    }

    /**
     * ค้นหาผู้ป่วยโดยใช้ HN
     */
    async findByHN(hn: string): Promise<IPatientDocument | null> {
        try {
            return await Patient.findOne({ hn: hn.toUpperCase(), isActive: true })
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');
        } catch (error) {
            logger.error(`Error finding patient by HN: ${error}`);
            return null;
        }
    }

    /**
     * ค้นหาผู้ป่วยโดยใช้เลขบัตรประชาชน
     */
    async findByNationalId(nationalId: string): Promise<IPatientDocument | null> {
        try {
            return await Patient.findOne({ nationalId, isActive: true })
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');
        } catch (error) {
            logger.error(`Error finding patient by national ID: ${error}`);
            return null;
        }
    }

    /**
     * ดึงข้อมูลผู้ป่วยทั้งหมดพร้อมเงื่อนไขการค้นหาและการเรียงลำดับ
     */
    async findAll(
        filter: FilterQuery<IPatientDocument> = {},
        sort: Record<string, 1 | -1> = { createdAt: -1 },
        page = 1,
        limit = 10,
        lang = 'th'
    ): Promise<{ patients: IPatientDocument[]; total: number; page: number; totalPages: number }> {
        try {
            // ปรับ sort field ตามภาษา
            const adjustedSort: Record<string, 1 | -1> = {};
            
            Object.keys(sort).forEach(key => {
                if (key === 'firstName') {
                    adjustedSort[`firstName.${lang}`] = sort[key];
                } else if (key === 'lastName') {
                    adjustedSort[`lastName.${lang}`] = sort[key];
                } else {
                    adjustedSort[key] = sort[key];
                }
            });

            // ปรับ filter สำหรับ multilingual fields
            const adjustedFilter = this.adjustFilterForMultilingual(filter, lang);

            const skip = (page - 1) * limit;
            const patients = await Patient.find(adjustedFilter)
                .sort(adjustedSort)
                .skip(skip)
                .limit(limit)
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');

            const total = await Patient.countDocuments(adjustedFilter);
            const totalPages = Math.ceil(total / limit);

            return {
                patients,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            logger.error(`Error finding all patients: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย', 500);
        }
    }

    /**
     * ปรับ filter สำหรับ multilingual fields
     */
    private adjustFilterForMultilingual(filter: any, lang = 'th'): any {
        const adjustedFilter = { ...filter };
        
        // รายการ fields ที่เป็น multilingual
        const multilingualFields = [
            'nationality', 'gender', 'patientType', 'bloodGroup', 
            'occupation', 'medicalRights', 'maritalStatus', 'referralSource'
        ];

        multilingualFields.forEach(field => {
            if (adjustedFilter[field]) {
                // ถ้ามีการ filter ด้วย field ที่เป็น multilingual
                // ให้ค้นหาทั้งภาษาไทยและอังกฤษ
                const searchValue = adjustedFilter[field];
                delete adjustedFilter[field];
                
                adjustedFilter.$or = adjustedFilter.$or || [];
                adjustedFilter.$or.push(
                    { [`${field}.th`]: searchValue },
                    { [`${field}.en`]: searchValue }
                );
            }
        });

        return adjustedFilter;
    }

    /**
     * ค้นหาผู้ป่วยแบบ text search
     */
    async searchPatients(
        searchTerm: string,
        clinicId?: string,
        branchId?: string,
        page = 1,
        limit = 10,
        lang = 'th'
    ): Promise<{ patients: IPatientDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const filter: any = { isActive: true };

            if (clinicId) filter.clinicId = clinicId;
            if (branchId) filter.branchId = branchId;

            if (searchTerm) {
                // ลองค้นหาด้วย HN หรือ National ID ก่อน (exact match)
                const hnMatch = searchTerm.toUpperCase();
                const nationalIdMatch = searchTerm.replace(/\D/g, ''); // เอาตัวเลขอย่างเดียว

                const exactFilter = {
                    ...filter,
                    $or: [
                        { hn: hnMatch },
                        { nationalId: nationalIdMatch },
                        { phone: searchTerm }
                    ]
                };

                const exactPatients = await Patient.find(exactFilter)
                    .populate('branchId', 'name')
                    .populate('clinicId', 'name')
                    .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                    .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh')
                    .limit(limit);

                if (exactPatients.length > 0) {
                    return {
                        patients: exactPatients,
                        total: exactPatients.length,
                        page: 1,
                        totalPages: 1
                    };
                }

                // ถ้าไม่พบ exact match ให้ใช้ text search
                filter.$text = { $search: searchTerm };
            }

            const skip = (page - 1) * limit;
            
            // สร้าง sort order ตามภาษา
            let sortQuery: any;
            if (searchTerm) {
                // สำหรับ text search ให้ใช้ score
                sortQuery = { score: { $meta: 'textScore' }, createdAt: -1 };
            } else {
                // สำหรับการเรียงตามภาษา
                const sortObj: Record<string, 1 | -1> = {};
                sortObj[`firstName.${lang}`] = 1;
                sortObj[`lastName.${lang}`] = 1;
                sortObj.createdAt = -1;
                sortQuery = sortObj;
            }

            const patients = await Patient.find(filter)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                .populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');

            const total = await Patient.countDocuments(filter);
            const totalPages = Math.ceil(total / limit);

            return {
                patients,
                total,
                page,
                totalPages,
            };
        } catch (error) {
            logger.error(`Error searching patients: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ป่วย', 500);
        }
    }

    /**
     * ดึงข้อมูลผู้ป่วยตามสาขา
     */
    async findByBranch(
        branchId: string,
        page = 1,
        limit = 10,
        lang = 'th'
    ): Promise<{ patients: IPatientDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const sortOrder: Record<string, 1 | -1> = {};
            sortOrder[`firstName.${lang}`] = 1;
            sortOrder[`lastName.${lang}`] = 1;
            sortOrder.createdAt = -1;
            
            return await this.findAll({ branchId, isActive: true }, sortOrder, page, limit, lang);
        } catch (error) {
            logger.error(`Error finding patients by branch: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วยตามสาขา', 500);
        }
    }

    /**
     * ดึงข้อมูลผู้ป่วยตามคลินิก
     */
    async findByClinic(
        clinicId: string,
        page = 1,
        limit = 10,
        lang = 'th'
    ): Promise<{ patients: IPatientDocument[]; total: number; page: number; totalPages: number }> {
        try {
            const sortOrder: Record<string, 1 | -1> = {};
            sortOrder[`firstName.${lang}`] = 1;
            sortOrder[`lastName.${lang}`] = 1;
            sortOrder.createdAt = -1;
            
            return await this.findAll({ clinicId, isActive: true }, sortOrder, page, limit, lang);
        } catch (error) {
            logger.error(`Error finding patients by clinic: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วยตามคลินิก', 500);
        }
    }

    /**
     * สร้างผู้ป่วยใหม่
     */
    async createPatient(patientData: CreatePatientInput): Promise<IPatientDocument> {
        try {
            // ตรวจสอบว่า branch มีอยู่จริง
            const branch = await Branch.findById(patientData.branchId);
            if (!branch) {
                throw new AppError('ไม่พบสาขาที่ระบุ', 400);
            }

            // ตรวจสอบว่าเลขบัตรประชาชนซ้ำหรือไม่
            const existingPatientByNationalId = await Patient.findOne({
                nationalId: patientData.nationalId
            });

            if (existingPatientByNationalId) {
                throw new AppError('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว', 400);
            }

            // ตรวจสอบ HN ถ้ามีการระบุมา
            if (patientData.hn) {
                const existingPatientByHN = await Patient.findOne({
                    hn: patientData.hn.toUpperCase()
                });

                if (existingPatientByHN) {
                    throw new AppError('HN นี้มีอยู่ในระบบแล้ว', 400);
                }
            }

            // ประมวลผลข้อมูล multilingual - ให้ default value หากไม่มีข้อมูลภาษาอังกฤษ
            const processedData = this.processMultilingualData(patientData);

            // สร้างผู้ป่วยใหม่
            const newPatient = await Patient.create({
                ...processedData,
                clinicId: branch.clinicId,
                isActive: patientData.isActive !== undefined ? patientData.isActive : true,
            });

            // ดึงข้อมูลพร้อม populate
            const patient = await this.findById(newPatient._id.toString());
            return patient!;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            // Handle MongoDB duplicate key error
            if ((error as any).code === 11000) {
                const field = Object.keys((error as any).keyPattern)[0];
                if (field === 'hn') {
                    throw new AppError('HN นี้มีอยู่ในระบบแล้ว', 400);
                } else if (field === 'nationalId') {
                    throw new AppError('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว', 400);
                }
                throw new AppError('ข้อมูลที่ระบุมีอยู่ในระบบแล้ว', 400);
            }

            logger.error(`Error creating patient: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูลผู้ป่วย', 500);
        }
    }

    /**
     * ประมวลผลข้อมูล multilingual - ให้ default value
     */
    private processMultilingualData(data: any): any {
        const processedData = { ...data };
        
        const multilingualFields = [
            'nationality', 'titlePrefix', 'firstName', 'lastName', 
            'gender', 'patientType', 'bloodGroup', 'occupation', 
            'medicalRights', 'maritalStatus', 'referralSource'
        ];

        multilingualFields.forEach(field => {
            if (processedData[field]) {
                // ถ้าเป็น object แล้วมี th แต่ไม่มี en ให้ใส่ en เป็นค่าว่าง
                if (typeof processedData[field] === 'object' && processedData[field].th) {
                    if (!processedData[field].en) {
                        processedData[field].en = '';
                    }
                }
            }
        });

        return processedData;
    }

    /**
     * อัปเดตข้อมูลผู้ป่วย
     */
    async updatePatient(
        patientId: string,
        updateData: UpdatePatientInput
    ): Promise<IPatientDocument | null> {
        try {
            // ตรวจสอบว่ามีผู้ป่วยนี้หรือไม่
            const patient = await this.findById(patientId);
            if (!patient) {
                throw new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404);
            }

            // ประมวลผลข้อมูล multilingual สำหรับการอัปเดต
            const processedUpdateData = this.processUpdateMultilingualData(updateData);

            // อัปเดตข้อมูลหลายภาษา
            if (processedUpdateData.nationality) {
                Object.assign(patient.nationality, processedUpdateData.nationality);
                delete processedUpdateData.nationality;
            }

            if (processedUpdateData.titlePrefix) {
                Object.assign(patient.titlePrefix, processedUpdateData.titlePrefix);
                delete processedUpdateData.titlePrefix;
            }

            if (processedUpdateData.firstName) {
                Object.assign(patient.firstName, processedUpdateData.firstName);
                delete processedUpdateData.firstName;
            }

            if (processedUpdateData.lastName) {
                Object.assign(patient.lastName, processedUpdateData.lastName);
                delete processedUpdateData.lastName;
            }

            if (processedUpdateData.gender) {
                Object.assign(patient.gender, processedUpdateData.gender);
                delete processedUpdateData.gender;
            }

            if (processedUpdateData.patientType) {
                Object.assign(patient.patientType, processedUpdateData.patientType);
                delete processedUpdateData.patientType;
            }

            if (processedUpdateData.bloodGroup) {
                if (patient.bloodGroup) {
                    Object.assign(patient.bloodGroup, processedUpdateData.bloodGroup);
                } else {
                    patient.bloodGroup = processedUpdateData.bloodGroup as any;
                }
                delete processedUpdateData.bloodGroup;
            }

            if (processedUpdateData.occupation) {
                if (patient.occupation) {
                    Object.assign(patient.occupation, processedUpdateData.occupation);
                } else {
                    patient.occupation = processedUpdateData.occupation as any;
                }
                delete processedUpdateData.occupation;
            }

            if (processedUpdateData.medicalRights) {
                if (patient.medicalRights) {
                    Object.assign(patient.medicalRights, processedUpdateData.medicalRights);
                } else {
                    patient.medicalRights = processedUpdateData.medicalRights as any;
                }
                delete processedUpdateData.medicalRights;
            }

            if (processedUpdateData.maritalStatus) {
                if (patient.maritalStatus) {
                    Object.assign(patient.maritalStatus, processedUpdateData.maritalStatus);
                } else {
                    patient.maritalStatus = processedUpdateData.maritalStatus as any;
                }
                delete processedUpdateData.maritalStatus;
            }

            if (processedUpdateData.referralSource) {
                if (patient.referralSource) {
                    Object.assign(patient.referralSource, processedUpdateData.referralSource);
                } else {
                    patient.referralSource = processedUpdateData.referralSource as any;
                }
                delete processedUpdateData.referralSource;
            }

            // อัปเดตที่อยู่
            if (processedUpdateData.idCardAddress) {
                Object.assign(patient.idCardAddress, processedUpdateData.idCardAddress);
                delete processedUpdateData.idCardAddress;
            }

            if (processedUpdateData.currentAddress) {
                Object.assign(patient.currentAddress, processedUpdateData.currentAddress);
                delete processedUpdateData.currentAddress;
            }

            if (processedUpdateData.medicalInfo) {
                Object.assign(patient.medicalInfo, processedUpdateData.medicalInfo);
                delete processedUpdateData.medicalInfo;
            }

            if (processedUpdateData.emergencyContact) {
                Object.assign(patient.emergencyContact, processedUpdateData.emergencyContact);
                delete processedUpdateData.emergencyContact;
            }

            // อัปเดตข้อมูลอื่นๆ
            Object.assign(patient, processedUpdateData);

            // บันทึกการเปลี่ยนแปลง
            const updatedPatient = await patient.save();

            // ดึงข้อมูลใหม่พร้อม populate
            return await this.findById(updatedPatient._id.toString());
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            // Handle MongoDB duplicate key error
            if ((error as any).code === 11000) {
                const field = Object.keys((error as any).keyPattern)[0];
                if (field === 'nationalId') {
                    throw new AppError('เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว', 400);
                }
            }

            logger.error(`Error updating patient: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ป่วย', 500);
        }
    }

    /**
     * ประมวลผลข้อมูล multilingual สำหรับการอัปเดต
     */
    private processUpdateMultilingualData(data: any): any {
        const processedData = { ...data };
        
        const multilingualFields = [
            'nationality', 'titlePrefix', 'firstName', 'lastName', 
            'gender', 'patientType', 'bloodGroup', 'occupation', 
            'medicalRights', 'maritalStatus', 'referralSource'
        ];

        multilingualFields.forEach(field => {
            if (processedData[field] && typeof processedData[field] === 'object') {
                // ไม่ต้องใส่ default value สำหรับการอัปเดต เพราะอาจจะเป็น partial update
                // แต่ถ้ามีการส่ง en เป็น undefined หรือ null ให้เป็นค่าว่าง
                if (processedData[field].en === undefined || processedData[field].en === null) {
                    processedData[field].en = '';
                }
            }
        });

        return processedData;
    }

    /**
     * เปลี่ยนสถานะการใช้งานผู้ป่วย (soft delete)
     */
    async updatePatientActiveStatus(patientId: string, isActive: boolean): Promise<IPatientDocument | null> {
        try {
            const patient = await this.findById(patientId);
            if (!patient) {
                throw new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404);
            }

            const updatedPatient = await Patient.findByIdAndUpdate(
                patientId,
                { $set: { isActive } },
                { new: true }
            ).populate('branchId', 'name')
                .populate('clinicId', 'name')
                .populate('medicalInfo.assistantDoctorId', 'firstNameTh lastNameTh')
                .populate('medicalInfo.primaryDoctorId', 'firstNameTh lastNameTh');

            return updatedPatient;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Error updating patient active status: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ป่วย', 500);
        }
    }

    /**
     * ลบผู้ป่วย (hard delete - ใช้ระวัง)
     */
    async deletePatient(patientId: string): Promise<boolean> {
        try {
            const patient = await this.findById(patientId);
            if (!patient) {
                throw new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404);
            }

            // TODO: ตรวจสอบว่ามีการใช้งานผู้ป่วยนี้ในระบบอื่นๆ หรือไม่
            // เช่น ในการนัดหมาย, ใบเสร็จ, ประวัติการรักษา

            await Patient.findByIdAndDelete(patientId);
            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Error deleting patient: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการลบข้อมูลผู้ป่วย', 500);
        }
    }

    /**
     * ดึงสถิติผู้ป่วย
     */
    async getPatientStats(clinicId?: string, branchId?: string): Promise<{
        totalPatients: number;
        activePatients: number;
        inactivePatients: number;
        todayRegistrations: number;
        thisMonthRegistrations: number;
        genderDistribution: { male: number; female: number; other: number };
        ageDistribution: {
            child: number; // 0-17
            adult: number; // 18-59
            elderly: number; // 60+
        };
    }> {
        try {
            const filter: any = {};
            if (clinicId) filter.clinicId = clinicId;
            if (branchId) filter.branchId = branchId;

            // วันนี้
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // เดือนนี้
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

            const [
                totalPatients,
                activePatients,
                todayRegistrations,
                thisMonthRegistrations,
                genderDistribution,
                allPatients
            ] = await Promise.all([
                Patient.countDocuments(filter),
                Patient.countDocuments({ ...filter, isActive: true }),
                Patient.countDocuments({
                    ...filter,
                    createdAt: { $gte: today, $lt: tomorrow }
                }),
                Patient.countDocuments({
                    ...filter,
                    createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
                }),
                // ปรับการนับ gender distribution สำหรับ multilingual
                Patient.aggregate([
                    { $match: { ...filter, isActive: true } },
                    { 
                        $group: { 
                            _id: { 
                                th: '$gender.th', 
                                en: '$gender.en' 
                            }, 
                            count: { $sum: 1 } 
                        } 
                    }
                ]),
                Patient.find({ ...filter, isActive: true }, 'dateOfBirth').lean()
            ]);

            // คำนวณการกระจายของเพศ - ปรับสำหรับ multilingual
            const genderStats = { male: 0, female: 0, other: 0 };
            genderDistribution.forEach((item: any) => {
                const genderTh = item._id.th?.toLowerCase() || '';
                const genderEn = item._id.en?.toLowerCase() || '';
                
                if (genderTh.includes('ชาย') || genderEn.includes('male') || genderEn.includes('man')) {
                    genderStats.male += item.count;
                } else if (genderTh.includes('หญิง') || genderEn.includes('female') || genderEn.includes('woman')) {
                    genderStats.female += item.count;
                } else {
                    genderStats.other += item.count;
                }
            });

            // คำนวณการกระจายของอายุ
            const ageStats = { child: 0, adult: 0, elderly: 0 };
            allPatients.forEach((patient: any) => {
                const age = calculateAge(patient.dateOfBirth);
                if (age < 18) {
                    ageStats.child++;
                } else if (age < 60) {
                    ageStats.adult++;
                } else {
                    ageStats.elderly++;
                }
            });

            return {
                totalPatients,
                activePatients,
                inactivePatients: totalPatients - activePatients,
                todayRegistrations,
                thisMonthRegistrations,
                genderDistribution: genderStats,
                ageDistribution: ageStats,
            };
        } catch (error) {
            logger.error(`Error getting patient stats: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงสถิติผู้ป่วย', 500);
        }
    }

    /**
     * ดึง dropdown options ตามคลินิก
     */
    async getDropdownOptions(clinicId: string): Promise<IPatientDropdownOptions> {
        try {
          return await this.patientOptionsService.getDropdownOptions(clinicId);
        } catch (error) {
          logger.error(`Error getting dropdown options: ${error}`);
          throw new AppError('เกิดข้อผิดพลาดในการดึงตัวเลือก dropdown', 500);
        }
      }
}

// Helper function สำหรับคำนวณอายุ
function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

export default PatientService;