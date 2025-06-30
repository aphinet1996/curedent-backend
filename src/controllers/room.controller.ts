import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import RoomService from '../services/room.service';
import { toRoomTypeResponse, toRoomResponse, RoomStatus } from '../types/room.types';
import { UserRole } from '../types/user.types';

const roomService = new RoomService();

export const getAllRoomTypes = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex }
    ];
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const sortField = (req.query.sortBy as string) || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const { roomTypes, total, totalPages } = await roomService.findAllRoomTypes(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: roomTypes.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      roomTypes: roomTypes.map(roomType => toRoomTypeResponse(roomType)),
    },
  });
});

export const getRoomTypeById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomTypeId = req.params.id;

  const roomType = await roomService.findRoomTypeById(roomTypeId);

  if (!roomType) {
    return next(new AppError('ไม่พบประเภทห้องนี้', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      roomType: toRoomTypeResponse(roomType),
    },
  });
});

export const createRoomType = catchAsync(async (req: Request, res: Response) => {
  const roomTypeData = req.body;
  const createdBy = req.user!._id.toString();

  const newRoomType = await roomService.createRoomType(roomTypeData, createdBy);

  res.status(201).json({
    status: 'success',
    data: {
      roomType: toRoomTypeResponse(newRoomType),
    },
  });
});

export const updateRoomType = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomTypeId = req.params.id;
  const updateData = req.body;

  const updatedRoomType = await roomService.updateRoomType(roomTypeId, updateData);

  if (!updatedRoomType) {
    return next(new AppError('ไม่พบประเภทห้องนี้', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      roomType: toRoomTypeResponse(updatedRoomType),
    },
  });
});

export const deleteRoomType = catchAsync(async (req: Request, res: Response) => {
  const roomTypeId = req.params.id;

  await roomService.deleteRoomType(roomTypeId);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const getAllRooms = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.roomTypeId) filter.roomTypeId = req.query.roomTypeId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { roomNumber: searchRegex },
      { description: searchRegex }
    ];
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // ต้องได้ branchIds ที่อยู่ในคลินิกของผู้ใช้
    // TODO: ต้องสร้าง method ในการ filter branches by clinic
    // สำหรับตอนนี้ให้ใช้ clinicId filter แทน
    if (req.user!.clinicId) {
      // สามารถเพิ่ม populate และ filter ได้
      // filter['$lookup'] = ... // หรือใช้ aggregate
    }
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const { rooms, total, totalPages } = await roomService.findAllRooms(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: rooms.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    data: {
      rooms: rooms.map(room => toRoomResponse(room)),
    },
  });
});

export const getRoomById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.params.id;

  const room = await roomService.findRoomById(roomId);

  if (!room) {
    return next(new AppError('ไม่พบห้องนี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่า branch ของห้องนี้อยู่ในคลินิกของผู้ใช้หรือไม่
    // const branch = await Branch.findById(room.branchId);
    // if (branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    //   return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลห้องนี้', 403));
    // }
  }

  res.status(200).json({
    status: 'success',
    data: {
      room: toRoomResponse(room),
    },
  });
});

export const createRoom = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomData = req.body;

  // Parse equipment ถ้าเป็น string
  // if (typeof roomData.equipment === 'string') {
  //   try {
  //     roomData.equipment = JSON.parse(roomData.equipment);
  //   } catch (error) {
  //     return next(new AppError('Invalid equipment format, must be a valid JSON array', 400));
  //   }
  // }

  // // ตรวจสอบว่า equipment เป็น array หรือไม่
  // if (roomData.equipment && !Array.isArray(roomData.equipment)) {
  //   return next(new AppError('equipment must be an array', 400));
  // }

  // ตรวจสอบสิทธิ์ในการสร้างห้องในสาขานี้
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าสาขาที่ระบุอยู่ในคลินิกของผู้ใช้หรือไม่
    // const branch = await Branch.findById(roomData.branchId);
    // if (!branch || branch.clinicId.toString() !== req.user!.clinicId?.toString()) {
    //   return next(new AppError('คุณไม่มีสิทธิ์สร้างห้องในสาขานี้', 403));
    // }
  }

  const newRoom = await roomService.createRoom(roomData);

  res.status(201).json({
    status: 'success',
    data: {
      room: toRoomResponse(newRoom),
    },
  });
});

export const updateRoom = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.params.id;
  const updateData = req.body;

  // // Parse equipment ถ้าเป็น string
  // if (typeof updateData.equipment === 'string') {
  //   try {
  //     updateData.equipment = JSON.parse(updateData.equipment);
  //   } catch (error) {
  //     return next(new AppError('Invalid equipment format, must be a valid JSON array', 400));
  //   }
  // }

  // // ตรวจสอบว่า equipment เป็น array หรือไม่
  // if (updateData.equipment && !Array.isArray(updateData.equipment)) {
  //   return next(new AppError('equipment must be an array', 400));
  // }

  // ตรวจสอบว่ามีห้องนี้หรือไม่
  const room = await roomService.findRoomById(roomId);
  if (!room) {
    return next(new AppError('ไม่พบห้องนี้', 404));
  }

  // ตรวจสอบสิทธิ์
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าห้องนี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }

  const updatedRoom = await roomService.updateRoom(roomId, updateData);

  res.status(200).json({
    status: 'success',
    data: {
      room: toRoomResponse(updatedRoom!),
    },
  });
});

export const updateRoomStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.params.id;
  const { status } = req.body;

  const room = await roomService.findRoomById(roomId);
  if (!room) {
    return next(new AppError('ไม่พบห้องนี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าห้องนี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }

  const updatedRoom = await roomService.updateRoomStatus(roomId, status);

  res.status(200).json({
    status: 'success',
    data: {
      room: toRoomResponse(updatedRoom!),
    },
  });
});

export const updateRoomActiveStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.params.id;
  const { isActive } = req.body;

  const room = await roomService.findRoomById(roomId);
  if (!room) {
    return next(new AppError('ไม่พบห้องนี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าห้องนี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }

  const updatedRoom = await roomService.updateRoomActiveStatus(roomId, isActive);

  res.status(200).json({
    status: 'success',
    data: {
      room: toRoomResponse(updatedRoom!),
    },
  });
});

export const deleteRoom = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const roomId = req.params.id;

  const room = await roomService.findRoomById(roomId);
  if (!room) {
    return next(new AppError('ไม่พบห้องนี้', 404));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าห้องนี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }

  await roomService.deleteRoom(roomId);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const getAvailableRoomsByBranch = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.params.branchId;

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: ตรวจสอบว่าสาขานี้อยู่ในคลินิกของผู้ใช้หรือไม่
  }

  const availableRooms = await roomService.getAvailableRoomsByBranch(branchId);

  res.status(200).json({
    status: 'success',
    results: availableRooms.length,
    data: {
      rooms: availableRooms.map(room => toRoomResponse(room)),
    },
  });
});

export const getRoomsByType = catchAsync(async (req: Request, res: Response) => {
  const roomTypeId = req.params.roomTypeId;

  const rooms = await roomService.getRoomsByType(roomTypeId);

  let filteredRooms = rooms;
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    // TODO: Filter ห้องที่อยู่ในคลินิกของผู้ใช้เท่านั้น
  }

  res.status(200).json({
    status: 'success',
    results: filteredRooms.length,
    data: {
      rooms: filteredRooms.map(room => toRoomResponse(room)),
    },
  });
});