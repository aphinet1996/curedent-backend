import { FilterQuery } from 'mongoose';
import { RoomType, Room } from '../models/room.model';
import Branch from '../models/branch.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IRoomTypeDocument,
  IRoomDocument,
  CreateRoomTypeInput,
  UpdateRoomTypeInput,
  CreateRoomInput,
  UpdateRoomInput,
  RoomStatus,
} from '../types/room.types';

export class RoomService {
  // ============= Room Type Methods =============

  /**
   * ค้นหา Room Type โดยใช้ ID
   */
  async findRoomTypeById(id: string): Promise<IRoomTypeDocument | null> {
    try {
      return await RoomType.findById(id).populate('createdBy', 'name');
    } catch (error) {
      logger.error(`Error finding room type by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Room Type ทั้งหมด
   */
  async findAllRoomTypes(
    filter: FilterQuery<IRoomTypeDocument> = {},
    sort: Record<string, 1 | -1> = { name: 1 },
    page = 1,
    limit = 50
  ): Promise<{ roomTypes: IRoomTypeDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const roomTypes = await RoomType.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name');
      
      const total = await RoomType.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        roomTypes,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all room types: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลประเภทห้อง', 500);
    }
  }

  /**
   * สร้าง Room Type ใหม่
   */
  async createRoomType(roomTypeData: CreateRoomTypeInput, createdBy: string): Promise<IRoomTypeDocument> {
    try {
      // ตรวจสอบว่าชื่อประเภทห้องซ้ำหรือไม่
      const existingRoomType = await RoomType.findOne({ 
        name: { $regex: new RegExp(`^${roomTypeData.name}$`, 'i') } 
      });
      
      if (existingRoomType) {
        throw new AppError('ชื่อประเภทห้องนี้มีอยู่แล้ว', 400);
      }

      // สร้าง Room Type ใหม่
      const newRoomType = await RoomType.create({
        ...roomTypeData,
        createdBy,
        isActive: roomTypeData.isActive !== undefined ? roomTypeData.isActive : true,
      });

      // ดึงข้อมูลพร้อม populate
      const roomType = await this.findRoomTypeById(newRoomType._id.toString());
      return roomType!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating room type: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างประเภทห้อง', 500);
    }
  }

  /**
   * อัปเดต Room Type
   */
  async updateRoomType(
    roomTypeId: string,
    updateData: UpdateRoomTypeInput
  ): Promise<IRoomTypeDocument | null> {
    try {
      // ตรวจสอบว่ามี Room Type นี้หรือไม่
      const roomType = await this.findRoomTypeById(roomTypeId);
      if (!roomType) {
        throw new AppError('ไม่พบประเภทห้องนี้', 404);
      }

      // ตรวจสอบชื่อซ้ำ (ถ้ามีการเปลี่ยนชื่อ)
      if (updateData.name && updateData.name !== roomType.name) {
        const existingRoomType = await RoomType.findOne({
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: roomTypeId }
        });
        
        if (existingRoomType) {
          throw new AppError('ชื่อประเภทห้องนี้มีอยู่แล้ว', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedRoomType = await RoomType.findByIdAndUpdate(
        roomTypeId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name');

      return updatedRoomType;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating room type: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตประเภทห้อง', 500);
    }
  }

  /**
   * ลบ Room Type
   */
  async deleteRoomType(roomTypeId: string): Promise<boolean> {
    try {
      // ตรวจสอบว่ามี Room Type นี้หรือไม่
      const roomType = await this.findRoomTypeById(roomTypeId);
      if (!roomType) {
        throw new AppError('ไม่พบประเภทห้องนี้', 404);
      }

      // ตรวจสอบว่ามีห้องที่ใช้ประเภทนี้หรือไม่
      const roomsUsingType = await Room.countDocuments({ roomTypeId });
      if (roomsUsingType > 0) {
        throw new AppError('ไม่สามารถลบประเภทห้องนี้ได้ เนื่องจากมีห้องที่ใช้ประเภทนี้อยู่', 400);
      }

      // ลบ Room Type
      await RoomType.findByIdAndDelete(roomTypeId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting room type: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบประเภทห้อง', 500);
    }
  }

  // ============= Room Methods =============

  /**
   * ค้นหาห้องโดยใช้ ID
   */
  async findRoomById(id: string): Promise<IRoomDocument | null> {
    try {
      return await Room.findById(id)
        .populate('roomTypeId', 'name color')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error finding room by ID: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูลห้องทั้งหมด
   */
  async findAllRooms(
    filter: FilterQuery<IRoomDocument> = {},
    sort: Record<string, 1 | -1> = { name: 1 },
    page = 1,
    limit = 10
  ): Promise<{ rooms: IRoomDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const rooms = await Room.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('roomTypeId', 'name color')
        .populate('branchId', 'name');
      
      const total = await Room.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return {
        rooms,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding all rooms: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลห้อง', 500);
    }
  }

  /**
   * สร้างห้องใหม่
   */
  async createRoom(roomData: CreateRoomInput): Promise<IRoomDocument> {
    try {
      // ตรวจสอบว่า room type มีอยู่จริง
      const roomType = await RoomType.findById(roomData.roomTypeId);
      if (!roomType || !roomType.isActive) {
        throw new AppError('ประเภทห้องที่ระบุไม่มีอยู่หรือถูกปิดใช้งาน', 400);
      }

      // ตรวจสอบว่า branch มีอยู่จริง
      const branch = await Branch.findById(roomData.branchId);
      if (!branch) {
        throw new AppError('สาขาที่ระบุไม่มีอยู่ในระบบ', 400);
      }

      // ตรวจสอบว่าเลขที่ห้องซ้ำในสาขาเดียวกันหรือไม่
      const existingRoom = await Room.findOne({
        roomNumber: roomData.roomNumber,
        branchId: roomData.branchId
      });
      
      if (existingRoom) {
        throw new AppError('เลขที่ห้องนี้มีอยู่แล้วในสาขานี้', 400);
      }

      // สร้างห้องใหม่
      const newRoom = await Room.create({
        ...roomData,
        status: roomData.status || RoomStatus.AVAILABLE,
        isActive: roomData.isActive !== undefined ? roomData.isActive : true,
      });

      // ดึงข้อมูลพร้อม populate
      const room = await this.findRoomById(newRoom._id.toString());
      return room!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating room: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างห้อง', 500);
    }
  }

  /**
   * อัปเดตข้อมูลห้อง
   */
  async updateRoom(
    roomId: string,
    updateData: UpdateRoomInput
  ): Promise<IRoomDocument | null> {
    try {
      // ตรวจสอบว่ามีห้องนี้หรือไม่
      const room = await this.findRoomById(roomId);
      if (!room) {
        throw new AppError('ไม่พบห้องนี้', 404);
      }

      // ตรวจสอบ room type ถ้ามีการเปลี่ยน
      if (updateData.roomTypeId) {
        const roomType = await RoomType.findById(updateData.roomTypeId);
        if (!roomType || !roomType.isActive) {
          throw new AppError('ประเภทห้องที่ระบุไม่มีอยู่หรือถูกปิดใช้งาน', 400);
        }
      }

      // ตรวจสอบ branch ถ้ามีการเปลี่ยน
      if (updateData.branchId) {
        const branch = await Branch.findById(updateData.branchId);
        if (!branch) {
          throw new AppError('สาขาที่ระบุไม่มีอยู่ในระบบ', 400);
        }
      }

      // ตรวจสอบเลขที่ห้องซ้ำ (ถ้ามีการเปลี่ยนเลขที่ห้องหรือสาขา)
      if (updateData.roomNumber || updateData.branchId) {
        const roomNumber = updateData.roomNumber || room.roomNumber;
        const branchId = updateData.branchId || room.branchId;
        
        const existingRoom = await Room.findOne({
          roomNumber,
          branchId,
          _id: { $ne: roomId }
        });
        
        if (existingRoom) {
          throw new AppError('เลขที่ห้องนี้มีอยู่แล้วในสาขานี้', 400);
        }
      }

      // อัปเดตข้อมูล
      const updatedRoom = await Room.findByIdAndUpdate(
        roomId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('roomTypeId', 'name color')
       .populate('branchId', 'name');

      return updatedRoom;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating room: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตห้อง', 500);
    }
  }

  /**
   * อัปเดตสถานะห้อง
   */
  async updateRoomStatus(roomId: string, status: RoomStatus): Promise<IRoomDocument | null> {
    try {
      const room = await this.findRoomById(roomId);
      if (!room) {
        throw new AppError('ไม่พบห้องนี้', 404);
      }

      const updatedRoom = await Room.findByIdAndUpdate(
        roomId,
        { $set: { status } },
        { new: true }
      ).populate('roomTypeId', 'name color')
       .populate('branchId', 'name');

      return updatedRoom;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating room status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะห้อง', 500);
    }
  }

  /**
   * อัปเดตสถานะการใช้งานห้อง
   */
  async updateRoomActiveStatus(roomId: string, isActive: boolean): Promise<IRoomDocument | null> {
    try {
      const room = await this.findRoomById(roomId);
      if (!room) {
        throw new AppError('ไม่พบห้องนี้', 404);
      }

      const updatedRoom = await Room.findByIdAndUpdate(
        roomId,
        { $set: { isActive } },
        { new: true }
      ).populate('roomTypeId', 'name color')
       .populate('branchId', 'name');

      return updatedRoom;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating room active status: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสถานะการใช้งานห้อง', 500);
    }
  }

  /**
   * ลบห้อง
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      const room = await this.findRoomById(roomId);
      if (!room) {
        throw new AppError('ไม่พบห้องนี้', 404);
      }

      // TODO: ตรวจสอบว่ามีการจองหรือการใช้งานห้องนี้หรือไม่
      // ถ้ามีระบบ appointment หรือ booking ให้เพิ่มการตรวจสอบที่นี่

      await Room.findByIdAndDelete(roomId);
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting room: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบห้อง', 500);
    }
  }

  /**
   * ดึงห้องที่ว่างตามสาขา
   */
  async getAvailableRoomsByBranch(branchId: string): Promise<IRoomDocument[]> {
    try {
      return await Room.find({
        branchId,
        status: RoomStatus.AVAILABLE,
        isActive: true
      }).populate('roomTypeId', 'name color')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error getting available rooms by branch: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลห้องที่ว่าง', 500);
    }
  }

  /**
   * ดึงห้องตามประเภท
   */
  async getRoomsByType(roomTypeId: string): Promise<IRoomDocument[]> {
    try {
      return await Room.find({
        roomTypeId,
        isActive: true
      }).populate('roomTypeId', 'name color')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error getting rooms by type: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลห้องตามประเภท', 500);
    }
  }
}

export default RoomService;