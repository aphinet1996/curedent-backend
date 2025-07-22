// import { Request, Response, NextFunction } from 'express';
// import { catchAsync, AppError } from '../middlewares/error.middleware';
// import { DoctorService } from '../services/doctor.service';
// import { toDoctorResponse, doctorResponseBuilders, DoctorOptionResponse } from '../types/doctor.types';
// import { UserRole } from '../types/user.types';

// const doctorService = new DoctorService();

// export const getOptionDoctors = catchAsync(async (req: Request, res: Response) => {
//     const filter: any = { isActive: true };
//     if (req.query.clinicId) filter.clinicId = req.query.clinicId;
//     if (req.query.specialty) {
//       const specialtyRegex = new RegExp(req.query.specialty as string, 'i');
//       filter.specialty = specialtyRegex;
//     }
//     if (req.query.search) {
//       const searchRegex = new RegExp(req.query.search as string, 'i');
//       filter.$or = [
//         { name: searchRegex },
//         { surname: searchRegex },
//         { nickname: searchRegex },
//         { specialty: searchRegex }
//       ];
//     }
//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//       filter.clinicId = req.user!.clinicId;
//     }
  
//     const sortField = (req.query.sortBy as string) || 'name';
//     const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  
//     const { doctors } = await doctorService.findAllLean(filter, { [sortField]: sortOrder });
  
//     res.status(200).json({
//       status: 'success',
//       data: {
//         doctors: doctors.map(doctorResponseBuilders.option) as DoctorOptionResponse[] // ใช้ doctorResponseBuilders.option
//       }
//     });
//   });

// export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
//     const filter: any = {};

//     if (req.query.clinicId) filter.clinicId = req.query.clinicId;
//     if (req.query.specialty) {
//         const specialtyRegex = new RegExp(req.query.specialty as string, 'i');
//         filter.specialty = specialtyRegex;
//     }

//     if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
//     if (req.query.search) {
//         const searchRegex = new RegExp(req.query.search as string, 'i');
//         filter.$or = [
//             { name: searchRegex },
//             { surname: searchRegex },
//             { nickname: searchRegex },
//             { specialty: searchRegex }
//         ];
//     }

//     if (req.query.color) {
//         filter.color = req.query.color;
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//         filter.clinicId = req.user!.clinicId;
//     }

//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const sortField = (req.query.sortBy as string) || 'name';
//     const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

//     const { doctors, total, totalPages } = await doctorService.findAll(
//         filter,
//         { [sortField]: sortOrder },
//         page,
//         limit
//     );

//     res.status(200).json({
//         status: 'success',
//         results: doctors.length,
//         pagination: {
//             total,
//             page,
//             limit,
//             totalPages,
//         },
//         data: {
//             doctors: doctors.map(doctor => toDoctorResponse(doctor)),
//         },
//     });
// });

// export const getDoctorById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorId = req.params.id;

//     const doctor = await doctorService.findById(doctorId);

//     if (!doctor) {
//         return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
//     }

//     if (!req.user!.clinicId) {
//         return next(new AppError('ไม่พบ clinicId ในข้อมูลผู้ใช้', 400));
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//         const getObjectIdString = (obj: any): string => {
//             if (typeof obj === 'string') return obj;
//             if (obj && obj._id) return obj._id.toString();
//             if (obj && obj.toString) return obj.toString();
//             return '';
//         };

//         const doctorClinicId = getObjectIdString(doctor.clinicId);
//         const userClinicId = getObjectIdString(req.user!.clinicId);

//         if (doctorClinicId !== userClinicId) {
//             return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลหมอนี้', 403));
//         }
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             doctor: toDoctorResponse(doctor),
//         },
//     });
// });

// export const createDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorData = req.body;

//     if (typeof doctorData.branches === 'string') {
//         try {
//             doctorData.branches = JSON.parse(doctorData.branches);
//         } catch (error) {
//             return next(new AppError('Invalid branches format, must be a valid JSON array', 400));
//         }
//     }

//     if (doctorData.branches && !Array.isArray(doctorData.branches)) {
//         return next(new AppError('branches must be an array', 400));
//     }

