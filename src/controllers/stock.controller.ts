import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { StockService } from '../services/stock.service';
import {
  toStockResponse,
  toStockMovementResponse,
  toStockTransferResponse,
} from '../types/stock.types';
import { UserRole } from '../types/user.types';
import { compareObjectIds } from '../utils/mongoose.utils';

const stockService = new StockService();

export const getProductStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const { branchId } = req.query;

  if (branchId) {
    const stock = await stockService.findStock(productId, branchId as string);
    if (!stock) {
      return next(new AppError('ไม่พบข้อมูล stock', 404));
    }

    if (req.user!.roles !== UserRole.SUPER_ADMIN && 
        !compareObjectIds(stock.branchId, req.user!.branchId)) {
      return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล stock นี้', 403));
    }

    res.status(200).json({
      status: 'success',
      data: {
        stock: toStockResponse(stock)
      }
    });
  } else {
    const stocks = await stockService.findProductStocks(productId);
    
    const accessibleStocks = req.user!.roles === UserRole.SUPER_ADMIN 
      ? stocks 
      : stocks.filter(stock => compareObjectIds(stock.branchId, req.user!.branchId));

    res.status(200).json({
      status: 'success',
      results: accessibleStocks.length,
      data: {
        stocks: accessibleStocks.map(stock => toStockResponse(stock))
      }
    });
  }
});

export const getBranchStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const branchId = req.query.branchId as string || req.user!.branchId?.toString();
  
  if (!branchId) {
    return next(new AppError('กรุณาระบุสาขา', 400));
  }

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(branchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูล stock ของสาขานี้', 403));
  }

  const filter: any = {};
  
  if (req.query.productId) filter.productId = req.query.productId;
  if (req.query.lowStock === 'true') {
    const lowStockProducts = await stockService.getLowStockProducts(branchId);
    return res.status(200).json({
      status: 'success',
      results: lowStockProducts.products.length,
      data: {
        stocks: lowStockProducts.products
      }
    });
  }
  if (req.query.outOfStock === 'true') {
    filter.availableQuantity = 0;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { stocks, total, totalPages } = await stockService.findBranchStocks(
    branchId,
    filter,
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: stocks.length,
    pagination: { total, page, limit, totalPages },
    data: {
      stocks: stocks.map(stock => toStockResponse(stock))
    }
  });
});

export const adjustStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const adjustData = req.body;

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(adjustData.branchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ปรับ stock ของสาขานี้', 403));
  }

  const movement = await stockService.adjustStock(
    adjustData,
    req.user!._id.toString()
  );

  res.status(201).json({
    status: 'success',
    data: {
      movement: toStockMovementResponse(movement)
    }
  });
});

export const reserveStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { productId, branchId, quantity, unit, referenceType, referenceId, notes } = req.body;

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(branchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์จอง stock ของสาขานี้', 403));
  }

  const stock = await stockService.reserveStock(
    productId,
    branchId,
    quantity,
    unit,
    referenceType,
    referenceId,
    req.user!._id.toString(),
    notes
  );

  res.status(200).json({
    status: 'success',
    data: {
      stock: toStockResponse(stock)
    }
  });
});

export const unreserveStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { productId, branchId, quantity, unit, referenceType, referenceId, notes } = req.body;

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(branchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ยกเลิกการจอง stock ของสาขานี้', 403));
  }

  const stock = await stockService.unreserveStock(
    productId,
    branchId,
    quantity,
    unit,
    referenceType,
    referenceId,
    req.user!._id.toString(),
    notes
  );

  res.status(200).json({
    status: 'success',
    data: {
      stock: toStockResponse(stock)
    }
  });
});

export const createTransferRequest = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const transferData = req.body;

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(transferData.fromBranchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์โอน stock จากสาขานี้', 403));
  }

  const transfer = await stockService.createTransferRequest(
    transferData,
    req.user!._id.toString()
  );

  res.status(201).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transfer)
    }
  });
});

export const getStockTransfers = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.productId) filter.productId = req.query.productId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.requestedBy) filter.requestedBy = req.query.requestedBy;

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.$or = [
      { fromBranchId: req.user!.branchId },
      { toBranchId: req.user!.branchId }
    ];
  } else {
    if (req.query.fromBranchId) filter.fromBranchId = req.query.fromBranchId;
    if (req.query.toBranchId) filter.toBranchId = req.query.toBranchId;
  }

  if (req.query.startDate && req.query.endDate) {
    filter.requestedAt = {
      $gte: new Date(req.query.startDate as string),
      $lte: new Date(req.query.endDate as string)
    };
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { transfers, total, totalPages } = await stockService.getStockTransfers(
    filter,
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: transfers.length,
    pagination: { total, page, limit, totalPages },
    data: {
      transfers: transfers.map(transfer => toStockTransferResponse(transfer))
    }
  });
});

