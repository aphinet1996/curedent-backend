import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { DrugService } from '../services/drug.service';
import { DrugOptionsService } from '../services/drug-options.service';
import { UserRole } from '../types/user.types';
import {
    IDrugCreateInput,
    IDrugUpdateInput,
    IDrugSearchFilter,
    IDrugBulkOperation,
    IDrugLabelConfig
} from '../types/drug.types';

const drugService = new DrugService();
const drugOptionsService = new DrugOptionsService();

const processMultilingualFormData = (data: any): any => {
    const processedData = { ...data };
    
    const arrayFields = ['drugAllergies', 'chronicDiseases', 'currentMedications'];
    arrayFields.forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'string') {
            try {
                processedData[field] = JSON.parse(processedData[field]);
            } catch (error) {
                processedData[field] = [processedData[field]];
            }
        }
    });

    return processedData;
};

export const getAllDrugs = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId?.toString();
    const branchId = req.query.branchId?.toString();
    
    if (!clinicId) {
        throw new AppError('กรุณาระบุ clinic ID', 400);
    }

    const filter: IDrugSearchFilter = {
        clinicId,
        branchId,
        category: req.query.category?.toString(),
        subcategory: req.query.subcategory?.toString(),
        drugName: req.query.drugName?.toString(),
        drugCode: req.query.drugCode?.toString(),
        searchTerm: req.query.q?.toString(),
        isActive: req.query.isActive ? req.query.isActive === 'true' : true,
        isArchived: req.query.isArchived ? req.query.isArchived === 'true' : false
    };

    if (req.query.minPrice || req.query.maxPrice) {
        filter.priceRange = {
            min: req.query.minPrice ? parseFloat(req.query.minPrice.toString()) : undefined,
            max: req.query.maxPrice ? parseFloat(req.query.maxPrice.toString()) : undefined
        };
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'drugName';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

    const result = await drugService.searchDrugs(filter, page, limit, sortBy, sortOrder);

    res.status(200).json({
        status: 'success',
        results: result.drugs.length,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        },
        data: {
            drugs: result.drugs
        }
    });
});

export const searchDrugs = catchAsync(async (req: Request, res: Response) => {
    const clinicId = req.user!.clinicId?.toString();
    const searchTerm = req.query.q?.toString();
    
    if (!clinicId) {
        throw new AppError('กรุณาระบุ clinic ID', 400);
    }

    if (!searchTerm) {
        throw new AppError('กรุณาระบุคำค้นหา', 400);
    }

    const filter: IDrugSearchFilter = {
        clinicId,
        branchId: req.query.branchId?.toString(),
        searchTerm,
        category: req.query.category?.toString(),
        isActive: true,
        isArchived: false
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await drugService.searchDrugs(filter, page, limit);

    res.status(200).json({
        status: 'success',
        results: result.drugs.length,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        },
        data: {
            drugs: result.drugs,
            searchTerm
        }
    });
});

export const getDrugById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugId = req.params.id;
    const clinicId = req.user!.clinicId?.toString();

    const drug = await drugService.getDrugById(drugId, clinicId);

    if (!drug) {
        return next(new AppError('ไม่พบข้อมูลยานี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN && 
        drug.clinicId.toString() !== clinicId) {
        return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลยานี้', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            drug
        }
    });
});

export const getDrugByCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugCode = req.params.drugCode;
    const clinicId = req.user!.clinicId?.toString();
    const branchId = req.query.branchId?.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const drug = await drugService.getDrugByCode(drugCode, clinicId, branchId);

    if (!drug) {
        return next(new AppError('ไม่พบยาที่มีรหัสนี้', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            drug
        }
    });
});

export const createDrug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    let drugData: IDrugCreateInput = {
        ...req.body,
        clinicId
    };

    drugData = processMultilingualFormData(drugData);

    if (!drugData.drugCode) {
        drugData.drugCode = await drugService.generateDrugCode(clinicId);
    }

    const newDrug = await drugService.createDrug(drugData, userId, clinicId);

    res.status(201).json({
        status: 'success',
        data: {
            drug: newDrug
        }
    });
});

