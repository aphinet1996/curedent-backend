import { Document, Types, Model } from 'mongoose';

/**
 * บทบาทของผู้ใช้
 */
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

/**
 * สถานะของผู้ใช้
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

/**
 * User attributes interface
 */
export interface IUserAttributes {
  email: string;
  username: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  avatar?: string;
  roles: UserRole;
  status: UserStatus;
  clinicId?: Types.ObjectId | string;
  branchId?: Types.ObjectId | string;
  lastLogin?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  permissions?: string[];
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  loginAttempts?: number;
  lockUntil?: Date;
  createdBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ User
 */
export interface IUser extends IUserAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ User เมื่อเก็บใน MongoDB
 */
export interface IUserDocument extends Document, IUserAttributes {
  _id: Types.ObjectId;
  
  // Virtual properties
  fullName: string;
  
  // Methods from user model
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

/**
 * Interface สำหรับ User Model static methods
 */
export interface IUserModel extends Model<IUserDocument> {
  findByEmailOrUsername(emailOrUsername: string): Promise<IUserDocument | null>;
  findByResetToken(token: string): Promise<IUserDocument | null>;
  findByVerificationToken(token: string): Promise<IUserDocument | null>;
}

/**
 * Interface สำหรับสร้าง User
 */
export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  avatar?: string;
  roles: UserRole;
  clinicId?: string;
  branchId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  permissions?: string[];
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdBy?: string;
}

/**
 * Interface สำหรับอัปเดต User
 */
export interface UpdateUserInput {
  email?: string;
  username?: string;
  name?: string;
  surname?: string;
  phone?: string;
  avatar?: string;
  roles?: UserRole;
  status?: UserStatus;
  clinicId?: string;
  branchId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  refreshToken?: string;
  permissions?: string[];
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

/**
 * Interface สำหรับ User response
 */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  roles: UserRole;
  status: UserStatus;
  clinicId?: string;
  clinicName?: string;
  branchId?: string;
  branchName?: string;
  lastLogin?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  permissions?: string[];
  preferences?: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  createdBy?: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface สำหรับ Login
 */
export interface LoginInput {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Interface สำหรับ Login Response
 */
export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Interface สำหรับ JWT Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  roles: UserRole;
  clinicId?: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Interface สำหรับ Password Reset
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface สำหรับ Change Password
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface สำหรับอัปเดต roles ของผู้ใช้
 */
export interface UpdateUserRolesInput {
  roles: UserRole;
  clinicId?: string;
  branchId?: string;
}

/**
 * Interface สำหรับอัปเดตสถานะผู้ใช้
 */
export interface UpdateUserStatusInput {
  status: UserStatus;
}

/**
 * Function สำหรับแปลง IUser เป็น UserResponse
 */
export const toUserResponse = (user: IUser | IUserDocument): UserResponse => {
  const id = typeof user._id === 'string' ? user._id : user._id.toString();
  
  const getPopulatedData = (obj: any) => {
    if (typeof obj === 'string') return { id: obj, name: undefined };
    if (obj && obj._id) return { id: obj._id.toString(), name: obj.name };
    return { id: obj?.toString() || '', name: undefined };
  };

  const clinic = getPopulatedData(user.clinicId);
  const branch = getPopulatedData(user.branchId);
  const createdBy = getPopulatedData(user.createdBy);

  return {
    id,
    email: user.email,
    username: user.username,
    name: user.name,
    surname: user.surname,
    fullName: `${user.name} ${user.surname}`.trim(),
    phone: user.phone,
    avatar: user.avatar,
    roles: user.roles,
    status: user.status,
    clinicId: clinic.id,
    clinicName: clinic.name,
    branchId: branch.id,
    branchName: branch.name,
    lastLogin: user.lastLogin,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    permissions: user.permissions,
    preferences: user.preferences,
    createdBy: createdBy.id,
    createdByName: createdBy.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Interface สำหรับ User statistics
 */
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  usersByRole: {
    [key in UserRole]: number;
  };
  recentRegistrations: number;
  lastMonthRegistrations: number;
}

/**
 * Interface สำหรับ User activity log
 */
export interface UserActivityLog {
  userId: string;
  action: string;
  description: string;
  ip?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Interface สำหรับ User session
 */
export interface UserSession {
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date;
}