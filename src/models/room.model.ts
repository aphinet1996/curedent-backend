import mongoose, { Schema } from 'mongoose';
import { IRoomTypeDocument, IRoomDocument, RoomStatus } from '../types/room.types';

// Schema สำหรับ Room Type
const roomTypeSchema = new Schema<IRoomTypeDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อประเภทห้อง'],
      trim: true,
    //   unique: true,
      maxlength: [100, 'ชื่อประเภทห้องต้องไม่เกิน 100 ตัวอักษร'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'],
    },
    color: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'รูปแบบสีต้องเป็น hex color เช่น #FF0000'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'กรุณาระบุผู้สร้าง'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes สำหรับ Room Type
roomTypeSchema.index({ name: 1 });
roomTypeSchema.index({ isActive: 1 });
roomTypeSchema.index({ createdBy: 1 });

// Schema สำหรับ Room
const roomSchema = new Schema<IRoomDocument>(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อห้อง'],
      trim: true,
      maxlength: [100, 'ชื่อห้องต้องไม่เกิน 100 ตัวอักษร'],
    },
    roomNumber: {
      type: String,
      required: [true, 'กรุณาระบุเลขที่ห้อง'],
      trim: true,
      maxlength: [20, 'เลขที่ห้องต้องไม่เกิน 20 ตัวอักษร'],
    },
    roomTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'กรุณาระบุประเภทห้อง'],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'กรุณาระบุสาขา'],
    },
    capacity: {
      type: Number,
      min: [1, 'ความจุต้องมากกว่า 0'],
      max: [100, 'ความจุต้องไม่เกิน 100'],
    },
    // equipment: [{
    //   type: String,
    //   trim: true,
    //   maxlength: [100, 'ชื่ออุปกรณ์ต้องไม่เกิน 100 ตัวอักษร'],
    // }],
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'],
    },
    status: {
      type: String,
      enum: Object.values(RoomStatus),
      default: RoomStatus.AVAILABLE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index สำหรับ unique room number ใน branch เดียวกัน
roomSchema.index({ roomNumber: 1, branchId: 1 }, { unique: true });

// Indexes สำหรับ Room
roomSchema.index({ branchId: 1 });
roomSchema.index({ roomTypeId: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ isActive: 1 });
roomSchema.index({ name: 1 });

// Virtual field สำหรับ Room - ชื่อเต็มของห้อง
roomSchema.virtual('fullName').get(function () {
  return `${this.name} (${this.roomNumber})`;
});

// Pre-save middleware สำหรับ Room
roomSchema.pre('save', function (next) {
  // ตรวจสอบว่า roomNumber ไม่ซ้ำในสาขาเดียวกัน
  if (this.isModified('roomNumber') || this.isModified('branchId')) {
    // Mongoose จะตรวจสอบ unique index อยู่แล้ว
  }
  next();
});

// Static methods สำหรับ Room
roomSchema.statics.findByBranch = function(branchId: string) {
  return this.find({ branchId, isActive: true })
    .populate('roomTypeId', 'name color')
    .populate('branchId', 'name');
};

roomSchema.statics.findByRoomType = function(roomTypeId: string) {
  return this.find({ roomTypeId, isActive: true })
    .populate('roomTypeId', 'name color')
    .populate('branchId', 'name');
};

roomSchema.statics.findAvailableRooms = function(branchId?: string) {
  const filter: any = { 
    status: RoomStatus.AVAILABLE, 
    isActive: true 
  };
  
  if (branchId) {
    filter.branchId = branchId;
  }
  
  return this.find(filter)
    .populate('roomTypeId', 'name color')
    .populate('branchId', 'name');
};

// Instance methods สำหรับ Room
roomSchema.methods.updateStatus = function(status: RoomStatus) {
  this.status = status;
  return this.save();
};

roomSchema.methods.isAvailable = function() {
  return this.status === RoomStatus.AVAILABLE && this.isActive;
};

// Create models
const RoomType = mongoose.model<IRoomTypeDocument>('RoomType', roomTypeSchema);
const Room = mongoose.model<IRoomDocument>('Room', roomSchema);

export { RoomType, Room };
export default Room;