//     if (req.file) {
//         doctorData.photo = `/uploads/doctors/${req.file.filename}`;
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//         if (!doctorData.clinicId || doctorData.clinicId.toString() !== req.user!.clinicId?.toString()) {
//             doctorData.clinicId = req.user!.clinicId as string;
//         }
//     }

//     if (!doctorData.color) {
//         doctorData.color = await doctorService.getAvailableColorForClinic(doctorData.clinicId);
//     }

//     const newDoctor = await doctorService.createDoctor(doctorData);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             doctor: toDoctorResponse(newDoctor),
//         },
//     });
// });

// export const updateDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorId = req.params.id;
//     const updateData = req.body;

//     if (typeof updateData.branches === 'string') {
//         try {
//             updateData.branches = JSON.parse(updateData.branches);
//         } catch (error) {
//             return next(new AppError('Invalid branches format, must be a valid JSON array', 400));
//         }
//     }

//     if (updateData.branches && !Array.isArray(updateData.branches)) {
//         return next(new AppError('branches must be an array', 400));
//     }

//     if (req.file) {
//         updateData.photo = `/uploads/doctors/${req.file.filename}`;
//     }

//     const doctor = await doctorService.findById(doctorId);

//     if (!doctor) {
//         return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//         const getObjectIdString = (obj: any): string => {
//             if (typeof obj === 'string') return obj;
//             if (obj && obj._id) return obj._id.toString();
//             if (obj && obj.toString) return obj.toString();
//             return '';
//         };

//         const doctorClinicId = getObjectIdString(doctor.clinicId);
//         const userClinicId = getObjectIdString(req.user!.clinicId);

//         if (doctorClinicId !== userClinicId) {
//             return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลหมอนี้', 403));
//         }
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN && updateData.clinicId) {
//         delete updateData.clinicId;
//     }

//     const updatedDoctor = await doctorService.updateDoctor(doctorId, updateData);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             doctor: toDoctorResponse(updatedDoctor!),
//         },
//     });
// });

// export const updateDoctorColor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorId = req.params.id;
//     const { color } = req.body;

//     const doctor = await doctorService.findById(doctorId);

//     if (!doctor) {
//         return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN) {
//         const getObjectIdString = (obj: any): string => {
//             if (typeof obj === 'string') return obj;
//             if (obj && obj._id) return obj._id.toString();
//             if (obj && obj.toString) return obj.toString();
//             return '';
//         };

//         const doctorClinicId = getObjectIdString(doctor.clinicId);
//         const userClinicId = getObjectIdString(req.user!.clinicId);

//         if (doctorClinicId !== userClinicId) {
//             return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสีหมอนี้', 403));
//         }
//     }

//     const updatedDoctor = await doctorService.updateDoctorColor(doctorId, color);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             doctor: toDoctorResponse(updatedDoctor!),
//         },
//     });
// });

// export const updateDoctorStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorId = req.params.id;
//     const { isActive } = req.body;

//     const doctor = await doctorService.findById(doctorId);

//     if (!doctor) {
//         return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN &&
//         doctor.clinicId.toString() !== req.user!.clinicId?.toString()) {
//         return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสถานะหมอนี้', 403));
//     }

//     const updatedDoctor = await doctorService.updateDoctorStatus(doctorId, isActive);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             doctor: toDoctorResponse(updatedDoctor!),
//         },
//     });
// });

// export const getUsedColorsInClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     let clinicId: string;

//     if (req.user!.roles === UserRole.SUPER_ADMIN && req.query.clinicId) {
//         clinicId = req.query.clinicId as string;
//     } else {
//         clinicId = req.user!.clinicId as string;
//     }

//     if (!clinicId) {
//         return next(new AppError('ไม่พบ clinicId', 400));
//     }

//     const usedColors = await doctorService.getUsedColorsInClinic(clinicId);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             usedColors,
//         },
//     });
// });

// export const getSuggestedColorForClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     let clinicId: string;

//     if (req.user!.roles === UserRole.SUPER_ADMIN && req.query.clinicId) {
//         clinicId = req.query.clinicId as string;
//     } else {
//         clinicId = req.user!.clinicId as string;
//     }

//     if (!clinicId) {
//         return next(new AppError('ไม่พบ clinicId', 400));
//     }

//     const suggestedColor = await doctorService.getAvailableColorForClinic(clinicId);

//     res.status(200).json({
//         status: 'success',
//         data: {
//             suggestedColor,
//         },
//     });
// });

// export const deleteDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const doctorId = req.params.id;

//     const doctor = await doctorService.findById(doctorId);

//     if (!doctor) {
//         return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
//     }

//     if (req.user!.roles !== UserRole.SUPER_ADMIN &&
//         doctor.clinicId.toString() !== req.user!.clinicId?.toString()) {
//         return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูลหมอนี้', 403));
//     }

//     await doctorService.deleteDoctor(doctorId);

//     res.status(200).json({
//         status: 'success',
//         data: null,
//     });
// });

import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { DoctorService } from '../services/doctor.service';
import { toDoctorResponse, doctorResponseBuilders, DoctorOptionResponse } from '../types/doctor.types';
import { UserRole } from '../types/user.types';

const doctorService = new DoctorService();

export const getOptionDoctors = catchAsync(async (req: Request, res: Response) => {
    const filter: any = { isActive: true };
    if (req.query.clinicId) filter.clinicId = req.query.clinicId;
    if (req.query.specialty) {
      const specialtyRegex = new RegExp(req.query.specialty as string, 'i');
      filter.specialty = specialtyRegex;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { surname: searchRegex },
        { nickname: searchRegex },
        { specialty: searchRegex }
      ];
    }
    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
      filter.clinicId = req.user!.clinicId;
    }
  
    const sortField = (req.query.sortBy as string) || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  
    const { doctors } = await doctorService.findAllLean(filter, { [sortField]: sortOrder });
  
    res.status(200).json({
      status: 'success',
      data: {
        doctors: doctors.map(doctor => doctorResponseBuilders.option(doctor, req)) as DoctorOptionResponse[]
      }
    });
  });

