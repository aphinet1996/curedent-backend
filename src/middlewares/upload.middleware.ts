// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { Request } from 'express';
// import { AppError } from './error.middleware';

// interface UploadConfig {
//   destination: string;
//   filePrefix: string;
//   maxSize?: number;
//   allowedTypes?: string[];
//   fieldName?: string;
// }

// // Default configuration
// const DEFAULT_CONFIG = {
//   maxSize: 5 * 1024 * 1024, // 5MB
//   allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
//   fieldName: 'photo'
// };

// const createStorage = (destination: string, filePrefix: string) => {
//   return multer.diskStorage({
//     destination: (req: Request, file: Express.Multer.File, cb) => {
//       if (!fs.existsSync(destination)) {
//         fs.mkdirSync(destination, { recursive: true });
//       }
//       cb(null, destination);
//     },
//     filename: (req: Request, file: Express.Multer.File, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const fileExtension = path.extname(file.originalname);
//       cb(null, filePrefix + uniqueSuffix + fileExtension);
//     }
//   });
// };

// const createFileFilter = (allowedTypes: string[]) => {
//   return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       const allowedExtensions = allowedTypes
//         .map(type => type.split('/')[1])
//         .join(', ');
//       cb(new AppError(`กรุณาอัปโหลดไฟล์ประเภท ${allowedExtensions} เท่านั้น`, 400));
//     }
//   };
// };

// export const createUploadMiddleware = (config: UploadConfig) => {
//   const finalConfig = {
//     ...DEFAULT_CONFIG,
//     ...config
//   };

//   const storage = createStorage(finalConfig.destination, finalConfig.filePrefix);
//   const fileFilter = createFileFilter(finalConfig.allowedTypes!);

//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: finalConfig.maxSize,
//     }
//   }).single(finalConfig.fieldName);
// };

// export const createMultipleUploadMiddleware = (
//   config: UploadConfig,
//   maxFiles: number = 5
// ) => {
//   const finalConfig = {
//     ...DEFAULT_CONFIG,
//     ...config
//   };

//   const storage = createStorage(finalConfig.destination, finalConfig.filePrefix);
//   const fileFilter = createFileFilter(finalConfig.allowedTypes!);

//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: finalConfig.maxSize,
//     }
//   }).array(finalConfig.fieldName, maxFiles);
// };

// export const createFieldsUploadMiddleware = (
//   configs: Array<{ name: string; config: UploadConfig; maxCount?: number }>
// ) => {
//   const baseConfig = {
//     ...DEFAULT_CONFIG,
//     ...configs[0].config
//   };

//   const storage = createStorage(baseConfig.destination, baseConfig.filePrefix);
//   const fileFilter = createFileFilter(baseConfig.allowedTypes!);

//   const fields = configs.map(({ name, maxCount = 1 }) => ({
//     name,
//     maxCount
//   }));

//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: baseConfig.maxSize,
//     }
//   }).fields(fields);
// };

// export const uploadDoctorPhoto = createUploadMiddleware({
//   destination: 'uploads/doctors/',
//   filePrefix: 'doctor-',
//   fieldName: 'photo'
// });

// export const uploadAssistantPhoto = createUploadMiddleware({
//   destination: 'uploads/assistants/',
//   filePrefix: 'assistant-',
//   fieldName: 'photo'
// });

// export const uploadClinicLogo = createUploadMiddleware({
//   destination: 'uploads/clinics/',
//   filePrefix: 'clinic-logo-',
//   fieldName: 'logo'
// });

// export const uploadBranchPhoto = createUploadMiddleware({
//   destination: 'uploads/branches/',
//   filePrefix: 'branch-',
//   fieldName: 'photo'
// });

// export const uploadUserPhoto = createUploadMiddleware({
//   destination: 'uploads/users/',
//   filePrefix: 'user-',
//   fieldName: 'photo'
// });

// export const uploadPatientPhoto = createUploadMiddleware({
//   destination: 'uploads/patients/',
//   filePrefix: 'patient-',
//   fieldName: 'photo'
// });

// export const uploadProductPhoto = createUploadMiddleware({
//   destination: 'uploads/products/',
//   filePrefix: 'product-',
//   fieldName: 'photo'
// });

// export const uploadDocument = createUploadMiddleware({
//   destination: 'uploads/documents/',
//   filePrefix: 'doc-',
//   maxSize: 10 * 1024 * 1024, // 10MB
//   allowedTypes: [
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     'text/plain'
//   ],
//   fieldName: 'document'
// });