export const getStockTransferById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transferId } = req.params;

  const transfer = await stockService.getStockTransfers({ _id: transferId }, 1, 1);
  if (!transfer.transfers.length) {
    return next(new AppError('ไม่พบข้อมูลการโอน', 404));
  }

  const transferData = transfer.transfers[0];

  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(transferData.fromBranchId, req.user!.branchId) &&
      !compareObjectIds(transferData.toBranchId, req.user!.branchId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลการโอนนี้', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transferData)
    }
  });
});

export const approveTransfer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transferId } = req.params;
  const { notes } = req.body;

  const transfer = await stockService.approveTransfer(
    transferId,
    req.user!._id.toString(),
    notes
  );

  res.status(200).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transfer)
    }
  });
});

export const sendTransfer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transferId } = req.params;
  const { notes } = req.body;

  const transfer = await stockService.sendTransfer(
    transferId,
    req.user!._id.toString(),
    notes
  );

  res.status(200).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transfer)
    }
  });
});

export const receiveTransfer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transferId } = req.params;
  const receiveData = req.body;

  const transfer = await stockService.receiveTransfer(
    transferId,
    receiveData,
    req.user!._id.toString()
  );

  res.status(200).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transfer)
    }
  });
});

export const cancelTransfer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transferId } = req.params;
  const { reason } = req.body;

  const transfer = await stockService.cancelTransfer(
    transferId,
    reason,
    req.user!._id.toString()
  );

  res.status(200).json({
    status: 'success',
    data: {
      transfer: toStockTransferResponse(transfer)
    }
  });
});

export const getStockMovements = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};

  if (req.query.productId) filter.productId = req.query.productId;
  if (req.query.movementType) filter.movementType = req.query.movementType;
  if (req.query.referenceType) filter.referenceType = req.query.referenceType;
  if (req.query.referenceId) filter.referenceId = req.query.referenceId;

  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.branchId = req.user!.branchId;
  } else if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  }

  if (req.query.startDate && req.query.endDate) {
    filter.performedAt = {
      $gte: new Date(req.query.startDate as string),
      $lte: new Date(req.query.endDate as string)
    };
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { movements, total, totalPages } = await stockService.getStockMovements(
    filter,
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: movements.length,
    pagination: { total, page, limit, totalPages },
    data: {
      movements: movements.map(movement => toStockMovementResponse(movement))
    }
  });
});

export const getStockSummary = catchAsync(async (req: Request, res: Response) => {
  const branchId = req.user!.roles === UserRole.SUPER_ADMIN && req.query.branchId
    ? req.query.branchId as string
    : req.user!.branchId?.toString();

  const includeValue = req.query.includeValue === 'true';

  const summaries = await stockService.getStockSummary(branchId, includeValue);

  res.status(200).json({
    status: 'success',
    data: {
      summaries
    }
  });
});

export const getLowStockProducts = catchAsync(async (req: Request, res: Response) => {
  const branchId = req.user!.roles === UserRole.SUPER_ADMIN && req.query.branchId
    ? req.query.branchId as string
    : req.user!.branchId?.toString();

  const threshold = parseInt(req.query.threshold as string) || 0;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { products, total, totalPages } = await stockService.getLowStockProducts(
    branchId,
    threshold,
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: products.length,
    pagination: { total, page, limit, totalPages },
    data: {
      products
    }
  });
});

export const getOutOfStockProducts = catchAsync(async (req: Request, res: Response) => {
  const branchId = req.user!.roles === UserRole.SUPER_ADMIN && req.query.branchId
    ? req.query.branchId as string
    : req.user!.branchId?.toString();

  const filter: any = { availableQuantity: 0 };
  if (branchId) {
    filter.branchId = branchId;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { stocks, total, totalPages } = await stockService.findBranchStocks(
    branchId!,
    filter,
    page,
    limit
  );

  res.status(200).json({
    status: 'success',
    results: stocks.length,
    pagination: { total, page, limit, totalPages },
    data: {
      products: stocks.map(stock => toStockResponse(stock))
    }
  });
});