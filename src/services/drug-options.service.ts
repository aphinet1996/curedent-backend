// services/drug-options.service.ts
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { DrugOptions } from '../models/drug-options.model';
import {
    IDrugDropdownOptions,
    IDrugOptionsDocument,
    DrugOptionCategory
} from '../types/drug.types';
import { IMultilingualOption } from '../types/patient.types';

export class DrugOptionsService {

    /**
     * ดึงตัวเลือก dropdown ทั้งหมดสำหรับคลินิก
     */
    async getDropdownOptions(clinicId: string, branchId?: string): Promise<IDrugDropdownOptions> {
        try {
            // ดึงข้อมูลจากฐานข้อมูล
            const query: any = {
                $or: [
                    { clinicId, isActive: true },
                    { isDefault: true, isActive: true }
                ]
            };

            // ถ้ามี branchId ให้รวมข้อมูลของสาขาด้วย
            if (branchId) {
                query.$or.push({ clinicId, branchId, isActive: true });
            }

            const options = await DrugOptions.find(query)
                .sort({ category: 1, isDefault: 1 });

            // จัดกลุ่มตามประเภท
            const groupedOptions = this.groupOptionsByCategory(options);

            // ถ้าไม่มีข้อมูลในฐานข้อมูล ให้สร้างข้อมูลเริ่มต้น
            if (options.length === 0) {
                await this.createDefaultOptions();
                return this.getDefaultDropdownOptions();
            }

            return {
                drugCategories: groupedOptions.drugCategory || [],
                drugSubcategories: groupedOptions.drugSubcategory || [],
                units: groupedOptions.unit || [],
                dosageMethods: groupedOptions.dosageMethod || [],
                dosageTimes: groupedOptions.dosageTime || []
            };
        } catch (error) {
            logger.error(`Error getting drug dropdown options: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงตัวเลือก dropdown ยา', 500);
        }
    }

    /**
     * ดึงตัวเลือกตามประเภท
     */
    async getOptionsByCategory(
        clinicId: string, 
        category: DrugOptionCategory, 
        branchId?: string
    ): Promise<IMultilingualOption[]> {
        try {
            // Validate category
            const validCategories: DrugOptionCategory[] = [
                'drugCategory', 'drugSubcategory', 'unit', 'dosageMethod', 'dosageTime'
            ];

            if (!validCategories.includes(category)) {
                throw new AppError('ประเภทตัวเลือกยาไม่ถูกต้อง', 400);
            }

            // ดึงข้อมูลทั้งแบบเฉพาะคลินิก, สาขา และ default
            const query: any = {
                $or: [
                    { clinicId, category, isActive: true },
                    { isDefault: true, category, isActive: true }
                ]
            };

            if (branchId) {
                query.$or.push({ clinicId, branchId, category, isActive: true });
            }

            const options = await DrugOptions.find(query)
                .sort({ isDefault: 1 });

            const allValues: IMultilingualOption[] = [];

            options.forEach(option => {
                if (option.values && Array.isArray(option.values)) {
                    allValues.push(...option.values);
                }
            });

            const uniqueValues = this.removeDuplicateOptions(allValues);

            return uniqueValues;

        } catch (error) {
            logger.error(`Error getting drug options by category: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงตัวเลือกยาตามประเภท', 500);
        }
    }

    /**
     * อัปเดตตัวเลือกของคลินิก/สาขา
     */
    async updateOptionsForClinic(
        clinicId: string,
        category: DrugOptionCategory,
        values: IMultilingualOption[],
        branchId?: string
    ): Promise<IDrugOptionsDocument> {
        try {
            // Validate และ clean up values
            const cleanedValues = this.validateAndCleanOptions(values);

            const filter: any = { clinicId, category };
            if (branchId) {
                filter.branchId = branchId;
            }

            const updatedOption = await DrugOptions.findOneAndUpdate(
                filter,
                {
                    clinicId,
                    branchId,
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
            logger.error(`Error updating drug options for clinic: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตตัวเลือกยา', 500);
        }
    }

    /**
     * เพิ่มตัวเลือกใหม่
     */
    async addOptionValue(
        clinicId: string, 
        category: DrugOptionCategory, 
        value: IMultilingualOption,
        branchId?: string
    ): Promise<IDrugOptionsDocument> {
        try {
            // Validate option
            const cleanedValue = this.validateAndCleanOption(value);

            const filter: any = { clinicId, category };
            if (branchId) {
                filter.branchId = branchId;
            }

            const option = await DrugOptions.findOne(filter);

            if (option) {
                // ตรวจสอบว่ามีค่าซ้ำหรือไม่ (เฉพาะภาษาไทย)
                const existingThValues = option.values.map(v => v.th.toLowerCase().trim());
                if (!existingThValues.includes(cleanedValue.th.toLowerCase().trim())) {
                    option.values.push(cleanedValue);
                    await option.save();
                }
                return option;
            } else {
                return await DrugOptions.create({
                    clinicId,
                    branchId,
                    category,
                    values: [cleanedValue],
                    isActive: true,
                    isDefault: false
                });
            }
        } catch (error) {
            logger.error(`Error adding drug option value: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการเพิ่มตัวเลือกยา', 500);
        }
    }

    /**
     * ลบตัวเลือก
     */
    async removeOptionValue(
        clinicId: string, 
        category: DrugOptionCategory, 
        thValue: string,
        branchId?: string
    ): Promise<IDrugOptionsDocument | null> {
        try {
            const filter: any = { clinicId, category };
            if (branchId) {
                filter.branchId = branchId;
            }

            const option = await DrugOptions.findOne(filter);

            if (option) {
                option.values = option.values.filter(v => 
                    v.th.toLowerCase().trim() !== thValue.toLowerCase().trim()
                );
                await option.save();
                return option;
            }

            return null;
        } catch (error) {
            logger.error(`Error removing drug option value: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการลบตัวเลือกยา', 500);
        }
    }

    /**
     * สร้างข้อมูลเริ่มต้นของระบบ
     */
    async createDefaultOptions(): Promise<void> {
        try {
            const defaultOptions = [
                {
                    category: 'drugCategory',
                    values: [
                        { th: 'ยาแก้ปวด', en: 'Analgesics' },
                        { th: 'ยาปฏิชีวนะ', en: 'Antibiotics' },
                        { th: 'ยาลดไข้', en: 'Antipyretics' },
                        { th: 'ยาแก้ไอ', en: 'Antitussives' },
                        { th: 'ยาแก้แพ้', en: 'Antihistamines' },
                        { th: 'ยาสำหรับทางเดินหายใจ', en: 'Respiratory Drugs' },
                        { th: 'ยาสำหรับระบบหัวใจและหลอดเลือด', en: 'Cardiovascular Drugs' },
                        { th: 'ยาสำหรับระบบทางเดินอาหาร', en: 'Gastrointestinal Drugs' },
                        { th: 'ยาสำหรับผิวหนัง', en: 'Dermatological Drugs' },
                        { th: 'ยาเสริมอาหาร', en: 'Nutritional Supplements' },
                        { th: 'ยาสำหรับตา', en: 'Ophthalmic Drugs' },
                        { th: 'ยาสำหรับหู', en: 'Otic Drugs' },
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                },
                {
                    category: 'drugSubcategory',
                    values: [
                        // ยาแก้ปวด
                        { th: 'ยาแก้ปวดทั่วไป', en: 'General Analgesics' },
                        { th: 'ยาแก้ปวดกล้ามเนื้อ', en: 'Muscle Pain Relief' },
                        { th: 'ยาแก้ปวดข้อ', en: 'Joint Pain Relief' },
                        
                        // ยาปฏิชีวนะ
                        { th: 'เพนิซิลลิน', en: 'Penicillins' },
                        { th: 'เซฟาโลสปอริน', en: 'Cephalosporins' },
                        { th: 'แมโครไลด์', en: 'Macrolides' },
                        { th: 'ฟลูออโรควิโนโลน', en: 'Fluoroquinolones' },
                        
                        // ยาสำหรับทางเดินหายใจ
                        { th: 'ยาขยายหลอดลม', en: 'Bronchodilators' },
                        { th: 'ยาลดเสมหะ', en: 'Expectorants' },
                        { th: 'ยาพ่นจมูก', en: 'Nasal Sprays' },
                        
                        { th: 'อื่นๆ', en: 'Others' }
                    ]
                },
                {
                    category: 'unit',
                    values: [
                        { th: 'เม็ด', en: 'Tablet' },
                        { th: 'แคปซูล', en: 'Capsule' },
                        { th: 'ช้อนชา', en: 'Teaspoon' },
                        { th: 'ช้อนโต๊ะ', en: 'Tablespoon' },
                        { th: 'หยด', en: 'Drop' },
                        { th: 'แก้ว', en: 'Glass' },
                        { th: 'ซอง', en: 'Sachet' },
                        { th: 'หลอด', en: 'Tube' },
                        { th: 'ขวด', en: 'Bottle' },
                        { th: 'แผง', en: 'Blister Pack' },
                        { th: 'มิลลิลิตร', en: 'Milliliter' },
                        { th: 'มิลลิกรัม', en: 'Milligram' },
                        { th: 'กรัม', en: 'Gram' },
                        { th: 'พัฟ', en: 'Puff' },
                        { th: 'ครั้ง', en: 'Time' }
                    ]
                },
                {
                    category: 'dosageMethod',
                    values: [
                        { th: 'รับประทาน', en: 'Oral' },
                        { th: 'เคี้ยว', en: 'Chew' },
                        { th: 'อมใต้ลิ้น', en: 'Sublingual' },
                        { th: 'ทาภายนอก', en: 'Topical Application' },
                        { th: 'หยอดตา', en: 'Eye Drops' },
                        { th: 'หยอดหู', en: 'Ear Drops' },
                        { th: 'หยอดจมูก', en: 'Nasal Drops' },
                        { th: 'พ่นจมูก', en: 'Nasal Spray' },
                        { th: 'สูดดม', en: 'Inhalation' },
                        { th: 'แบบปากเป่า', en: 'Inhaler' },
                        { th: 'ใส่ทวารหนัก', en: 'Suppository' },
                        { th: 'ฉีดเข้าเส้นเลือด', en: 'Intravenous' },
                        { th: 'ฉีดเข้ากล้ามเนื้อ', en: 'Intramuscular' },
                        { th: 'ฉีดใต้ผิวหนัง', en: 'Subcutaneous' },
                        { th: 'แผลหนัง', en: 'Patch' }
                    ]
                },
                {
                    category: 'dosageTime',
                    values: [
                        { th: 'ก่อนอาหาร', en: 'Before Meals' },
                        { th: 'หลังอาหาร', en: 'After Meals' },
                        { th: 'พร้อมอาหาร', en: 'With Meals' },
                        { th: 'ก่อนนอน', en: 'Before Bedtime' },
                        { th: 'ตื่นนอน', en: 'Upon Waking' },
                        { th: 'ท้องว่าง', en: 'On Empty Stomach' },
                        { th: 'เมื่อมีอาการ', en: 'As Needed' },
                        { th: 'ทุก 4 ชั่วโมง', en: 'Every 4 Hours' },
                        { th: 'ทุก 6 ชั่วโมง', en: 'Every 6 Hours' },
                        { th: 'ทุก 8 ชั่วโมง', en: 'Every 8 Hours' },
                        { th: 'ทุก 12 ชั่วโมง', en: 'Every 12 Hours' },
                        { th: 'วันละครั้ง', en: 'Once Daily' },
                        { th: 'วันละ 2 ครั้ง', en: 'Twice Daily' },
                        { th: 'วันละ 3 ครั้ง', en: 'Three Times Daily' },
                        { th: 'วันละ 4 ครั้ง', en: 'Four Times Daily' },
                        { th: 'สัปดาห์ละครั้ง', en: 'Once Weekly' },
                        { th: 'เดือนละครั้ง', en: 'Once Monthly' }
                    ]
                }
            ];

            // สร้างข้อมูลเริ่มต้นถ้ายังไม่มี
            for (const option of defaultOptions) {
                const existing = await DrugOptions.findOne({
                    category: option.category,
                    isDefault: true
                });

                if (!existing) {
                    await DrugOptions.create({
                        category: option.category,
                        values: option.values,
                        isActive: true,
                        isDefault: true
                        // ไม่ต้องระบุ clinicId สำหรับ default options
                    });
                    console.log(`✅ Created default drug options for: ${option.category}`);
                } else {
                    console.log(`ℹ️ Default drug options for ${option.category} already exist`);
                }
            }
        } catch (error) {
            logger.error(`Error creating default drug options: ${error}`);

            // Handle specific MongoDB errors
            if ((error as any).code === 11000) {
                logger.warn('Some default drug options already exist, continuing...');
            } else {
                throw new AppError('เกิดข้อผิดพลาดในการสร้างข้อมูลเริ่มต้นยา', 500);
            }
        }
    }

    /**
     * จัดกลุ่มตัวเลือกตามประเภท
     */
    private groupOptionsByCategory(options: IDrugOptionsDocument[]): Record<string, IMultilingualOption[]> {
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
            throw new AppError('รูปแบบตัวเลือกยาไม่ถูกต้อง', 400);
        }

        if (!option.th || typeof option.th !== 'string') {
            throw new AppError('กรุณาระบุข้อมูลภาษาไทยสำหรับตัวเลือกยา', 400);
        }

        return {
            th: option.th.trim(),
            en: option.en ? option.en.trim() : undefined
        };
    }

    /**
     * ค่าเริ่มต้นแบบ hardcode (fallback)
     */
    private getDefaultDropdownOptions(): IDrugDropdownOptions {
        return {
            drugCategories: [
                { th: 'ยาแก้ปวด', en: 'Analgesics' },
                { th: 'ยาปฏิชีวนะ', en: 'Antibiotics' },
                { th: 'ยาลดไข้', en: 'Antipyretics' },
                { th: 'ยาแก้ไอ', en: 'Antitussives' },
                { th: 'อื่นๆ', en: 'Others' }
            ],
            drugSubcategories: [
                { th: 'ยาแก้ปวดทั่วไป', en: 'General Analgesics' },
                { th: 'ยาแก้ปวดกล้ามเนื้อ', en: 'Muscle Pain Relief' },
                { th: 'เพนิซิลลิน', en: 'Penicillins' },
                { th: 'อื่นๆ', en: 'Others' }
            ],
            units: [
                { th: 'เม็ด', en: 'Tablet' },
                { th: 'แคปซูล', en: 'Capsule' },
                { th: 'ช้อนชา', en: 'Teaspoon' },
                { th: 'มิลลิลิตร', en: 'Milliliter' }
            ],
            dosageMethods: [
                { th: 'รับประทาน', en: 'Oral' },
                { th: 'ทาภายนอก', en: 'Topical Application' },
                { th: 'หยอดตา', en: 'Eye Drops' },
                { th: 'สูดดม', en: 'Inhalation' }
            ],
            dosageTimes: [
                { th: 'ก่อนอาหาร', en: 'Before Meals' },
                { th: 'หลังอาหาร', en: 'After Meals' },
                { th: 'ก่อนนอน', en: 'Before Bedtime' },
                { th: 'เมื่อมีอาการ', en: 'As Needed' },
                { th: 'วันละครั้ง', en: 'Once Daily' },
                { th: 'วันละ 2 ครั้ง', en: 'Twice Daily' },
                { th: 'วันละ 3 ครั้ง', en: 'Three Times Daily' }
            ]
        };
    }
}

export default DrugOptionsService;