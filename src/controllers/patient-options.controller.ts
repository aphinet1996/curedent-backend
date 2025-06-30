import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { PatientOptionsService } from '../services/patient-options.service';
import { PatientOptionCategory, IMultilingualOption } from '../types/patient.types';

const patientOptionsService = new PatientOptionsService();

export const getAllDropdownOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const options = await patientOptionsService.getDropdownOptions(clinicId);

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

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const values = await patientOptionsService.getOptionsByCategory(
    clinicId, 
    category as PatientOptionCategory
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
      throw new AppError(`รูปแบบตัวเลือกที่ ${index + 1} ไม่ถูกต้อง`, 400);
    }

    if (!value.th || typeof value.th !== 'string') {
      throw new AppError(`กรุณาระบุข้อมูลภาษาไทยสำหรับตัวเลือกที่ ${index + 1}`, 400);
    }

    return {
      th: value.th.trim(),
      en: value.en ? value.en.trim() : undefined
    };
  });

  const updatedOption = await patientOptionsService.updateOptionsForClinic(
    clinicId, 
    category as PatientOptionCategory, 
    validatedValues
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
    return next(new AppError('กรุณาระบุข้อมูลตัวเลือกที่ต้องการเพิ่ม', 400));
  }

  const updatedOption = await patientOptionsService.addOptionValue(
    clinicId, 
    category as PatientOptionCategory, 
    multilingualValue
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

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const thValue = decodeURIComponent(value);

  const updatedOption = await patientOptionsService.removeOptionValue(
    clinicId, 
    category as PatientOptionCategory, 
    thValue
  );

  if (!updatedOption) {
    return next(new AppError('ไม่พบตัวเลือกที่ต้องการลบ', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      option: updatedOption,
    },
  });
});

export const initializeDefaultOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await patientOptionsService.createDefaultOptions();

  res.status(200).json({
    status: 'success',
    message: 'สร้างข้อมูลเริ่มต้นเรียบร้อยแล้ว',
  });
});