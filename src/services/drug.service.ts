import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { Drug } from '../models/drug.model';
import {
    IDrugDocument,
    IDrugCreateInput,
    IDrugUpdateInput,
    IDrugSearchFilter,
    IDrugBulkOperation,
    IDrugImportResult,
    IDrugLabelConfig,
    IDrugMultilingualText
} from '../types/drug.types';

export class DrugService {

    /**
     * สร้างยาใหม่
     */
    async createDrug(
        drugData: IDrugCreateInput,
        userId: string,
        clinicId?: string
    ): Promise<IDrugDocument> {
        try {
            // ใช้ clinicId จาก parameter หรือจาก drugData
            const effectiveClinicId = clinicId || drugData.clinicId;

            if (!effectiveClinicId) {
                throw new AppError('กรุณาระบุ clinic ID', 400);
            }

            // ตรวจสอบว่ารหัสยาซ้ำหรือไม่
            const existingDrug = await Drug.findOne({
                clinicId: effectiveClinicId,
                drugCode: drugData.drugCode.toUpperCase(),
                isArchived: false
            });

            if (existingDrug) {
                throw new AppError('รหัสยานี้ถูกใช้แล้ว', 400);
            }

            const newDrug = await Drug.create({
                ...drugData,
                clinicId: effectiveClinicId,
                drugCode: drugData.drugCode.toUpperCase(),
                createdBy: userId,
                updatedBy: userId
            });

            await newDrug.populate('createdBy updatedBy', 'firstName lastName');

            return newDrug;
        } catch (error) {
            logger.error(`Error creating drug: ${error}`);
            if (error instanceof AppError) throw error;
            throw new AppError('เกิดข้อผิดพลาดในการสร้างยา', 500);
        }
    }