export const updateDrug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugId = req.params.id;
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    let updateData: IDrugUpdateInput = { ...req.body };
    updateData = processMultilingualFormData(updateData);

    const updatedDrug = await drugService.updateDrug(drugId, updateData, userId, clinicId);

    res.status(200).json({
        status: 'success',
        data: {
            drug: updatedDrug
        }
    });
});

export const deleteDrug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugId = req.params.id;
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    await drugService.deleteDrug(drugId, userId, clinicId);

    res.status(200).json({
        status: 'success',
        data: null
    });
});

export const getDrugsByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = req.params.category;
    const clinicId = req.user!.clinicId?.toString();
    const subcategory = req.query.subcategory?.toString();
    const branchId = req.query.branchId?.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const drugs = await drugService.getDrugsByCategory(clinicId, category, subcategory, branchId);

    res.status(200).json({
        status: 'success',
        results: drugs.length,
        data: {
            category,
            subcategory,
            drugs
        }
    });
});

export const setDrugLabelConfig = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugId = req.params.id;
    const config: IDrugLabelConfig = req.body;
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const updatedDrug = await drugService.setDrugLabelConfig(drugId, config, userId, clinicId);

    res.status(200).json({
        status: 'success',
        data: {
            drug: updatedDrug
        }
    });
});

export const bulkOperations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { operations }: { operations: IDrugBulkOperation[] } = req.body;
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    if (!Array.isArray(operations)) {
        return next(new AppError('operations ต้องเป็น array', 400));
    }

    const result = await drugService.bulkOperations(operations, userId, clinicId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

export const exportDrugs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.user!.clinicId?.toString();
    const format = (req.query.format as 'csv' | 'excel' | 'json') || 'csv';
    const includeMultilingual = req.query.includeMultilingual === 'true';

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const filter: IDrugSearchFilter = {
        clinicId,
        branchId: req.query.branchId?.toString(),
        category: req.query.category?.toString(),
        subcategory: req.query.subcategory?.toString(),
        isActive: req.query.isActive ? req.query.isActive === 'true' : true,
        isArchived: req.query.isArchived ? req.query.isArchived === 'true' : false
    };

    const exportData = await drugService.exportDrugs(filter, format, includeMultilingual);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `drugs_export_${timestamp}.${format}`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(exportData);
    } else {
        res.setHeader('Content-Type', 'text/csv');
        res.status(200).json({
            status: 'success',
            data: exportData,
            message: `ข้อมูลยา ${exportData.length} รายการพร้อม export`
        });
    }
});

export const generateDrugCode = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.user!.clinicId?.toString();
    const prefix = req.query.prefix?.toString() || 'DRUG';

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const drugCode = await drugService.generateDrugCode(clinicId, prefix);

    res.status(200).json({
        status: 'success',
        data: {
            drugCode
        }
    });
});

export const getDropdownOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = req.user!.clinicId?.toString();
    const branchId = req.query.branchId?.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const options = await drugOptionsService.getDropdownOptions(clinicId, branchId);

    res.status(200).json({
        status: 'success',
        data: {
            options
        }
    });
});

export const toggleArchiveStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const drugId = req.params.id;
    const { isArchived } = req.body;
    const clinicId = req.user!.clinicId?.toString();
    const userId = req.user!._id.toString();

    if (!clinicId) {
        return next(new AppError('กรุณาระบุ clinic ID', 400));
    }

    const updateData: IDrugUpdateInput = {
        isArchived,
        isActive: !isArchived
    };

    const updatedDrug = await drugService.updateDrug(drugId, updateData, userId, clinicId);

    res.status(200).json({
        status: 'success',
        data: {
            drug: updatedDrug
        }
    });
});