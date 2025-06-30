import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { IUserDocument, IUserModel, UserRole, UserStatus } from '../types/user.types';

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'กรุณาระบุอีเมล'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'รูปแบบอีเมลไม่ถูกต้อง'
      ]
    },
    username: {
      type: String,
      required: [true, 'กรุณาระบุชื่อผู้ใช้'],
      unique: true,
      trim: true,
      minlength: [3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'],
      maxlength: [30, 'ชื่อผู้ใช้ต้องไม่เกิน 30 ตัวอักษร'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษร ตัวเลข และ underscore เท่านั้น'
      ]
    },
    password: {
      type: String,
      required: [true, 'กรุณาระบุรหัสผ่าน'],
      minlength: [8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'],
      select: false
    },
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อ'],
      trim: true,
      maxlength: [50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร']
    },
    surname: {
      type: String,
      required: [true, 'กรุณาระบุนามสกุล'],
      trim: true,
      maxlength: [50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร']
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[0-9+\-\s()]{10,15}$/,
        'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'
      ]
    },
    avatar: {
      type: String,
      default: null
    },
    roles: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STAFF,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: function() {
        return this.roles !== UserRole.SUPER_ADMIN;
      }
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: function() {
        return [UserRole.MANAGER, UserRole.STAFF].includes(this.roles);
      }
    },
    lastLogin: {
      type: Date,
      default: null
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String,
      select: false
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    permissions: {
      type: [String],
      default: []
    },
    preferences: {
      language: {
        type: String,
        default: 'th'
      },
      timezone: {
        type: String,
        default: 'Asia/Bangkok'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        push: {
          type: Boolean,
          default: true
        }
      }
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
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

// Virtual สำหรับชื่อเต็ม
userSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.surname}`.trim();
});

// Index สำหรับการค้นหา
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ clinicId: 1 });
userSchema.index({ branchId: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'permissions': 1 });

// Middleware: Hash password ก่อนบันทึก
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Middleware: ตรวจสอบ branchId เมื่อมีการเปลี่ยน roles
userSchema.pre('save', function(next) {
  if (this.isModified('roles')) {
    // Manager และ Staff ต้องมี branchId
    if ([UserRole.MANAGER, UserRole.STAFF].includes(this.roles) && !this.branchId) {
      return next(new Error('Manager และ Staff ต้องระบุสาขา'));
    }
    
    // Super Admin ไม่ต้องมี clinicId และ branchId
    if (this.roles === UserRole.SUPER_ADMIN) {
      this.clinicId = undefined;
      this.branchId = undefined;
    }
  }
  next();
});

// Middleware: Reset login attempts เมื่อล็อกอินสำเร็จ
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin') && this.lastLogin) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
  }
  next();
});

// Method: เปรียบเทียบรหัสผ่าน
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing password');
  }
};

// Method: สร้าง password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที
  return resetToken;
};

// Method: สร้าง email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง
  return verifyToken;
};

// Method: ตรวจสอบการล็อค
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Method: เพิ่มจำนวนครั้งการพยายามล็อกอิน
userSchema.methods.incLoginAttempts = async function(): Promise<void> {
  // ถ้ามีการล็อคและหมดเวลาแล้ว
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // ล็อคบัญชีหลังจากพยายาม 5 ครั้ง
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // ล็อค 2 ชั่วโมง
  }

  return this.updateOne(updates);
};

// Method: รีเซ็ตจำนวนครั้งการพยายามล็อกอิน
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method: ค้นหา user โดยอีเมลหรือชื่อผู้ใช้
userSchema.statics.findByEmailOrUsername = function(emailOrUsername: string) {
  return this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername }
    ]
  }).select('+password +refreshToken');
};

// Static method: ค้นหา user โดย reset token
userSchema.statics.findByResetToken = function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });
};

// Static method: ค้นหา user โดย verification token
userSchema.statics.findByVerificationToken = function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;