export const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
    const filter: any = {};

    if (req.query.clinicId) filter.clinicId = req.query.clinicId;
    if (req.query.specialty) {
        const specialtyRegex = new RegExp(req.query.specialty as string, 'i');
        filter.specialty = specialtyRegex;
    }

    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search as string, 'i');
        filter.$or = [
            { name: searchRegex },
            { surname: searchRegex },
            { nickname: searchRegex },
            { specialty: searchRegex }
        ];
    }

    if (req.query.color) {
        filter.color = req.query.color;
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        filter.clinicId = req.user!.clinicId;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortBy as string) || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const { doctors, total, totalPages } = await doctorService.findAll(
        filter,
        { [sortField]: sortOrder },
        page,
        limit
    );

    res.status(200).json({
        status: 'success',
        results: doctors.length,
        pagination: {
            total,
            page,
            limit,
            totalPages,
        },
        data: {
            doctors: doctors.map(doctor => toDoctorResponse(doctor, req)),
        },
    });
});

export const getDoctorById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorId = req.params.id;

    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
        return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
    }

    if (!req.user!.clinicId) {
        return next(new AppError('ไม่พบ clinicId ในข้อมูลผู้ใช้', 400));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const getObjectIdString = (obj: any): string => {
            if (typeof obj === 'string') return obj;
            if (obj && obj._id) return obj._id.toString();
            if (obj && obj.toString) return obj.toString();
            return '';
        };

        const doctorClinicId = getObjectIdString(doctor.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (doctorClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลหมอนี้', 403));
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            doctor: toDoctorResponse(doctor, req),
        },
    });
});

export const createDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorData = req.body;

    if (typeof doctorData.branches === 'string') {
        try {
            doctorData.branches = JSON.parse(doctorData.branches);
        } catch (error) {
            return next(new AppError('Invalid branches format, must be a valid JSON array', 400));
        }
    }

    if (doctorData.branches && !Array.isArray(doctorData.branches)) {
        return next(new AppError('branches must be an array', 400));
    }

    if (req.file) {
        doctorData.photo = `/uploads/doctors/${req.file.filename}`;
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        if (!doctorData.clinicId || doctorData.clinicId.toString() !== req.user!.clinicId?.toString()) {
            doctorData.clinicId = req.user!.clinicId as string;
        }
    }

    if (!doctorData.color) {
        doctorData.color = await doctorService.getAvailableColorForClinic(doctorData.clinicId);
    }

    const newDoctor = await doctorService.createDoctor(doctorData);

    res.status(201).json({
        status: 'success',
        data: {
            doctor: toDoctorResponse(newDoctor, req),
        },
    });
});