// export const uploadMixedFiles = createFieldsUploadMiddleware([
//   {
//     name: 'photo',
//     config: {
//       destination: 'uploads/mixed/',
//       filePrefix: 'img-',
//       allowedTypes: DEFAULT_CONFIG.allowedTypes
//     },
//     maxCount: 5
//   },
//   {
//     name: 'document',
//     config: {
//       destination: 'uploads/mixed/',
//       filePrefix: 'doc-',
//       allowedTypes: [
//         'application/pdf',
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//       ]
//     },
//     maxCount: 3
//   }
// ]);

// export const uploadMultiplePhotos = (destination: string, prefix: string, maxFiles: number = 5) => {
//   return createMultipleUploadMiddleware({
//     destination,
//     filePrefix: prefix,
//     fieldName: 'photos'
//   }, maxFiles);
// };

// export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
//   if (error instanceof multer.MulterError) {
//     switch (error.code) {
//       case 'LIMIT_FILE_SIZE':
//         return next(new AppError('ขนาดไฟล์เกินที่กำหนด', 400));
//       case 'LIMIT_FILE_COUNT':
//         return next(new AppError('จำนวนไฟล์เกินที่กำหนด', 400));
//       case 'LIMIT_UNEXPECTED_FILE':
//         return next(new AppError('พบไฟล์ที่ไม่คาดคิด', 400));
//       case 'LIMIT_FIELD_COUNT':
//         return next(new AppError('จำนวน field เกินที่กำหนด', 400));
//       case 'LIMIT_FIELD_KEY':
//         return next(new AppError('ชื่อ field ยาวเกินไป', 400));
//       case 'LIMIT_FIELD_VALUE':
//         return next(new AppError('ค่าใน field ยาวเกินไป', 400));
//       case 'LIMIT_PART_COUNT':
//         return next(new AppError('จำนวน part เกินที่กำหนด', 400));
//       default:
//         return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 400));
//     }
//   }

//   if (error instanceof AppError) {
//     return next(error);
//   }

//   next(new AppError('เกิดข้อผิดพลาดที่ไม่คาดคิด', 500));
// };

// export const ensureUploadDirectories = () => {
//   const directories = [
//     'uploads/doctors',
//     'uploads/assistants',
//     'uploads/clinics',
//     'uploads/branches',
//     'uploads/users',
//     'uploads/patients',
//     'uploads/products',
//     'uploads/documents',
//     'uploads/mixed'
//   ];

//   directories.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`📁 Created upload directory: ${dir}`);
//     }
//   });
// };

// export const deleteFile = (filePath: string): boolean => {
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       return true;
//     }
//     return false;
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     return false;
//   }
// };

// export const deleteOldFile = (oldFilePath?: string) => {
//   if (oldFilePath && oldFilePath !== '') {
//     const fullPath = path.join(process.cwd(), oldFilePath);
//     deleteFile(fullPath);
//   }
// };

// export const getFileSize = (filePath: string): number => {
//   try {
//     const stats = fs.statSync(filePath);
//     return stats.size;
//   } catch (error) {
//     return 0;
//   }
// };

// export const fileExists = (filePath: string): boolean => {
//   return fs.existsSync(filePath);
// };

// export const generateFileUrl = (req: Request, filePath: string): string => {
//   const baseUrl = `${req.protocol}://${req.get('host')}`;
//   return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
// };

// export const UPLOAD_CONFIGS = {
//   DOCTOR: {
//     destination: 'uploads/doctors/',
//     filePrefix: 'doctor-',
//     maxSize: 5 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   ASSISTANT: {
//     destination: 'uploads/assistants/',
//     filePrefix: 'assistant-',
//     maxSize: 5 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   CLINIC: {
//     destination: 'uploads/clinics/',
//     filePrefix: 'clinic-',
//     maxSize: 2 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   BRANCH: {
//     destination: 'uploads/branches/',
//     filePrefix: 'branch-',
//     maxSize: 3 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   USER: {
//     destination: 'uploads/users/',
//     filePrefix: 'user-',
//     maxSize: 2 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   PATIENT: {
//     destination: 'uploads/patients/',
//     filePrefix: 'patient-',
//     maxSize: 5 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   PRODUCT: {
//     destination: 'uploads/products/',
//     filePrefix: 'product-',
//     maxSize: 3 * 1024 * 1024,
//     allowedTypes: DEFAULT_CONFIG.allowedTypes
//   },
//   DOCUMENT: {
//     destination: 'uploads/documents/',
//     filePrefix: 'doc-',
//     maxSize: 10 * 1024 * 1024,
//     allowedTypes: [
//       'application/pdf',
//       'application/msword',
//       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'application/vnd.ms-excel',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'text/plain'
//     ]
//   }
// } as const;

