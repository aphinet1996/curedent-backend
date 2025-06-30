import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { PatientOptions } from '../models/patient-options.model';
import {
    IPatientDropdownOptions,
    IPatientOptionsDocument,
    IMultilingualOption,
    PatientOptionCategory
} from '../types/patient.types';

export class PatientOptionsService {

    /**
     * ดึงตัวเลือก dropdown ทั้งหมดสำหรับคลินิก
     */
    async getDropdownOptions(clinicId: string): Promise<IPatientDropdownOptions> {
        try {
            // ดึงข้อมูลจากฐานข้อมูล
            const options = await PatientOptions.find({
                $or: [
                    { clinicId, isActive: true },
                    { isDefault: true, isActive: true }
                ]
            }).sort({ category: 1, isDefault: 1 });

            // จัดกลุ่มตามประเภท
            const groupedOptions = this.groupOptionsByCategory(options);

            // ถ้าไม่มีข้อมูลในฐานข้อมูล ให้สร้างข้อมูลเริ่มต้น
            if (options.length === 0) {
                await this.createDefaultOptions();
                return this.getDefaultDropdownOptions();
            }

            return {
                nationalities: groupedOptions.nationality || [],
                titlePrefixes: groupedOptions.titlePrefix || [],
                genders: groupedOptions.gender || [],
                patientTypes: groupedOptions.patientType || [],
                bloodGroups: groupedOptions.bloodGroup || [],
                occupations: groupedOptions.occupation || [],
                medicalRights: groupedOptions.medicalRight || [],
                maritalStatuses: groupedOptions.maritalStatus || [],
                referralSources: groupedOptions.referralSource || [],
            };
        } catch (error) {
            logger.error(`Error getting dropdown options: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงตัวเลือก dropdown', 500);
        }
    }

    /**
     * ดึงตัวเลือกตามประเภท
     */
    async getOptionsByCategory(clinicId: string, category: PatientOptionCategory): Promise<IMultilingualOption[]> {
        try {
            // Validate category
            const validCategories: PatientOptionCategory[] = [
                'nationality', 'titlePrefix', 'gender', 'patientType',
                'bloodGroup', 'occupation', 'medicalRight', 'maritalStatus', 'referralSource'
            ];

            if (!validCategories.includes(category)) {
                throw new AppError('ประเภทตัวเลือกไม่ถูกต้อง', 400);
            }

            // ดึงข้อมูลทั้งแบบเฉพาะคลินิกและ default
            const options = await PatientOptions.find({
                $or: [
                    { clinicId, category, isActive: true },     // ตัวเลือกเฉพาะคลินิก
                    { isDefault: true, category, isActive: true } // ตัวเลือก default
                ]
            }).sort({ isDefault: 1 }); // เรียงให้ของคลินิกมาก่อน (isDefault: false = 0)

            const allValues: IMultilingualOption[] = [];

            options.forEach(option => {
                if (option.values && Array.isArray(option.values)) {
                    allValues.push(...option.values);
                }
            });

            // ลบค่าซ้ำตามภาษาไทย (ใช้เป็น key หลัก)
            const uniqueValues = this.removeDuplicateOptions(allValues);

            return uniqueValues;

        } catch (error) {
            logger.error(`Error getting options by category: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงตัวเลือกตามประเภท', 500);
        }
    }

    /**
     * อัปเดตตัวเลือกของคลินิก
     */
    async updateOptionsForClinic(
        clinicId: string,
        category: PatientOptionCategory,
        values: IMultilingualOption[]
    ): Promise<IPatientOptionsDocument> {
        try {
            // Validate และ clean up values
            const cleanedValues = this.validateAndCleanOptions(values);

            const updatedOption = await PatientOptions.findOneAndUpdate(
                { clinicId, category },
                {
                    clinicId,
                    category,
                    values: cleanedValues,
                    isActive: true,
                    isDefault: false
                },
                {
                    new: true,
                    upsert: true
                }
            );

            return updatedOption!;
        } catch (error) {
            logger.error(`Error updating options for clinic: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตตัวเลือก', 500);
        }
    }

    /**
     * เพิ่มตัวเลือกใหม่
     */
    async addOptionValue(clinicId: string, category: PatientOptionCategory, value: IMultilingualOption): Promise<IPatientOptionsDocument> {
        try {
            // Validate option
            const cleanedValue = this.validateAndCleanOption(value);

            const option = await PatientOptions.findOne({ clinicId, category });

            if (option) {
                // ตรวจสอบว่ามีค่าซ้ำหรือไม่ (เฉพาะภาษาไทย)
                const existingThValues = option.values.map(v => v.th.toLowerCase().trim());
                if (!existingThValues.includes(cleanedValue.th.toLowerCase().trim())) {
                    option.values.push(cleanedValue);
                    await option.save();
                }
                return option;
            } else {
                return await PatientOptions.create({
                    clinicId,
                    category,
                    values: [cleanedValue],
                    isActive: true,
                    isDefault: false
                });
            }
        } catch (error) {
            logger.error(`Error adding option value: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการเพิ่มตัวเลือก', 500);
        }
    }

    /**
     * ลบตัวเลือก
     */
    async removeOptionValue(clinicId: string, category: PatientOptionCategory, thValue: string): Promise<IPatientOptionsDocument | null> {
        try {
            const option = await PatientOptions.findOne({ clinicId, category });

            if (option) {
                option.values = option.values.filter(v => v.th.toLowerCase().trim() !== thValue.toLowerCase().trim());
                await option.save();
                return option;
            }

            return null;
        } catch (error) {
            logger.error(`Error removing option value: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการลบตัวเลือก', 500);
        }
    }

    /**
     * สร้างข้อมูลเริ่มต้นของระบบ
     */
    async createDefaultOptions(): Promise<void> {
        try {
            const defaultOptions = [
                {
                    category: 'nationality',
                    values: [
                        { th: 'ไทย', en: 'Thai' },
                        { th: 'พม่า', en: 'Myanmar' },
                        { th: 'ลาว', en: 'Lao' },
                        { th: 'กัมพูชา', en: 'Cambodian' },
                        { th: 'เวียดนาม', en: 'Vietnamese' },
                        { th: 'จีน', en: 'Chinese' },
                        { th: 'อินเดีย', en: 'Indian' },
                        { th: 'ญี่ปุ่น', en: 'Japanese' },
                        { th: 'เกาหลี', en: 'Korean' },
                        { th: 'สิงคโปร์', en: 'Singaporean' },
                        { th: 'มาเลเซีย', en: 'Malaysian' },
                        { th: 'อินโดนีเซีย', en: 'Indonesian' },
                        { th: 'ฟิลิปปินส์', en: 'Filipino' },
                        { th: 'อเมริกัน', en: 'American' },
                        { th: 'อังกฤษ', en: 'British' },
                        { th: 'เยอรมัน', en: 'German' },
                        { th: 'ฝรั่งเศส', en: 'French' },
                        { th: 'รัสเซีย', en: 'Russian' },
                        { th: 'ออสเตรเลีย', en: 'Australian' },
                        { th: 'แคนาดา', en: 'Canadian' }
                    ]
                },
                {
                    category: 'titlePrefix',
                    values: [
                        { th: 'นาย', en: 'Mr.' },
                        { th: 'นาง', en: 'Mrs.' },
                        { th: 'นางสาว', en: 'Miss' },
                        { th: 'เด็กชาย', en: 'Master' },
                        { th: 'เด็กหญิง', en: 'Miss' },
                        { th: 'ดร.', en: 'Dr.' }
                    ]
                },
                {
                    category: 'gender',
                    values: [
                        { th: 'ชาย', en: 'Male' },
                        { th: 'หญิง', en: 'Female' },
                        { th: 'ไม่ระบุ', en: 'Not Specified' }
                    ]
                },
                {
                    category: 'patientType',
                    values: [
                        { th: 'ผู้ป่วยทั่วไป', en: 'General Patient' },
                        { th: 'ผู้ป่วยประกัน', en: 'Insurance Patient' },
                        { th: 'ผู้ป่วย VIP', en: 'VIP Patient' },
                        { th: 'ผู้ป่วยพนักงาน', en: 'Employee Patient' },
                        { th: 'ผู้ป่วยต่างชาติ', en: 'Foreign Patient' }
                    ]
                },
                {
                    category: 'bloodGroup',
                    values: [
                        { th: 'A', en: 'A' },
                        { th: 'B', en: 'B' },
                        { th: 'AB', en: 'AB' },
                        { th: 'O', en: 'O' },
                        { th: 'A+', en: 'A+' },
                        { th: 'A-', en: 'A-' },
                        { th: 'B+', en: 'B+' },
                        { th: 'B-', en: 'B-' },
                        { th: 'AB+', en: 'AB+' },
                        { th: 'AB-', en: 'AB-' },
                        { th: 'O+', en: 'O+' },
                        { th: 'O-', en: 'O-' },
                        { th: 'ไม่ทราบ', en: 'Unknown' }
                    ]
                },
                {
                    category: 'occupation',
                    values: [
                        { th: 'รับราชการ', en: 'Government Officer' },
                        { th: 'พนักงานเอกชน', en: 'Private Employee' },
                        { th: 'ค้าขาย', en: 'Merchant' },
                        { th: 'เกษตรกร', en: 'Farmer' },
                        { th: 'รับจ้าง', en: 'Laborer' },
                        { th: 'ธุรกิจส่วนตัว', en: 'Self-employed' },
                        { th: 'นักเรียน', en: 'Student' },
                        { th: 'นักศึกษา', en: 'University Student' },
                        { th: 'ว่างงาน', en: 'Unemployed' },
                        { th: 'เกษียณ', en: 'Retired' },
                        { th: 'แม่บ้าน', en: 'Housewife' },
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                },
                {
                    category: 'medicalRight',
                    values: [
                        { th: 'เงินสด', en: 'Cash' },
                        { th: 'ประกันสังคม', en: 'Social Security' },
                        { th: 'ข้าราชการ', en: 'Civil Servant' },
                        { th: 'รัฐวิสาหกิจ', en: 'State Enterprise' },
                        { th: 'ประกันชีวิต', en: 'Life Insurance' },
                        { th: 'บัตรทอง', en: 'Gold Card' },
                        { th: 'บัตรประกันสุขภาพ', en: 'Health Insurance Card' },
                        { th: '30 บาท', en: '30 Baht Scheme' },
                        { th: 'UC', en: 'Universal Coverage' },
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                },
                {
                    category: 'maritalStatus',
                    values: [
                        { th: 'โสด', en: 'Single' },
                        { th: 'สมรส', en: 'Married' },
                        { th: 'หย่าร้าง', en: 'Divorced' },
                        { th: 'หม้าย', en: 'Widowed' },
                        { th: 'แยกกันอยู่', en: 'Separated' },
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                },
                {
                    category: 'referralSource',
                    values: [
                        { th: 'มาเอง', en: 'Walk-in' },
                        { th: 'ญาติแนะนำ', en: 'Family Referral' },
                        { th: 'เพื่อนแนะนำ', en: 'Friend Referral' },
                        { th: 'อินเทอร์เน็ต', en: 'Internet' },
                        { th: 'โซเชียลมีเดีย', en: 'Social Media' },
                        { th: 'โฆษณา', en: 'Advertisement' },
                        { th: 'แพทย์ส่งต่อ', en: 'Doctor Referral' },
                        { th: 'โรงพยาบาลส่งต่อ', en: 'Hospital Referral' },
                        { th: 'พนักงานแนะนำ', en: 'Staff Referral' },
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                }
            ];

            // สร้างข้อมูลเริ่มต้นถ้ายังไม่มี
            for (const option of defaultOptions) {
                const existing = await PatientOptions.findOne({
                    category: option.category,
                    isDefault: true
                });

                if (!existing) {
                    await PatientOptions.create({
                        category: option.category,
                        values: option.values,
                        isActive: true,
                        isDefault: true
                        // ไม่ต้องระบุ clinicId สำหรับ default options
                    });
                    console.log(`✅ Created default options for: ${option.category}`);
                } else {
                    console.log(`ℹ️ Default options for ${option.category} already exist`);
                }
            }
        } catch (error) {
            logger.error(`Error creating default options: ${error}`);

            // Handle specific MongoDB errors
            if ((error as any).code === 11000) {
                logger.warn('Some default options already exist, continuing...');
            } else {
                throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูลเริ่มต้น', 500);
            }
        }
    }

    /**
     * จัดกลุ่มตัวเลือกตามประเภท
     */
    private groupOptionsByCategory(options: IPatientOptionsDocument[]): Record<string, IMultilingualOption[]> {
        const grouped: Record<string, IMultilingualOption[]> = {};

        for (const option of options) {
            if (!grouped[option.category]) {
                grouped[option.category] = [];
            }

            // รวม values และลบค่าซ้ำ
            const combinedValues = [...grouped[option.category], ...option.values];
            grouped[option.category] = this.removeDuplicateOptions(combinedValues);
        }

        return grouped;
    }

    /**
     * ลบค่าซ้ำในตัวเลือกหลายภาษา (ใช้ภาษาไทยเป็น key)
     */
    private removeDuplicateOptions(options: IMultilingualOption[]): IMultilingualOption[] {
        const seen = new Set<string>();
        return options.filter(option => {
            const key = option.th.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Validate และ clean up ตัวเลือกหลายภาษา
     */
    private validateAndCleanOptions(options: IMultilingualOption[]): IMultilingualOption[] {
        return options
            .map(option => this.validateAndCleanOption(option))
            .filter(option => option.th.length > 0); // กรองตัวเลือกที่มีภาษาไทย
    }

    /**
     * Validate และ clean up ตัวเลือกหลายภาษาตัวเดียว
     */
    private validateAndCleanOption(option: IMultilingualOption): IMultilingualOption {
        if (!option || typeof option !== 'object') {
            throw new AppError('รูปแบบตัวเลือกไม่ถูกต้อง', 400);
        }

        if (!option.th || typeof option.th !== 'string') {
            throw new AppError('กรุณาระบุข้อมูลภาษาไทย', 400);
        }

        return {
            th: option.th.trim(),
            en: option.en ? option.en.trim() : undefined
        };
    }

    /**
     * ค่าเริ่มต้นแบบ hardcode (fallback)
     */
    private getDefaultDropdownOptions(): IPatientDropdownOptions {
        return {
            nationalities: [
                { th: 'ไทย', en: 'Thai' },
                { th: 'พม่า', en: 'Myanmar' },
                { th: 'ลาว', en: 'Lao' },
                { th: 'กัมพูชา', en: 'Cambodian' },
                { th: 'เวียดนาม', en: 'Vietnamese' }
            ],
            titlePrefixes: [
                { th: 'นาย', en: 'Mr.' },
                { th: 'นาง', en: 'Mrs.' },
                { th: 'นางสาว', en: 'Miss' },
                { th: 'ดร.', en: 'Dr.' }
            ],
            genders: [
                { th: 'ชาย', en: 'Male' },
                { th: 'หญิง', en: 'Female' }
            ],
            patientTypes: [
                { th: 'ผู้ป่วยทั่วไป', en: 'General Patient' },
                { th: 'ผู้ป่วย VIP', en: 'VIP Patient' },
                { th: 'ผู้ป่วยต่างชาติ', en: 'Foreign Patient' }
            ],
            bloodGroups: [
                { th: 'A', en: 'A' },
                { th: 'B', en: 'B' },
                { th: 'AB', en: 'AB' },
                { th: 'O', en: 'O' },
                { th: 'ไม่ทราบ', en: 'Unknown' }
            ],
            occupations: [
                { th: 'รับราชการ', en: 'Government Officer' },
                { th: 'พนักงานเอกชน', en: 'Private Employee' },
                { th: 'ค้าขาย', en: 'Merchant' },
                { th: 'นักเรียน', en: 'Student' },
                { th: 'แม่บ้าน', en: 'Housewife' },
                { th: 'อื่นๆ', en: 'Others' }
            ],
            medicalRights: [
                { th: 'เงินสด', en: 'Cash' },
                { th: 'ประกันสังคม', en: 'Social Security' },
                { th: 'บัตรทอง', en: 'Gold Card' },
                { th: 'บัตรประกันสุขภาพ', en: 'Health Insurance Card' },
                { th: 'อื่นๆ', en: 'Others' }
            ],
            maritalStatuses: [
                { th: 'โสด', en: 'Single' },
                { th: 'สมรส', en: 'Married' },
                { th: 'หย่าร้าง', en: 'Divorced' },
                { th: 'หม้าย', en: 'Widowed' },
                { th: 'อื่นๆ', en: 'Others' }
            ],
            referralSources: [
                { th: 'มาเอง', en: 'Walk-in' },
                { th: 'คนรู้จักแนะนำ', en: 'Referral' },
                { th: 'อินเทอร์เน็ต', en: 'Internet' },
                { th: 'โซเชียลมีเดีย', en: 'Social Media' },
                { th: 'โฆษณา', en: 'Advertisement' },
                { th: 'แพทย์ส่งต่อ', en: 'Doctor Referral' },
                { th: 'พนักงานแนะนำ', en: 'Staff Referral' },
                { th: 'อื่นๆ', en: 'Others' }
            ]
        };
    }
}

export default PatientOptionsService;