export const updateDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorId = req.params.id;
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
        updateData.photo = `/uploads/doctors/${req.file.filename}`;
    }

    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
        return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const getObjectIdString = (obj: any): string => {
            if (typeof obj === 'string') return obj;
            if (obj && obj._id) return obj._id.toString();
            if (obj && obj.toString) return obj.toString();
            return '';
        };

        const doctorClinicId = getObjectIdString(doctor.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (doctorClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลหมอนี้', 403));
        }
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN && updateData.clinicId) {
        delete updateData.clinicId;
    }

    const updatedDoctor = await doctorService.updateDoctor(doctorId, updateData);

    res.status(200).json({
        status: 'success',
        data: {
            doctor: toDoctorResponse(updatedDoctor!, req),
        },
    });
});

export const updateDoctorColor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorId = req.params.id;
    const { color } = req.body;

    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
        return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN) {
        const getObjectIdString = (obj: any): string => {
            if (typeof obj === 'string') return obj;
            if (obj && obj._id) return obj._id.toString();
            if (obj && obj.toString) return obj.toString();
            return '';
        };

        const doctorClinicId = getObjectIdString(doctor.clinicId);
        const userClinicId = getObjectIdString(req.user!.clinicId);

        if (doctorClinicId !== userClinicId) {
            return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสีหมอนี้', 403));
        }
    }

    const updatedDoctor = await doctorService.updateDoctorColor(doctorId, color);

    res.status(200).json({
        status: 'success',
        data: {
            doctor: toDoctorResponse(updatedDoctor!, req),
        },
    });
});

export const updateDoctorStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorId = req.params.id;
    const { isActive } = req.body;

    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
        return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        doctor.clinicId.toString() !== req.user!.clinicId?.toString()) {
        return next(new AppError('คุณไม่มีสิทธิ์อัปเดตสถานะหมอนี้', 403));
    }

    const updatedDoctor = await doctorService.updateDoctorStatus(doctorId, isActive);

    res.status(200).json({
        status: 'success',
        data: {
            doctor: toDoctorResponse(updatedDoctor!, req),
        },
    });
});

export const getUsedColorsInClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let clinicId: string;

    if (req.user!.roles === UserRole.SUPER_ADMIN && req.query.clinicId) {
        clinicId = req.query.clinicId as string;
    } else {
        clinicId = req.user!.clinicId as string;
    }

    if (!clinicId) {
        return next(new AppError('ไม่พบ clinicId', 400));
    }

    const usedColors = await doctorService.getUsedColorsInClinic(clinicId);

    res.status(200).json({
        status: 'success',
        data: {
            usedColors,
        },
    });
});

export const getSuggestedColorForClinic = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let clinicId: string;

    if (req.user!.roles === UserRole.SUPER_ADMIN && req.query.clinicId) {
        clinicId = req.query.clinicId as string;
    } else {
        clinicId = req.user!.clinicId as string;
    }

    if (!clinicId) {
        return next(new AppError('ไม่พบ clinicId', 400));
    }

    const suggestedColor = await doctorService.getAvailableColorForClinic(clinicId);

    res.status(200).json({
        status: 'success',
        data: {
            suggestedColor,
        },
    });
});

export const deleteDoctor = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doctorId = req.params.id;

    const doctor = await doctorService.findById(doctorId);

    if (!doctor) {
        return next(new AppError('ไม่พบข้อมูลหมอนี้', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN &&
        doctor.clinicId.toString() !== req.user!.clinicId?.toString()) {
        return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูลหมอนี้', 403));
    }

    await doctorService.deleteDoctor(doctorId);

    res.status(200).json({
        status: 'success',
        data: null,
    });
});