// export default {
//   createUploadMiddleware,
//   createMultipleUploadMiddleware,
//   createFieldsUploadMiddleware,
//   uploadDoctorPhoto,
//   uploadAssistantPhoto,
//   uploadClinicLogo,
//   uploadBranchPhoto,
//   uploadUserPhoto,
//   uploadPatientPhoto,
//   uploadProductPhoto,
//   uploadDocument,
//   uploadMixedFiles,
//   uploadMultiplePhotos,
//   handleMulterError,
//   ensureUploadDirectories,
//   deleteFile,
//   deleteOldFile,
//   generateFileUrl,
//   UPLOAD_CONFIGS
// };

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './error.middleware';

interface UploadConfig {
  destination: string;
  filePrefix: string;
  maxSize?: number;
  allowedTypes?: string[];
  fieldName?: string;
}

// Default configuration
const DEFAULT_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  fieldName: 'photo'
};

const createStorage = (destination: string, filePrefix: string) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
      }
      cb(null, destination);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, filePrefix + uniqueSuffix + fileExtension);
    }
  });
};

const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const allowedExtensions = allowedTypes
        .map(type => type.split('/')[1])
        .join(', ');
      cb(new AppError(`กรุณาอัปโหลดไฟล์ประเภท ${allowedExtensions} เท่านั้น`, 400));
    }
  };
};

export const createUploadMiddleware = (config: UploadConfig) => {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const storage = createStorage(finalConfig.destination, finalConfig.filePrefix);
  const fileFilter = createFileFilter(finalConfig.allowedTypes!);

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: finalConfig.maxSize,
    }
  }).single(finalConfig.fieldName);
};

export const createMultipleUploadMiddleware = (
  config: UploadConfig,
  maxFiles: number = 5
) => {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const storage = createStorage(finalConfig.destination, finalConfig.filePrefix);
  const fileFilter = createFileFilter(finalConfig.allowedTypes!);

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: finalConfig.maxSize,
    }
  }).array(finalConfig.fieldName, maxFiles);
};

export const createFieldsUploadMiddleware = (
  configs: Array<{ name: string; config: UploadConfig; maxCount?: number }>
) => {
  const baseConfig = {
    ...DEFAULT_CONFIG,
    ...configs[0].config
  };

  const storage = createStorage(baseConfig.destination, baseConfig.filePrefix);
  const fileFilter = createFileFilter(baseConfig.allowedTypes!);

  const fields = configs.map(({ name, maxCount = 1 }) => ({
    name,
    maxCount
  }));

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: baseConfig.maxSize,
    }
  }).fields(fields);
};

export const uploadDoctorPhoto = createUploadMiddleware({
  destination: 'uploads/doctors/',
  filePrefix: 'doctor-',
  fieldName: 'photo'
});

export const uploadAssistantPhoto = createUploadMiddleware({
  destination: 'uploads/assistants/',
  filePrefix: 'assistant-',
  fieldName: 'photo'
});

export const uploadClinicLogo = createUploadMiddleware({
  destination: 'uploads/clinics/',
  filePrefix: 'clinic-logo-',
  fieldName: 'logo'
});

export const uploadBranchPhoto = createUploadMiddleware({
  destination: 'uploads/branches/',
  filePrefix: 'branch-',
  fieldName: 'photo'
});

export const uploadUserPhoto = createUploadMiddleware({
  destination: 'uploads/users/',
  filePrefix: 'user-',
  fieldName: 'photo'
});

export const uploadPatientPhoto = createUploadMiddleware({
  destination: 'uploads/patients/',
  filePrefix: 'patient-',
  fieldName: 'photo'
});

export const uploadProductPhoto = createUploadMiddleware({
  destination: 'uploads/products/',
  filePrefix: 'product-',
  fieldName: 'photo'
});

export const uploadDocument = createUploadMiddleware({
  destination: 'uploads/documents/',
  filePrefix: 'doc-',
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  fieldName: 'document'
});

export const uploadMixedFiles = createFieldsUploadMiddleware([
  {
    name: 'photo',
    config: {
      destination: 'uploads/mixed/',
      filePrefix: 'img-',
      allowedTypes: DEFAULT_CONFIG.allowedTypes
    },
    maxCount: 5
  },
  {
    name: 'document',
    config: {
      destination: 'uploads/mixed/',
      filePrefix: 'doc-',
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    },
    maxCount: 3
  }
]);

export const uploadMultiplePhotos = (destination: string, prefix: string, maxFiles: number = 5) => {
  return createMultipleUploadMiddleware({
    destination,
    filePrefix: prefix,
    fieldName: 'photos'
  }, maxFiles);
};

