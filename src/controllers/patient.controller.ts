import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { PatientService } from '../services/patient.service';
import { toPatientResponse } from '../types/patient.types';
import { UserRole } from '../types/user.types';

const patientService = new PatientService();

const processMultilingualFormData = (data: any): any => {
  const processedData = { ...data };
  
  const multilingualFields = [
    'nationality', 'titlePrefix', 'firstName', 'lastName', 
    'gender', 'patientType', 'bloodGroup', 'occupation', 
    'medicalRights', 'maritalStatus', 'referralSource'
  ];

  multilingualFields.forEach(field => {
    if (processedData[field]) {
      if (typeof processedData[field] === 'string') {
        try {
          processedData[field] = JSON.parse(processedData[field]);
        } catch (error) {
          processedData[field] = {
            th: processedData[field],
            en: ''
          };
        }
      }
      
      if (typeof processedData[field] === 'object' && processedData[field].th) {
        if (!processedData[field].en) {
          processedData[field].en = '';
        }
      }
    }
  });

  return processedData;
};

export const getAllPatients = catchAsync(async (req: Request, res: Response) => {
  const filter: any = { isActive: true };
  
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.patientType) filter.patientType = req.query.patientType;
  if (req.query.gender) filter.gender = req.query.gender;
  if (req.query.nationality) filter.nationality = req.query.nationality;
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const lang = (req.query.lang as string) || 'th';
  
  const { patients, total, totalPages } = await patientService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit,
    lang
  );
  
  res.status(200).json({
    status: 'success',
    results: patients.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      patients: patients.map(patient => toPatientResponse(patient, lang)),
    },
  });
});

export const searchPatients = catchAsync(async (req: Request, res: Response) => {
  const searchTerm = req.query.q as string;
  const branchId = req.query.branchId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const lang = (req.query.lang as string) || 'th';
  
  if (!searchTerm) {
    return res.status(400).json({
      status: 'error',
      message: 'กรุณาระบุคำค้นหา'
    });
  }
  
  let clinicId: string | undefined;
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    clinicId = req.user!.clinicId?.toString();
  }
  
  const { patients, total, totalPages } = await patientService.searchPatients(
    searchTerm,
    clinicId,
    branchId,
    page,
    limit,
    lang
  );
  
  res.status(200).json({
    status: 'success',
    results: patients.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      patients: patients.map(patient => toPatientResponse(patient, lang)),
      searchTerm,
    },
  });
});

export const getPatientById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.id;
  const lang = (req.query.lang as string) || 'th';
  
  const patient = await patientService.findById(patientId);
  
  if (!patient) {
    return next(new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยนี้', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: toPatientResponse(patient, lang),
    },
  });
});

export const getPatientByHN = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const hn = req.params.hn;
  const lang = (req.query.lang as string) || 'th';
  
  const patient = await patientService.findByHN(hn);
  
  if (!patient) {
    return next(new AppError('ไม่พบผู้ป่วยที่มี HN นี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยนี้', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: toPatientResponse(patient, lang),
    },
  });
});

export const getPatientByNationalId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const nationalId = req.params.nationalId;
  const lang = (req.query.lang as string) || 'th';
  
  const patient = await patientService.findByNationalId(nationalId);
  
  if (!patient) {
    return next(new AppError('ไม่พบผู้ป่วยที่มีเลขบัตรประชาชนนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยนี้', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: toPatientResponse(patient, lang),
    },
  });
});

export const createPatient = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let patientData = req.body;
  
  // ตรวจสอบสิทธิ์ในการสร้างผู้ป่วยในสาขานี้
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // ตรวจสอบว่าสาขาที่ระบุอยู่ในคลินิกของผู้ใช้หรือไม่
    // TODO: ตรวจสอบจาก Branch model
    // const branch = await Branch.findById(patientData.branchId);
    // if (!branch || branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    //   return next(new AppError('คุณไม่มีสิทธิ์สร้างผู้ป่วยในสาขานี้', 403));
    // }
  }
  
  patientData = processMultilingualFormData(patientData);
  
  if (typeof patientData.medicalInfo?.drugAllergies === 'string') {
    try {
      patientData.medicalInfo.drugAllergies = JSON.parse(patientData.medicalInfo.drugAllergies);
    } catch (error) {
      patientData.medicalInfo.drugAllergies = [patientData.medicalInfo.drugAllergies];
    }
  }
  
  if (typeof patientData.medicalInfo?.chronicDiseases === 'string') {
    try {
      patientData.medicalInfo.chronicDiseases = JSON.parse(patientData.medicalInfo.chronicDiseases);
    } catch (error) {
      patientData.medicalInfo.chronicDiseases = [patientData.medicalInfo.chronicDiseases];
    }
  }
  
  if (typeof patientData.medicalInfo?.currentMedications === 'string') {
    try {
      patientData.medicalInfo.currentMedications = JSON.parse(patientData.medicalInfo.currentMedications);
    } catch (error) {
      patientData.medicalInfo.currentMedications = [patientData.medicalInfo.currentMedications];
    }
  }
  
  const newPatient = await patientService.createPatient(patientData);
  const lang = (req.query.lang as string) || 'th';
  
  res.status(201).json({
    status: 'success',
    data: {
      patient: toPatientResponse(newPatient, lang),
    },
  });
});

