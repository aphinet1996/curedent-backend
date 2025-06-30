import { Document, Types } from 'mongoose';

/**
 * สถานะการใช้งาน
 */
export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved'
}

/**
 * Interface สำหรับ Room Type attributes
 */
export interface IRoomTypeAttributes {
  name: string;
  description?: string;
  color?: string; // สีสำหรับแสดงผลใน UI
  isActive: boolean;
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Room Type
 */
export interface IRoomType extends IRoomTypeAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Room Type เมื่อเก็บใน MongoDB
 */
export interface IRoomTypeDocument extends Document, IRoomTypeAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Room Type ใหม่
 */
export interface CreateRoomTypeInput {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Room Type
 */
export interface UpdateRoomTypeInput {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

/**
 * Interface สำหรับ Room attributes
 */
export interface IRoomAttributes {
  name: string;
  roomNumber: string;
  roomTypeId: Types.ObjectId | string;
  branchId: Types.ObjectId | string;
  capacity?: number;
  // equipment?: string[];
  description?: string;
  status: RoomStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface หลักสำหรับ Room
 */
export interface IRoom extends IRoomAttributes {
  _id: string | Types.ObjectId;
}

/**
 * Interface สำหรับ Room เมื่อเก็บใน MongoDB
 */
export interface IRoomDocument extends Document, IRoomAttributes {
  _id: Types.ObjectId;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการสร้าง Room ใหม่
 */
export interface CreateRoomInput {
  name: string;
  roomNumber: string;
  roomTypeId: string;
  branchId: string;
  capacity?: number;
  // equipment?: string[];
  description?: string;
  status?: RoomStatus;
  isActive?: boolean;
}

/**
 * Interface สำหรับข้อมูลที่ใช้ในการอัปเดต Room
 */
export interface UpdateRoomInput {
  name?: string;
  roomNumber?: string;
  roomTypeId?: string;
  branchId?: string;
  capacity?: number;
  // equipment?: string[];
  description?: string;
  status?: RoomStatus;
  isActive?: boolean;
}

/**
 * Interface สำหรับ Room Type response
 */
export interface RoomTypeResponse {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface สำหรับ Room response
 */
export interface RoomResponse {
  id: string;
  name: string;
  roomNumber: string;
  roomType: {
    id: string;
    name: string;
    color?: string;
  };
  branch: {
    id: string;
    name: string;
  };
  capacity?: number;
  // equipment?: string[];
  description?: string;
  status: RoomStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Function สำหรับแปลง IRoomType เป็น RoomTypeResponse
 */
export const toRoomTypeResponse = (roomType: IRoomType | IRoomTypeDocument): RoomTypeResponse => {
  const id = typeof roomType._id === 'string' ? roomType._id : roomType._id.toString();
  
  // สำหรับ createdBy
  let createdBy = {
    id: '',
    name: 'ไม่ระบุผู้สร้าง'
  };
  
  if (typeof roomType.createdBy === 'string') {
    createdBy.id = roomType.createdBy;
  } else if (roomType.createdBy && (roomType.createdBy as any)._id) {
    const creator = roomType.createdBy as any;
    createdBy.id = creator._id.toString();
    createdBy.name = creator.name || 'ไม่ระบุผู้สร้าง';
  } else if (roomType.createdBy) {
    createdBy.id = roomType.createdBy.toString();
  }
  
  return {
    id,
    name: roomType.name,
    description: roomType.description,
    color: roomType.color,
    isActive: roomType.isActive,
    createdBy,
    createdAt: roomType.createdAt,
    updatedAt: roomType.updatedAt
  };
};

/**
 * Function สำหรับแปลง IRoom เป็น RoomResponse
 */
export const toRoomResponse = (room: IRoom | IRoomDocument): RoomResponse => {
  const id = typeof room._id === 'string' ? room._id : room._id.toString();
  
  // สำหรับ roomType
  let roomType = {
    id: '',
    name: 'ไม่ระบุประเภท',
    color: undefined as string | undefined
  };
  
  if (typeof room.roomTypeId === 'string') {
    roomType.id = room.roomTypeId;
  } else if (room.roomTypeId && (room.roomTypeId as any)._id) {
    const type = room.roomTypeId as any;
    roomType.id = type._id.toString();
    roomType.name = type.name || 'ไม่ระบุประเภท';
    roomType.color = type.color;
  } else if (room.roomTypeId) {
    roomType.id = room.roomTypeId.toString();
  }
  
  // สำหรับ branch
  let branch = {
    id: '',
    name: 'ไม่ระบุสาขา'
  };
  
  if (typeof room.branchId === 'string') {
    branch.id = room.branchId;
  } else if (room.branchId && (room.branchId as any)._id) {
    const branchData = room.branchId as any;
    branch.id = branchData._id.toString();
    branch.name = branchData.name || 'ไม่ระบุสาขา';
  } else if (room.branchId) {
    branch.id = room.branchId.toString();
  }
  
  return {
    id,
    name: room.name,
    roomNumber: room.roomNumber,
    roomType,
    branch,
    capacity: room.capacity,
    // equipment: room.equipment,
    description: room.description,
    status: room.status,
    isActive: room.isActive,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
};