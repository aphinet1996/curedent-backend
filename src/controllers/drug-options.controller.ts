import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { DrugOptionsService } from '../services/drug-options.service';
import { DrugOptionCategory } from '../types/drug.types';
import { IMultilingualOption } from '../types/patient.types';

const drugOptionsService = new DrugOptionsService();

export const getAllDropdownOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const options = await drugOptionsService.getDropdownOptions(clinicId, branchId);

  res.status(200).json({
    status: 'success',
    data: {
      options,
    },
  });
});

export const getOptionsByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.params;
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const values = await drugOptionsService.getOptionsByCategory(
    clinicId,
    category as DrugOptionCategory,
    branchId
  );

  res.status(200).json({
    status: 'success',
    data: {
      category,
      values,
    },
  });
});

export const updateOptionsForClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.params;
  const { values } = req.body;
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.body.branchId || req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (!Array.isArray(values)) {
    return next(new AppError('ค่า values ต้องเป็น array', 400));
  }

  const validatedValues: IMultilingualOption[] = values.map((value, index) => {
    if (typeof value === 'string') {
      return { th: value };
    }

    if (!value || typeof value !== 'object') {
      throw new AppError(`รูปแบบตัวเลือกยาที่ ${index + 1} ไม่ถูกต้อง`, 400);
    }

    if (!value.th || typeof value.th !== 'string') {
      throw new AppError(`กรุณาระบุข้อมูลภาษาไทยสำหรับตัวเลือกยาที่ ${index + 1}`, 400);
    }

    return {
      th: value.th.trim(),
      en: value.en ? value.en.trim() : undefined
    };
  });

  const updatedOption = await drugOptionsService.updateOptionsForClinic(
    clinicId,
    category as DrugOptionCategory,
    validatedValues,
    branchId
  );

  res.status(200).json({
    status: 'success',
    data: {
      option: updatedOption,
    },
  });
});

export const addOptionValue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { category } = req.params;
  const { value, th, en } = req.body;
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.body.branchId || req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  let multilingualValue: IMultilingualOption;

  if (value && typeof value === 'object') {
    if (!value.th) {
      return next(new AppError('กรุณาระบุข้อมูลภาษาไทย', 400));
    }
    multilingualValue = {
      th: value.th.trim(),
      en: value.en ? value.en.trim() : undefined
    };
  } else if (th) {
    multilingualValue = {
      th: th.trim(),
      en: en ? en.trim() : undefined
    };
  } else if (typeof value === 'string') {
    multilingualValue = { th: value.trim() };
  } else {
    return next(new AppError('กรุณาระบุข้อมูลตัวเลือกยาที่ต้องการเพิ่ม', 400));
  }

  const updatedOption = await drugOptionsService.addOptionValue(
    clinicId,
    category as DrugOptionCategory,
    multilingualValue,
    branchId
  );

  res.status(200).json({
    status: 'success',
    data: {
      option: updatedOption,
    },
  });
});

export const removeOptionValue = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { category, value } = req.params;
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const thValue = decodeURIComponent(value);

  const updatedOption = await drugOptionsService.removeOptionValue(
    clinicId,
    category as DrugOptionCategory,
    thValue,
    branchId
  );

  if (!updatedOption) {
    return next(new AppError('ไม่พบตัวเลือกยาที่ต้องการลบ', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      option: updatedOption,
    },
  });
});

export const initializeDefaultOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await drugOptionsService.createDefaultOptions();

  res.status(200).json({
    status: 'success',
    message: 'สร้างข้อมูลเริ่มต้นของยาเรียบร้อยแล้ว',
  });
});

export const bulkUpdateOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { operations } = req.body;
  const clinicId = req.user!.clinicId?.toString();
  const branchId = req.body.branchId || req.query.branchId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (!Array.isArray(operations)) {
    return next(new AppError('operations ต้องเป็น array', 400));
  }

  const results = await Promise.allSettled(
    operations.map(async (op: any) => {
      switch (op.action) {
        case 'update':
          return drugOptionsService.updateOptionsForClinic(
            clinicId,
            op.category,
            op.values,
            branchId
          );
        case 'add':
          return drugOptionsService.addOptionValue(
            clinicId,
            op.category,
            op.value,
            branchId
          );
        case 'remove':
          return drugOptionsService.removeOptionValue(
            clinicId,
            op.category,
            op.thValue,
            branchId
          );
        default:
          throw new AppError(`ไม่รองรับ action: ${op.action}`, 400);
      }
    })
  );

  const success = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.status(200).json({
    status: 'success',
    data: {
      total: operations.length,
      success,
      failed,
      results: results.map((result, index) => ({
        operation: operations[index],
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : undefined,
        error: result.status === 'rejected' ? result.reason?.message : undefined
      }))
    }
  });
});