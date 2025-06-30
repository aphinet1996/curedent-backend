import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '../types/user.types';

// ลิสต์ของ permissions ทั้งหมดที่รองรับ
export const validPermissions = [
  // User management
  'read:users',
  'create:users', 
  'update:users',
  'delete:users',
  'update:users:password',
  'update:users:roles',
  'update:users:status',
  
  // Own profile
  'read:own',
  'update:own',
  'delete:own',
  
  // Clinic management
  'read:clinics',
  'create:clinics',
  'update:clinics',
  'delete:clinics',
  
  // Branch management
  'read:branches',
  'create:branches',
  'update:branches',
  'delete:branches',
  
  // Financial data
  'read:finance',
  'create:finance',
  'update:finance',
  'delete:finance',
  'read:reports',
  'create:reports',
  
  // Appointments
  'read:appointments',
  'create:appointments',
  'update:appointments',
  'delete:appointments',
  
  // Patients
  'read:patients',
  'create:patients',
  'update:patients',
  'delete:patients',
  
  // Medical records
  'read:medical_records',
  'create:medical_records',
  'update:medical_records',
  'delete:medical_records',
  
  // Inventory
  'read:inventory',
  'create:inventory',
  'update:inventory',
  'delete:inventory',
  
  // Settings
  'read:settings',
  'update:settings',
  
  // Audit logs
  'read:audit_logs',
  
  // System administration
  'manage:system',
  'backup:system',
  'restore:system'
] as const;

export type Permission = typeof validPermissions[number];

/**
 * Interface สำหรับ Role document
 */