    /**
     * ดึงยาตาม ID
     */
    async getDrugById(drugId: string, clinicId?: string): Promise<IDrugDocument | null> {
        try {
            const query: any = { _id: drugId };
            if (clinicId) {
                query.clinicId = clinicId;
            }

            const drug = await Drug.findOne(query)
                // .populate('createdBy updatedBy', 'firstName lastName')
                // .populate('clinicId', 'name')
                // .populate('branchId', 'name');

            return drug;
        } catch (error) {
            logger.error(`Error getting drug by ID: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลยา', 500);
        }
    }

    /**
     * ดึงยาตามรหัส
     */
    async getDrugByCode(drugCode: string, clinicId: string, branchId?: string): Promise<IDrugDocument | null> {
        try {
            const query: any = {
                clinicId,
                drugCode: drugCode.toUpperCase(),
                isArchived: false
            };

            if (branchId) {
                query.branchId = branchId;
            }

            const drug = await Drug.findOne(query)
                .populate('createdBy updatedBy', 'firstName lastName');

            return drug;
        } catch (error) {
            logger.error(`Error getting drug by code: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลยาตามรหัส', 500);
        }
    }

    /**
     * อัปเดตยา
     */
    async updateDrug(
        drugId: string,
        updateData: IDrugUpdateInput,
        userId: string,
        clinicId?: string
    ): Promise<IDrugDocument> {
        try {
            const query: any = { _id: drugId };
            if (clinicId) {
                query.clinicId = clinicId;
            }

            // ตรวจสอบว่ารหัสยาซ้ำหรือไม่ (ถ้ามีการเปลี่ยนรหัส)
            if (updateData.drugCode) {
                const existingDrug = await Drug.findOne({
                    _id: { $ne: drugId },
                    clinicId: clinicId,
                    drugCode: updateData.drugCode.toUpperCase(),
                    isArchived: false
                });

                if (existingDrug) {
                    throw new AppError('รหัสยานี้ถูกใช้แล้ว', 400);
                }

                updateData.drugCode = updateData.drugCode.toUpperCase();
            }

            const updatedDrug = await Drug.findOneAndUpdate(
                query,
                {
                    ...updateData,
                    updatedBy: userId
                },
                { new: true, runValidators: true }
            ).populate('createdBy updatedBy', 'firstName lastName');

            if (!updatedDrug) {
                throw new AppError('ไม่พบยาที่ต้องการอัปเดต', 404);
            }

            return updatedDrug;
        } catch (error) {
            logger.error(`Error updating drug: ${error}`);
            if (error instanceof AppError) throw error;
            throw new AppError('เกิดข้อผิดพลาดในการอัปเดตยา', 500);
        }
    }

    /**
     * ลบยา (soft delete)
     */
    async deleteDrug(drugId: string, userId: string, clinicId?: string): Promise<boolean> {
        try {
            const query: any = { _id: drugId };
            if (clinicId) {
                query.clinicId = clinicId;
            }

            const drug = await Drug.findOne(query);
            if (!drug) {
                throw new AppError('ไม่พบยาที่ต้องการลบ', 404);
            }

            // Archive instead of delete
            drug.isArchived = true;
            drug.isActive = false;
            drug.updatedBy = userId;
            await drug.save();

            return true;
        } catch (error) {
            logger.error(`Error deleting drug: ${error}`);
            if (error instanceof AppError) throw error;
            throw new AppError('เกิดข้อผิดพลาดในการลบยา', 500);
        }
    }

    /**
     * ค้นหายาแบบขั้นสูง
     */
    async searchDrugs(
        filter: IDrugSearchFilter,
        page: number = 1,
        limit: number = 20,
        sortBy: string = 'drugName',
        sortOrder: 'asc' | 'desc' = 'asc'
    ): Promise<{
        drugs: IDrugDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const query: any = {};

            // Basic filters
            if (filter.clinicId) query.clinicId = filter.clinicId;
            if (filter.branchId) query.branchId = filter.branchId;
            if (filter.category) query.category = filter.category;
            if (filter.subcategory) query.subcategory = filter.subcategory;
            if (filter.drugCode) query.drugCode = new RegExp(filter.drugCode, 'i');
            if (filter.drugName) query.drugName = new RegExp(filter.drugName, 'i');

            // Status filters
            query.isActive = filter.isActive !== undefined ? filter.isActive : true;
            query.isArchived = filter.isArchived !== undefined ? filter.isArchived : false;

            // Price range filter
            if (filter.priceRange) {
                if (filter.priceRange.min !== undefined || filter.priceRange.max !== undefined) {
                    query.sellingPrice = {};
                    if (filter.priceRange.min !== undefined) {
                        query.sellingPrice.$gte = filter.priceRange.min;
                    }
                    if (filter.priceRange.max !== undefined) {
                        query.sellingPrice.$lte = filter.priceRange.max;
                    }
                }
            }

            // Full-text search
            if (filter.searchTerm) {
                query.$text = { $search: filter.searchTerm };
            }

            // Build sort object
            const sort: any = {};
            if (filter.searchTerm) {
                sort.score = { $meta: 'textScore' };
            } else {
                sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;

            const [drugs, total] = await Promise.all([
                Drug.find(query, filter.searchTerm ? { score: { $meta: 'textScore' } } : {})
                    .populate('createdBy updatedBy', 'firstName lastName')
                    .populate('clinicId', 'name')
                    .populate('branchId', 'name')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Drug.countDocuments(query)
            ]);

            return {
                drugs,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error(`Error searching drugs: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการค้นหายา', 500);
        }
    }

    /**
     * ดึงยาตามหมวดหมู่
     */
    async getDrugsByCategory(
        clinicId: string,
        category: string,
        subcategory?: string,
        branchId?: string
    ): Promise<IDrugDocument[]> {
        try {
            const query: any = {
                clinicId,
                category,
                isActive: true,
                isArchived: false
            };

            if (subcategory) {
                query.subcategory = subcategory;
            }

            if (branchId) {
                query.branchId = branchId;
            }

            const drugs = await Drug.find(query)
                .populate('createdBy updatedBy', 'firstName lastName')
                .sort({ drugName: 1 });

            return drugs;
        } catch (error) {
            logger.error(`Error getting drugs by category: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการดึงยาตามหมวดหมู่', 500);
        }
    }

    /**
     * ตั้งค่าข้อมูลหลายภาษาสำหรับฉลากยา
     */
    async setDrugLabelConfig(
        drugId: string,
        config: IDrugLabelConfig,
        userId: string,
        clinicId?: string
    ): Promise<IDrugDocument> {
        try {
            const query: any = { _id: drugId };
            if (clinicId) {
                query.clinicId = clinicId;
            }

            const drug = await Drug.findOne(query);
            if (!drug) {
                throw new AppError('ไม่พบยาที่ต้องการตั้งค่าฉลาก', 404);
            }

            // อัปเดตข้อมูลหลายภาษา
            if (config.customTranslations) {
                if (!drug.multilingualData) {
                    drug.multilingualData = {};
                }

                Object.keys(config.customTranslations).forEach(fieldName => {
                    const translationData = config.customTranslations![fieldName];
                    if (translationData) {
                        drug.multilingualData![fieldName as keyof typeof drug.multilingualData] = translationData;
                    }
                });
            }

            drug.updatedBy = userId;
            await drug.save();

            return drug;
        } catch (error) {
            logger.error(`Error setting drug label config: ${error}`);
            if (error instanceof AppError) throw error;
            throw new AppError('เกิดข้อผิดพลาดในการตั้งค่าฉลากยา', 500);
        }
    }

    /**
     * Bulk operations
     */
    async bulkOperations(
        operations: IDrugBulkOperation[],
        userId: string,
        clinicId: string
    ): Promise<{
        success: number;
        failed: number;
        errors: Array<{ operation: IDrugBulkOperation; error: string }>;
    }> {
        try {
            const results = {
                success: 0,
                failed: 0,
                errors: [] as Array<{ operation: IDrugBulkOperation; error: string }>
            };

            for (const operation of operations) {
                try {
                    switch (operation.action) {
                        case 'create':
                            if (operation.data) {
                                await this.createDrug(
                                    operation.data as IDrugCreateInput,
                                    userId,
                                    clinicId
                                );
                            }
                            break;

                        case 'update':
                            if (operation.drugIds && operation.data) {
                                for (const drugId of operation.drugIds) {
                                    await this.updateDrug(
                                        drugId,
                                        operation.data as IDrugUpdateInput,
                                        userId,
                                        clinicId
                                    );
                                }
                            }
                            break;

                        case 'delete':
                            if (operation.drugIds) {
                                for (const drugId of operation.drugIds) {
                                    await this.deleteDrug(drugId, userId, clinicId);
                                }
                            }
                            break;

                        case 'archive':
                            if (operation.drugIds) {
                                await Drug.updateMany(
                                    { _id: { $in: operation.drugIds }, clinicId },
                                    { isArchived: true, isActive: false, updatedBy: userId }
                                );
                            }
                            break;

                        case 'activate':
                            if (operation.drugIds) {
                                await Drug.updateMany(
                                    { _id: { $in: operation.drugIds }, clinicId },
                                    { isActive: true, updatedBy: userId }
                                );
                            }
                            break;
                    }
                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        operation,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            return results;
        } catch (error) {
            logger.error(`Error in bulk operations: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการประมวลผลหลายรายการ', 500);
        }
    }

    /**
     * Export ข้อมูลยา
     */
    async exportDrugs(
        filter: IDrugSearchFilter,
        format: 'csv' | 'excel' | 'json' = 'csv',
        includeMultilingual: boolean = false
    ): Promise<any> {
        try {
            const { drugs } = await this.searchDrugs(filter, 1, 10000); // Export all matching drugs

            // Transform data for export
            const exportData = drugs.map(drug => {
                const baseData = {
                    รหัสยา: drug.drugCode,
                    ชื่อยา: drug.drugName,
                    หมวดหมู่: drug.category,
                    หมวดหมู่ย่อย: drug.subcategory,
                    ชื่อทางวิทยาศาสตร์: drug.scientificName || '',
                    ขนาด: drug.dosage,
                    หน่วย: drug.unit,
                    วิธีใช้: drug.dosageMethod || '',
                    เวลาใช้: drug.dosageTime || '',
                    ข้อบ่งใช้: drug.indications || '',
                    คำแนะนำ: drug.instructions || '',
                    ราคาขาย: drug.sellingPrice,
                    ราคาซื้อ: drug.purchasePrice || '',
                    สถานะ: drug.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'
                };

                // Add multilingual data if requested
                if (includeMultilingual && drug.multilingualData) {
                    return {
                        ...baseData,
                        'ชื่อทางวิทยาศาสตร์ (EN)': drug.multilingualData.scientificName?.en || '',
                        'หน่วย (EN)': drug.multilingualData.unit?.en || '',
                        'วิธีใช้ (EN)': drug.multilingualData.dosageMethod?.en || '',
                        'เวลาใช้ (EN)': drug.multilingualData.dosageTime?.en || '',
                        'ข้อบ่งใช้ (EN)': drug.multilingualData.indications?.en || '',
                        'คำแนะนำ (EN)': drug.multilingualData.instructions?.en || ''
                    };
                }

                return baseData;
            });

            return exportData;
        } catch (error) {
            logger.error(`Error exporting drugs: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการ export ข้อมูลยา', 500);
        }
    }

    /**
     * Generate unique drug code
     */
    async generateDrugCode(clinicId: string, prefix: string = 'DRUG'): Promise<string> {
        try {
            let counter = 1;
            let drugCode: string;
            let exists = true;

            while (exists) {
                drugCode = `${prefix}${counter.toString().padStart(3, '0')}`;
                const existingDrug = await Drug.findOne({
                    clinicId,
                    drugCode,
                    isArchived: false
                });
                exists = !!existingDrug;
                if (exists) counter++;
            }

            return drugCode!;
        } catch (error) {
            logger.error(`Error generating drug code: ${error}`);
            throw new AppError('เกิดข้อผิดพลาดในการสร้างรหัสยา', 500);
        }
    }
}

export default DrugService;