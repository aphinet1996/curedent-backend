import path from 'path';

type AllowedExtension = '.jpg' | '.jpeg' | '.png' | '.gif' | '.webp' | 
                       '.pdf' | '.doc' | '.docx' | '.xls' | '.xlsx' | 
                       '.ppt' | '.pptx' | '.txt' | '.csv';

type BlockedExtension = '.exe' | '.bat' | '.cmd' | '.scr' | '.pif' | 
                       '.vbs' | '.js' | '.jar' | '.com' | '.msi' | 
                       '.dll' | '.app' | '.deb' | '.rpm';

// Environment Variables with Defaults
export const UPLOAD_ENV = {
  MAX_FILE_SIZE: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '5242880'), // 5MB
  MAX_FILES: parseInt(process.env.UPLOAD_MAX_FILES || '10'),
  BASE_PATH: process.env.UPLOAD_BASE_PATH || 'uploads',
  ALLOWED_IMAGE_TYPES: process.env.UPLOAD_ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  ALLOWED_DOCUMENT_TYPES: process.env.UPLOAD_ALLOWED_DOCUMENT_TYPES?.split(',') || [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
} as const;

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: {
    SMALL: 1 * 1024 * 1024,      // 1MB
    MEDIUM: 3 * 1024 * 1024,     // 3MB
    LARGE: 5 * 1024 * 1024,      // 5MB
    XLARGE: 10 * 1024 * 1024     // 10MB
  },
  DOCUMENT: {
    SMALL: 2 * 1024 * 1024,      // 2MB
    MEDIUM: 5 * 1024 * 1024,     // 5MB
    LARGE: 10 * 1024 * 1024,     // 10MB
    XLARGE: 20 * 1024 * 1024     // 20MB
  }
} as const;

// Upload Destinations
export const UPLOAD_DESTINATIONS = {
  DOCTORS: 'uploads/doctors/',
  ASSISTANTS: 'uploads/assistants/',
  USERS: 'uploads/users/',
  PATIENTS: 'uploads/patients/',
  CLINICS: 'uploads/clinics/',
  BRANCHES: 'uploads/branches/',
  PRODUCTS: 'uploads/products/',
  EQUIPMENT: 'uploads/equipment/',
  DOCUMENTS: 'uploads/documents/',
  REPORTS: 'uploads/reports/',
  CERTIFICATES: 'uploads/certificates/',
  GALLERY: 'uploads/gallery/',
  VIDEOS: 'uploads/videos/',
  TEMP: 'uploads/temp/',
  CUSTOM: 'uploads/custom/'
} as const;

// File Prefixes
export const FILE_PREFIXES = {
  DOCTOR: 'doctor-',
  ASSISTANT: 'assistant-',
  USER: 'user-',
  PATIENT: 'patient-',
  CLINIC: 'clinic-',
  BRANCH: 'branch-',
  PRODUCT: 'product-',
  EQUIPMENT: 'equipment-',
  DOCUMENT: 'doc-',
  REPORT: 'report-',
  CERTIFICATE: 'cert-',
  GALLERY: 'gallery-',
  VIDEO: 'video-',
  TEMP: 'temp-'
} as const;

// MIME Types
export const MIME_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ],
  VIDEOS: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv'
  ],
  AUDIO: [
    'audio/mp3',
    'audio/wav',
    'audio/ogg'
  ]
} as const;