export const updatePatient = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.id;
  let updateData = req.body;
  const lang = (req.query.lang as string) || 'th';
  
  const patient = await patientService.findById(patientId);
  if (!patient) {
    return next(new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ป่วยนี้', 403));
  }
  
  updateData = processMultilingualFormData(updateData);
  
  if (updateData.medicalInfo?.drugAllergies && typeof updateData.medicalInfo.drugAllergies === 'string') {
    try {
      updateData.medicalInfo.drugAllergies = JSON.parse(updateData.medicalInfo.drugAllergies);
    } catch (error) {
      updateData.medicalInfo.drugAllergies = [updateData.medicalInfo.drugAllergies];
    }
  }
  
  if (updateData.medicalInfo?.chronicDiseases && typeof updateData.medicalInfo.chronicDiseases === 'string') {
    try {
      updateData.medicalInfo.chronicDiseases = JSON.parse(updateData.medicalInfo.chronicDiseases);
    } catch (error) {
      updateData.medicalInfo.chronicDiseases = [updateData.medicalInfo.chronicDiseases];
    }
  }
  
  if (updateData.medicalInfo?.currentMedications && typeof updateData.medicalInfo.currentMedications === 'string') {
    try {
      updateData.medicalInfo.currentMedications = JSON.parse(updateData.medicalInfo.currentMedications);
    } catch (error) {
      updateData.medicalInfo.currentMedications = [updateData.medicalInfo.currentMedications];
    }
  }
  
  const updatedPatient = await patientService.updatePatient(patientId, updateData);
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: toPatientResponse(updatedPatient!, lang),
    },
  });
});

export const updatePatientActiveStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.id;
  const { isActive } = req.body;
  const lang = (req.query.lang as string) || 'th';
  
  const patient = await patientService.findById(patientId);
  if (!patient) {
    return next(new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เปลี่ยนสถานะผู้ป่วยนี้', 403));
  }
  
  const updatedPatient = await patientService.updatePatientActiveStatus(patientId, isActive);
  
  res.status(200).json({
    status: 'success',
    data: {
      patient: toPatientResponse(updatedPatient!, lang),
    },
  });
});

export const deletePatient = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.params.id;
  
  const patient = await patientService.findById(patientId);
  if (!patient) {
    return next(new AppError('ไม่พบข้อมูลผู้ป่วยนี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      patient.clinicId.toString() !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบผู้ป่วยนี้', 403));
  }
  
  await patientService.deletePatient(patientId);
  
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const getPatientsByBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.branchId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const lang = (req.query.lang as string) || 'th';
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าสาขานี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }
  
  const { patients, total, totalPages } = await patientService.findByBranch(branchId, page, limit, lang);
  
  res.status(200).json({
    status: 'success',
    results: patients.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      branchId,
      patients: patients.map(patient => toPatientResponse(patient, lang)),
    },
  });
});

export const getPatientsByClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const lang = (req.query.lang as string) || 'th';

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
      clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลผู้ป่วยของคลินิกนี้', 403));
  }

  const { patients, total, totalPages } = await patientService.findByClinic(clinicId, page, limit, lang);

  res.status(200).json({
    status: 'success',
    results: patients.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      clinicId,
      patients: patients.map(patient => toPatientResponse(patient, lang)),
    },
  });
});

export const getPatientStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.params.clinicId || req.user!.clinicId?.toString();
  const branchId = req.params.branchId;

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN &&
      clinicId !== req.user!.clinicId?.toString()) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงสถิติผู้ป่วยของคลินิกนี้', 403));
  }

  const stats = await patientService.getPatientStats(clinicId, branchId);

  res.status(200).json({
    status: 'success',
    data: {
      clinicId,
      branchId,
      stats,
    },
  });
});

export const getDropdownOptions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.user!.clinicId?.toString();

  if (!clinicId) {
    return next(new AppError('กรุณาระบุ clinic ID', 400));
  }

  const options = await patientService.getDropdownOptions(clinicId);

  res.status(200).json({
    status: 'success',
    data: {
      options,
    },
  });
});