import mongoose, { Schema } from 'mongoose';
import { BranchStatus, IBranchDocument, IBranchModel } from '../types/branch.types';

const branchSchema = new Schema<IBranchDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสาขา'],
      trim: true,
      maxlength: [100, 'ชื่อสาขาต้องไม่เกิน 100 ตัวอักษร']
    },
    photo: {
      type: String,
      trim: true,
    },
    tel: {
      type: String,
      required: [true, 'กรุณาระบุเบอร์โทรศัพท์'],
      trim: true,
      maxlength: [20, 'เบอร์โทรศัพท์ต้องไม่เกิน 20 ตัวอักษร']
    },
    address: {
      type: String,
      required: [true, 'กรุณาระบุที่อยู่'],
      trim: true,
      maxlength: [200, 'ที่อยู่ต้องไม่เกิน 200 ตัวอักษร']
    },
    subdistrict: {
      type: String,
      required: [true, 'กรุณาระบุตำบล/แขวง'],
      trim: true,
      maxlength: [100, 'ตำบล/แขวงต้องไม่เกิน 100 ตัวอักษร']
    },
    district: {
      type: String,
      required: [true, 'กรุณาระบุอำเภอ/เขต'],
      trim: true,
      maxlength: [100, 'อำเภอ/เขตต้องไม่เกิน 100 ตัวอักษร']
    },
    province: {
      type: String,
      required: [true, 'กรุณาระบุจังหวัด'],
      trim: true,
      maxlength: [100, 'จังหวัดต้องไม่เกิน 100 ตัวอักษร']
    },
    zipcode: {
      type: String,
      required: [true, 'กรุณาระบุรหัสไปรษณีย์'],
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^[0-9]{5}$/.test(v);
        },
        message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก'
      }
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'กรุณาระบุคลินิก'],
    },
    linkMap: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty string
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'ลิงค์แผนที่ไม่ถูกต้อง'
      }
    },
    status: {
      type: String,
      enum: Object.values(BranchStatus),
      default: BranchStatus.ACTIVE,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
branchSchema.index({ name: 1, clinicId: 1 }, { unique: true });
branchSchema.index({ clinicId: 1 });
branchSchema.index({ status: 1 });

// Virtual fields
branchSchema.virtual('fullAddress').get(function () {
  return `${this.address} ${this.subdistrict} ${this.district} ${this.province} ${this.zipcode}`;
});

// Instance Methods สำหรับดึงข้อมูลจาก Room module

/**
 * ดึงจำนวนห้องทั้งหมดในสาขา
 * ต้องใช้ Room model จาก room module
 */
branchSchema.methods.getRoomsCount = async function(): Promise<number> {
  try {
    // ต้อง import Room model จาก room module
    const Room = mongoose.model('Room');
    return await Room.countDocuments({ branchId: this._id, isActive: true });
  } catch (error) {
    console.error('Error getting rooms count:', error);
    return 0;
  }
};

/**
 * ดึงจำนวนห้องที่ใช้งานได้ในสาขา
 */
branchSchema.methods.getActiveRoomsCount = async function(): Promise<number> {
  try {
    const Room = mongoose.model('Room');
    return await Room.countDocuments({ 
      branchId: this._id, 
      isActive: true,
      status: 'available' // RoomStatus.AVAILABLE
    });
  } catch (error) {
    console.error('Error getting active rooms count:', error);
    return 0;
  }
};

/**
 * ดึงห้องตามประเภท
 */
branchSchema.methods.getRoomsByType = async function(roomTypeId: string): Promise<any[]> {
  try {
    const Room = mongoose.model('Room');
    return await Room.find({ 
      branchId: this._id,
      roomTypeId,
      isActive: true 
    }).populate('roomTypeId', 'name color');
  } catch (error) {
    console.error('Error getting rooms by type:', error);
    return [];
  }
};

/**
 * ดึงห้องที่ว่างในสาขา
 */
branchSchema.methods.getAvailableRooms = async function(): Promise<any[]> {
  try {
    const Room = mongoose.model('Room');
    return await Room.find({ 
      branchId: this._id,
      status: 'available', // RoomStatus.AVAILABLE
      isActive: true 
    }).populate('roomTypeId', 'name color');
  } catch (error) {
    console.error('Error getting available rooms:', error);
    return [];
  }
};

// Static Methods

/**
 * หาสาขาตาม clinic
 */
branchSchema.statics.findByClinic = function(clinicId: string) {
  return this.find({ clinicId })
    .populate('clinicId', 'name')
    .sort({ name: 1 });
};

/**
 * หาสาขาพร้อมสรุปข้อมูลห้อง
 */
branchSchema.statics.findWithRoomsSummary = async function(filter: any = {}) {
  const branches = await this.find(filter).populate('clinicId', 'name');
  
  // ใช้ Promise.all เพื่อดึงข้อมูลห้องแบบ parallel
  const branchesWithSummary = await Promise.all(
    branches.map(async (branch: any) => {
      const [totalRooms, activeRooms] = await Promise.all([
        branch.getRoomsCount(),
        branch.getActiveRoomsCount()
      ]);
      
      return {
        ...branch.toObject(),
        roomsSummary: {
          totalRooms,
          activeRooms,
          availableRooms: activeRooms // สำหรับตอนนี้ให้เท่ากับ active
        }
      };
    })
  );
  
  return branchesWithSummary;
};

// Pre-save middleware
branchSchema.pre('save', function (next) {
  // Basic validation หรือ transformation logic
  next();
});

// Post-save middleware
branchSchema.post('save', function(doc) {
  console.log(`Branch ${doc.name} saved successfully`);
});

// Create model
const Branch = mongoose.model<IBranchDocument, IBranchModel>('Branch', branchSchema);

export default Branch;