export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new AppError('ขนาดไฟล์เกินที่กำหนด', 400));
      case 'LIMIT_FILE_COUNT':
        return next(new AppError('จำนวนไฟล์เกินที่กำหนด', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new AppError('พบไฟล์ที่ไม่คาดคิด', 400));
      case 'LIMIT_FIELD_COUNT':
        return next(new AppError('จำนวน field เกินที่กำหนด', 400));
      case 'LIMIT_FIELD_KEY':
        return next(new AppError('ชื่อ field ยาวเกินไป', 400));
      case 'LIMIT_FIELD_VALUE':
        return next(new AppError('ค่าใน field ยาวเกินไป', 400));
      case 'LIMIT_PART_COUNT':
        return next(new AppError('จำนวน part เกินที่กำหนด', 400));
      default:
        return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 400));
    }
  }

  if (error instanceof AppError) {
    return next(error);
  }

  next(new AppError('เกิดข้อผิดพลาดที่ไม่คาดคิด', 500));
};

export const ensureUploadDirectories = () => {
  const directories = [
    'uploads/doctors',
    'uploads/assistants',
    'uploads/clinics',
    'uploads/branches',
    'uploads/users',
    'uploads/patients',
    'uploads/products',
    'uploads/documents',
    'uploads/mixed'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${dir}`);
    }
  });
};

export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export const deleteOldFile = (oldFilePath?: string) => {
  if (oldFilePath && oldFilePath !== '') {
    const fullPath = path.join(process.cwd(), oldFilePath);
    deleteFile(fullPath);
  }
};

export const getFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

// Updated generateFileUrl function to handle reverse proxy
export const generateFileUrl = (req: Request, filePath: string): string => {
  if (!filePath) return '';

  // Check if filePath is already a full URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Get the protocol from headers (for reverse proxy)
  const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';

  // Get the host from headers (for reverse proxy)
  const host = req.get('X-Forwarded-Host') || req.get('Host') || req.get('host');

  // Clean the file path
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const normalizedPath = cleanPath.replace(/\\/g, '/');

  return `${protocol}://${host}${normalizedPath}`;
};

// Helper function to convert relative path to full URL
export const convertToFullUrl = (req: Request, relativePath?: string): string | undefined => {
  if (!relativePath) return undefined;
  return generateFileUrl(req, relativePath);
};

// Middleware to add proxy headers context to req object
export const proxyHeadersMiddleware = (req: Request, res: any, next: any) => {
  // Add helper methods to request object
  (req as any).getBaseUrl = () => {
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('X-Forwarded-Host') || req.get('Host') || req.get('host');
    return `${protocol}://${host}`;
  };

  (req as any).toFullUrl = (path: string) => {
    if (!path) return '';
    return generateFileUrl(req, path);
  };

  next();
};

export const UPLOAD_CONFIGS = {
  DOCTOR: {
    destination: 'uploads/doctors/',
    filePrefix: 'doctor-',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  ASSISTANT: {
    destination: 'uploads/assistants/',
    filePrefix: 'assistant-',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  CLINIC: {
    destination: 'uploads/clinics/',
    filePrefix: 'clinic-',
    maxSize: 2 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  BRANCH: {
    destination: 'uploads/branches/',
    filePrefix: 'branch-',
    maxSize: 3 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  USER: {
    destination: 'uploads/users/',
    filePrefix: 'user-',
    maxSize: 2 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  PATIENT: {
    destination: 'uploads/patients/',
    filePrefix: 'patient-',
    maxSize: 5 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  PRODUCT: {
    destination: 'uploads/products/',
    filePrefix: 'product-',
    maxSize: 3 * 1024 * 1024,
    allowedTypes: DEFAULT_CONFIG.allowedTypes
  },
  DOCUMENT: {
    destination: 'uploads/documents/',
    filePrefix: 'doc-',
    maxSize: 10 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  }
} as const;

export default {
  createUploadMiddleware,
  createMultipleUploadMiddleware,
  createFieldsUploadMiddleware,
  uploadDoctorPhoto,
  uploadAssistantPhoto,
  uploadClinicLogo,
  uploadBranchPhoto,
  uploadUserPhoto,
  uploadPatientPhoto,
  uploadProductPhoto,
  uploadDocument,
  uploadMixedFiles,
  uploadMultiplePhotos,
  handleMulterError,
  ensureUploadDirectories,
  deleteFile,
  deleteOldFile,
  generateFileUrl,
  convertToFullUrl,
  proxyHeadersMiddleware,
  UPLOAD_CONFIGS
};