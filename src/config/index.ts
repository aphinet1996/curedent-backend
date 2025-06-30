import config, { isProduction, isDevelopment, isTest } from './environment';
import mongoose, { connectDB } from './db';
import uploadConfig, {
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
} from './upload';

export {
  config,
  isProduction,
  isDevelopment,
  isTest,
  mongoose,
  connectDB,

  // Upload Configuration
  uploadConfig,
  UPLOAD_ENV,
  FILE_SIZE_LIMITS,
  UPLOAD_DESTINATIONS,
  FILE_PREFIXES,
  MIME_TYPES,
  UPLOAD_CONFIGS,
  SECURITY_SETTINGS,
  CDN_CONFIG,
  UPLOAD_ERROR_MESSAGES,

  // Upload Helper Functions
  getUploadConfig,
  formatFileSize,
  isValidFileExtension
};