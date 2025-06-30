import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { AssistantService } from '../services/assistans.service';
import { toAssistantResponse, assistantResponseBuilders, AssistantOptionResponse } from '../types/assistant.types';
import { UserRole } from '../types/user.types';
import { getObjectIdString } from '../utils/mogoose.utils';

const assistantService = new AssistantService();

export const getOptionAssistants = catchAsync(async (req: Request, res: Response) => {
    const filter: any = { isActive: true };
    
    if (req.query.clinicId) filter.clinicId = req.query.clinicId;
    if (req.query.employmentType) {
      filter.employmentType = req.query.employmentType;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { surname: searchRegex },
        { nickname: searchRegex }
      ];
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
      filter.clinicId = req.user!.clinicId;
    }
  
    const sortField = (req.query.sortBy as string) || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  
    const { assistants } = await assistantService.findAllLean(filter, { [sortField]: sortOrder });
  
    res.status(200).json({
      status: 'success',
      data: {
        assistants: assistants.map(assistantResponseBuilders.option) as AssistantOptionResponse[]
      }
    });
});

export const getAllAssistants = catchAsync(async (req: Request, res: Response) => {
    const filter: any = {};

    if (req.query.clinicId) filter.clinicId = req.query.clinicId;
    if (req.query.employmentType) {
        filter.employmentType = req.query.employmentType;
    }

    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
            { name: searchRegex },
            { surname: searchRegex },
            { nickname: searchRegex }
        ];
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        filter.clinicId = req.user!.clinicId;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortBy as string) || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const { assistants, total, totalPages } = await assistantService.findAll(
        filter,
        { [sortField]: sortOrder },
        page,
        limit
    );
    
    res.status(200).json({
        status: 'success',
        results: assistants.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            assistants: assistants.map(assistant => toAssistantResponse(assistant)),
        },
    });
});

export const getAssistantById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const assistantId = req.params.id;

    const assistant = await assistantService.findById(assistantId);

    if (!assistant) {
        return next(new AppError('ไม่พบข้อมูล assistant นี้', 404));
    }

    if (!req.user!.clinicId) {
        return next(new AppError('ไม่พบ clinicId ในข้อมูลผู้ใช้', 400));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const assistantClinicId = getObjectIdString(assistant.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (assistantClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล assistant นี้', 403));
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            assistant: toAssistantResponse(assistant),
        },
    });
});

export const createAssistant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const assistantData = req.body;

    if (typeof assistantData.branches === 'string') {
        try {
            assistantData.branches = JSON.parse(assistantData.branches);
        } catch (error) {
            return next(new AppError('Invalid branches format, must be a valid JSON array', 400));
        }
    }

    if (assistantData.branches && !Array.isArray(assistantData.branches)) {
        return next(new AppError('branches must be an array', 400));
    }

    if (req.file) {
        assistantData.photo = `/uploads/assistants/${req.file.filename}`;
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        if (!assistantData.clinicId || assistantData.clinicId.toString() !== req.user!.clinicId?.toString()) {
            assistantData.clinicId = req.user!.clinicId as string;
        }
    }

    const newAssistant = await assistantService.createAssistant(assistantData);

    res.status(201).json({
        status: 'success',
        data: {
            assistant: toAssistantResponse(newAssistant),
        },
    });
});

export const updateAssistant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const assistantId = req.params.id;
    const updateData = req.body;

    if (typeof updateData.branches === 'string') {
        try {
            updateData.branches = JSON.parse(updateData.branches);
        } catch (error) {
            return next(new AppError('Invalid branches format, must be a valid JSON array', 400));
        }
    }

    if (updateData.branches && !Array.isArray(updateData.branches)) {
        return next(new AppError('branches must be an array', 400));
    }

    if (req.file) {
        updateData.photo = `/uploads/assistants/${req.file.filename}`;
    }

    const assistant = await assistantService.findById(assistantId);

    if (!assistant) {
        return next(new AppError('ไม่พบข้อมูล assistant นี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const assistantClinicId = getObjectIdString(assistant.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (assistantClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูล assistant นี้', 403));
        }
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN && updateData.clinicId) {
        delete updateData.clinicId;
    }

    const updatedAssistant = await assistantService.updateAssistant(assistantId, updateData);

    res.status(200).json({
        status: 'success',
        data: {
            assistant: toAssistantResponse(updatedAssistant!),
        },
    });
});

export const updateAssistantStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const assistantId = req.params.id;
    const { isActive } = req.body;

    const assistant = await assistantService.findById(assistantId);

    if (!assistant) {
        return next(new AppError('ไม่พบข้อมูล assistant นี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const assistantClinicId = getObjectIdString(assistant.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (assistantClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสถานะ assistant นี้', 403));
        }
    }

    const updatedAssistant = await assistantService.updateAssistantStatus(assistantId, isActive);

    res.status(200).json({
        status: 'success',
        data: {
            assistant: toAssistantResponse(updatedAssistant!),
        },
    });
});

export const deleteAssistant = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const assistantId = req.params.id;

    const assistant = await assistantService.findById(assistantId);

    if (!assistant) {
        return next(new AppError('ไม่พบข้อมูล assistant นี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const assistantClinicId = getObjectIdString(assistant.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (assistantClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูล assistant นี้', 403));
        }
    }

    await assistantService.deleteAssistant(assistantId);

    res.status(200).json({
        status: 'success',
        data: null,
    });
});

export const getAssistantsByEmploymentType = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params;
    const clinicId = req.user!.roles === UserRole.SUPER_ADMIN ? undefined : req.user!.clinicId as string;

    const assistants = await assistantService.findByEmploymentType(type, clinicId);

    res.status(200).json({
        status: 'success',
        results: assistants.length,
        data: {
            assistants: assistants.map(assistant => toAssistantResponse(assistant)),
        },
    });
});