// Upload Configurations
export const UPLOAD_CONFIGS = {
  DOCTOR_PHOTO: {
    destination: UPLOAD_DESTINATIONS.DOCTORS,
    filePrefix: FILE_PREFIXES.DOCTOR,
    maxSize: FILE_SIZE_LIMITS.IMAGE.MEDIUM,
    allowedTypes: MIME_TYPES.IMAGES.slice(0, 5),
    fieldName: 'photo'
  },
  ASSISTANT_PHOTO: {
    destination: UPLOAD_DESTINATIONS.ASSISTANTS,
    filePrefix: FILE_PREFIXES.ASSISTANT,
    maxSize: FILE_SIZE_LIMITS.IMAGE.MEDIUM,
    allowedTypes: MIME_TYPES.IMAGES.slice(0, 5),
    fieldName: 'photo'
  },
  USER_PHOTO: {
    destination: UPLOAD_DESTINATIONS.USERS,
    filePrefix: FILE_PREFIXES.USER,
    maxSize: FILE_SIZE_LIMITS.IMAGE.SMALL,
    allowedTypes: MIME_TYPES.IMAGES.slice(0, 5),
    fieldName: 'photo'
  },
  PATIENT_PHOTO: {
    destination: UPLOAD_DESTINATIONS.PATIENTS,
    filePrefix: FILE_PREFIXES.PATIENT,
    maxSize: FILE_SIZE_LIMITS.IMAGE.LARGE,
    allowedTypes: MIME_TYPES.IMAGES,
    fieldName: 'photo'
  },
  CLINIC_LOGO: {
    destination: UPLOAD_DESTINATIONS.CLINICS,
    filePrefix: FILE_PREFIXES.CLINIC,
    maxSize: FILE_SIZE_LIMITS.IMAGE.MEDIUM,
    allowedTypes: [...MIME_TYPES.IMAGES, 'image/svg+xml'],
    fieldName: 'logo'
  },
  BRANCH_PHOTO: {
    destination: UPLOAD_DESTINATIONS.BRANCHES,
    filePrefix: FILE_PREFIXES.BRANCH,
    maxSize: FILE_SIZE_LIMITS.IMAGE.LARGE,
    allowedTypes: MIME_TYPES.IMAGES,
    fieldName: 'photo'
  },
  PRODUCT_PHOTO: {
    destination: UPLOAD_DESTINATIONS.PRODUCTS,
    filePrefix: FILE_PREFIXES.PRODUCT,
    maxSize: FILE_SIZE_LIMITS.IMAGE.MEDIUM,
    allowedTypes: MIME_TYPES.IMAGES.slice(0, 5),
    fieldName: 'photo'
  },
  GENERAL_DOCUMENT: {
    destination: UPLOAD_DESTINATIONS.DOCUMENTS,
    filePrefix: FILE_PREFIXES.DOCUMENT,
    maxSize: FILE_SIZE_LIMITS.DOCUMENT.LARGE,
    allowedTypes: MIME_TYPES.DOCUMENTS,
    fieldName: 'document'
  }
} as const;

// Security Settings
export const SECURITY_SETTINGS = {
  ENABLE_VIRUS_SCAN: process.env.ENABLE_VIRUS_SCAN === 'true',
  QUARANTINE_PATH: 'uploads/quarantine/',
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv'
  ] as const satisfies readonly AllowedExtension[],
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar',
    '.com', '.msi', '.dll', '.app', '.deb', '.rpm'
  ] as const satisfies readonly BlockedExtension[]
} as const;

// CDN Configuration
export const CDN_CONFIG = {
  ENABLED: process.env.CDN_ENABLED === 'true',
  BASE_URL: process.env.CDN_BASE_URL || '',
  AWS_S3: {
    BUCKET: process.env.AWS_S3_BUCKET || '',
    REGION: process.env.AWS_S3_REGION || 'us-east-1'
  }
} as const;

// Error Messages
export const UPLOAD_ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'ขนาดไฟล์เกินที่กำหนด',
  INVALID_FILE_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',
  TOO_MANY_FILES: 'จำนวนไฟล์เกินที่กำหนด',
  UPLOAD_FAILED: 'การอัปโหลดไฟล์ล้มเหลว',
  PERMISSION_DENIED: 'ไม่มีสิทธิ์ในการอัปโหลดไฟล์'
} as const;

// Helper Functions
export const getUploadConfig = (type: keyof typeof UPLOAD_CONFIGS) => {
  return UPLOAD_CONFIGS[type];
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const isAllowedExtension = (ext: string): ext is AllowedExtension => {
    return (SECURITY_SETTINGS.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  };
  
  const isBlockedExtension = (ext: string): ext is BlockedExtension => {
    return (SECURITY_SETTINGS.BLOCKED_EXTENSIONS as readonly string[]).includes(ext);
  };
  
  // Updated helper function
  export const isValidFileExtension = (filename: string): boolean => {
    const ext = path.extname(filename).toLowerCase();
    return isAllowedExtension(ext) && !isBlockedExtension(ext);
  };

// Default Export
const uploadConfig = {
  UPLOAD_ENV,
  FILE_SIZE_LIMITS,
  UPLOAD_DESTINATIONS,
  FILE_PREFIXES,
  MIME_TYPES,
  UPLOAD_CONFIGS,
  SECURITY_SETTINGS,
  CDN_CONFIG,
  UPLOAD_ERROR_MESSAGES,
  getUploadConfig,
  formatFileSize,
  isValidFileExtension
};

export default uploadConfig;