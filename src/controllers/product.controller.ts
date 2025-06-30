import { Request, Response, NextFunction } from 'express';
import { catchAsync, AppError } from '../middlewares/error.middleware';
import { ProductService } from '../services/product.service';
import { toProductResponse } from '../types/product.types';
import { toStockResponse } from '../types/stock.types';
import { UserRole } from '../types/user.types';
import { compareObjectIds } from '../utils/mogoose.utils';

const productService = new ProductService();

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filter: any = {};
  
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = new RegExp(req.query.category as string, 'i');
  if (req.query.brand) filter.brand = new RegExp(req.query.brand as string, 'i');
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { category: searchRegex },
      { brand: searchRegex }
    ];
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    filter.clinicId = req.user!.clinicId;
  } else if (req.query.clinicId) {
    filter.clinicId = req.query.clinicId;
  }
  
  if (req.query.branchId) filter.branchId = req.query.branchId;
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortField = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  const { products, total, totalPages } = await productService.findAll(
    filter,
    { [sortField]: sortOrder },
    page,
    limit
  );
  
  const productsWithStock = await Promise.all(
    products.map(async (product) => {
      const stocks = await productService.getProductStock(
        product._id.toString(),
        req.query.branchId as string
      );
      const stock = stocks[0];
      return toProductResponse(product, stock);
    })
  );
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    pagination: { total, page, limit, totalPages },
    data: {
      products: productsWithStock
    }
  });
});

export const getProductById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  
  const product = await productService.findById(productId);
  if (!product) {
    return next(new AppError('ไม่พบข้อมูลสินค้านี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(product.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลสินค้านี้', 403));
  }
  
  const stocks = await productService.getProductStock(productId);
  
  res.status(200).json({
    status: 'success',
    data: {
      product: toProductResponse(product),
      stocks: stocks.map(stock => toStockResponse(stock, product.units))
    }
  });
});

export const createProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const productData = req.body;
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN) {
    if (!productData.clinicId || productData.clinicId !== req.user!.clinicId?.toString()) {
      productData.clinicId = req.user!.clinicId?.toString();
    }
  }
  
  const newProduct = await productService.createProduct(productData, req.user!._id.toString());
  
  res.status(201).json({
    status: 'success',
    data: {
      product: toProductResponse(newProduct)
    }
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  const updateData = req.body;
  
  const product = await productService.findById(productId);
  if (!product) {
    return next(new AppError('ไม่พบข้อมูลสินค้านี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(product.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขข้อมูลสินค้านี้', 403));
  }
  
  const updatedProduct = await productService.updateProduct(productId, updateData);
  
  res.status(200).json({
    status: 'success',
    data: {
      product: toProductResponse(updatedProduct!)
    }
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.id;
  
  const product = await productService.findById(productId);
  if (!product) {
    return next(new AppError('ไม่พบข้อมูลสินค้านี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(product.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ลบข้อมูลสินค้านี้', 403));
  }
  
  await productService.deleteProduct(productId);
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

export const adjustStock = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const adjustData = req.body;
  
  const product = await productService.findById(adjustData.productId);
  if (!product) {
    return next(new AppError('ไม่พบข้อมูลสินค้านี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(product.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ปรับ stock สินค้านี้', 403));
  }
  
  const movement = await productService.adjustStock(
    adjustData,
    req.user!._id.toString()
  );
  
  res.status(201).json({
    status: 'success',
    data: {
      movement
    }
  });
});

export const getStockHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const productId = req.params.productId;
  
  const product = await productService.findById(productId);
  if (!product) {
    return next(new AppError('ไม่พบข้อมูลสินค้านี้', 404));
  }
  
  if (req.user!.roles !== UserRole.SUPER_ADMIN && 
      !compareObjectIds(product.clinicId, req.user!.clinicId)) {
    return next(new AppError('คุณไม่มีสิทธิ์ดูประวัติ stock สินค้านี้', 403));
  }
  
  const filter: any = {};
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.movementType) filter.movementType = req.query.movementType;
  if (req.query.startDate && req.query.endDate) {
    filter.performedAt = {
      $gte: new Date(req.query.startDate as string),
      $lte: new Date(req.query.endDate as string)
    };
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const { movements, total, totalPages } = await productService.getStockHistory(
    productId,
    filter,
    page,
    limit
  );
  
  res.status(200).json({
    status: 'success',
    results: movements.length,
    pagination: { total, page, limit, totalPages },
    data: {
      movements
    }
  });
});

export const getLowStockProducts = catchAsync(async (req: Request, res: Response) => {
  const clinicId = req.user!.roles === UserRole.SUPER_ADMIN && req.query.clinicId
    ? req.query.clinicId as string
    : req.user!.clinicId!.toString();
  
  const branchId = req.query.branchId as string;
  
  const lowStockProducts = await productService.getLowStockProducts(clinicId, branchId);
  
  res.status(200).json({
    status: 'success',
    results: lowStockProducts.length,
    data: {
      products: lowStockProducts
    }
  });
});