export interface IRole extends Document {
  name: string;
  displayName: string;
  permissions: Permission[];
  description?: string;
  isSystem: boolean; // ระบุว่าเป็น system role หรือไม่
  clinicId?: mongoose.Types.ObjectId; // สำหรับ custom roles ของแต่ละคลินิก
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface สำหรับ Role model (static methods)
 */
export interface IRoleModel extends Model<IRole> {
  getDefaultPermissions(role: UserRole): Permission[];
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อ role'],
      trim: true,
      lowercase: true,
      maxlength: [50, 'ชื่อ role ต้องไม่เกิน 50 ตัวอักษร']
    },
    displayName: {
      type: String,
      required: [true, 'กรุณาระบุชื่อแสดงของ role'],
      trim: true,
      maxlength: [100, 'ชื่อแสดงต้องไม่เกิน 100 ตัวอักษร']
    },
    permissions: {
      type: [String],
      required: [true, 'กรุณาระบุสิทธิ์'],
      validate: {
        validator: function(permissions: string[]) {
          return permissions.every(permission => validPermissions.includes(permission as Permission));
        },
        message: 'มีสิทธิ์ที่ไม่ถูกต้อง'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร']
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: function(this: IRole) {
        return !this.isSystem;
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
roleSchema.index({ name: 1, clinicId: 1 }, { unique: true });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ clinicId: 1 });

// Virtual for role level (for hierarchy)
roleSchema.virtual('level').get(function(this: IRole) {
  const roleLevels: Record<string, number> = {
    'superadmin': 5,
    'owner': 4,
    'admin': 3,
    'manager': 2,
    'staff': 1
  };
  
  return roleLevels[this.name] || 0;
});

// Middleware: ป้องกันการลบ system roles
roleSchema.pre('deleteOne', { document: true }, function(this: IRole, next) {
  if (this.isSystem) {
    return next(new Error('ไม่สามารถลบ system role ได้'));
  }
  next();
});

roleSchema.pre('findOneAndDelete', function(next) {
  this.where({ isSystem: { $ne: true } });
  next();
});

// Static methods
roleSchema.statics.getDefaultPermissions = function(role: UserRole): Permission[] {
  const defaultPermissions: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: validPermissions as unknown as Permission[], // All permissions
    
    [UserRole.OWNER]: [
      'read:users', 'create:users', 'update:users', 'delete:users', 
      'update:users:password', 'update:users:roles', 'update:users:status',
      'read:clinics', 'update:clinics',
      'read:branches', 'create:branches', 'update:branches', 'delete:branches',
      'read:finance', 'create:finance', 'update:finance', 'delete:finance',
      'read:reports', 'create:reports',
      'read:appointments', 'create:appointments', 'update:appointments', 'delete:appointments',
      'read:patients', 'create:patients', 'update:patients', 'delete:patients',
      'read:medical_records', 'create:medical_records', 'update:medical_records',
      'read:inventory', 'create:inventory', 'update:inventory', 'delete:inventory',
      'read:settings', 'update:settings',
      'read:audit_logs'
    ],
    
    [UserRole.ADMIN]: [
      'read:users', 'create:users', 'update:users', 'update:users:password',
      'read:branches', 'update:branches',
      'read:finance', 'update:finance',
      'read:reports', 'create:reports',
      'read:appointments', 'create:appointments', 'update:appointments', 'delete:appointments',
      'read:patients', 'create:patients', 'update:patients', 'delete:patients',
      'read:medical_records', 'create:medical_records', 'update:medical_records',
      'read:inventory', 'create:inventory', 'update:inventory',
      'read:settings'
    ],
    
    [UserRole.MANAGER]: [
      'read:users', 'update:users',
      'read:appointments', 'create:appointments', 'update:appointments',
      'read:patients', 'create:patients', 'update:patients',
      'read:medical_records', 'create:medical_records', 'update:medical_records',
      'read:inventory', 'update:inventory',
      'read:finance'
    ],
    
    [UserRole.STAFF]: [
      'read:own', 'update:own',
      'read:appointments', 'create:appointments', 'update:appointments',
      'read:patients', 'create:patients', 'update:patients',
      'read:medical_records', 'create:medical_records', 'update:medical_records',
      'read:inventory'
    ]
  };
  
  return defaultPermissions[role] || [];
};

// สร้าง model ด้วย generic types ที่ถูกต้อง
const Role = mongoose.model<IRole, IRoleModel>('Role', roleSchema);

// สร้าง default system roles ถ้ายังไม่มี
export const createDefaultRoles = async (): Promise<void> => {
  try {
    const systemRolesCount = await Role.countDocuments({ isSystem: true });
    
    if (systemRolesCount === 0) {
      const defaultRoles = [
        {
          name: 'superadmin',
          displayName: 'Super Administrator',
          permissions: Role.getDefaultPermissions(UserRole.SUPER_ADMIN),
          description: 'ผู้ดูแลระบบสูงสุด มีสิทธิ์ทั้งหมด',
          isSystem: true
        },
        {
          name: 'owner',
          displayName: 'Clinic Owner',
          permissions: Role.getDefaultPermissions(UserRole.OWNER),
          description: 'เจ้าของคลินิก มีสิทธิ์จัดการคลินิกและสาขา',
          isSystem: true
        },
        {
          name: 'admin',
          displayName: 'Administrator',
          permissions: Role.getDefaultPermissions(UserRole.ADMIN),
          description: 'ผู้ดูแลระบบ มีสิทธิ์จัดการข้อมูลในคลินิก',
          isSystem: true
        },
        {
          name: 'manager',
          displayName: 'Manager',
          permissions: Role.getDefaultPermissions(UserRole.MANAGER),
          description: 'ผู้จัดการสาขา มีสิทธิ์จัดการข้อมูลในสาขา',
          isSystem: true
        },
        {
          name: 'staff',
          displayName: 'Staff',
          permissions: Role.getDefaultPermissions(UserRole.STAFF),
          description: 'พนักงาน มีสิทธิ์ใช้งานระบบพื้นฐาน',
          isSystem: true
        }
      ];

      await Role.insertMany(defaultRoles);
      console.log('✅ Default system roles created successfully');
    } else {
      console.log('ℹ️ System roles already exist');
    }
  } catch (error) {
    console.error('❌ Error creating default roles:', error);
  }
};

/**
 * ฟังก์ชันสำหรับสร้าง custom role สำหรับคลินิก
 */
export const createCustomRole = async (
  clinicId: string,
  roleData: {
    name: string;
    displayName: string;
    permissions: Permission[];
    description?: string;
    createdBy: string;
  }
): Promise<IRole> => {
  const role = new Role({
    ...roleData,
    clinicId,
    isSystem: false
  });

  return await role.save();
};

/**
 * ฟังก์ชันสำหรับดึง roles ที่ใช้ได้สำหรับคลินิก
 */
export const getAvailableRoles = async (clinicId?: string): Promise<IRole[]> => {
  const query: any = {
    $or: [
      { isSystem: true },
      ...(clinicId ? [{ clinicId, isSystem: false }] : [])
    ]
  };

  return await Role.find(query).sort({ level: -1, displayName: 1 });
};

export default Role;