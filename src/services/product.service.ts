// import { FilterQuery } from 'mongoose';
// import Product from '../models/product.model';
// import Stock from '../models/stock.model';
// import StockMovement from '../models/stock-movement.model';
// import { AppError } from '../middlewares/error.middleware';
// import { logger } from '../utils/logger';
// import {
//   IProductDocument,
//   IStockDocument,
//   IStockMovementDocument,
//   CreateProductInput,
//   UpdateProductInput,
//   AdjustStockInput,
//   ProductStatus,
//   StockMovementType
// } from '../types/product.types';

// export class ProductService {
//   /**
//    * ค้นหา Product โดยใช้ ID
//    */
//   async findById(id: string): Promise<IProductDocument | null> {
//     try {
//       return await Product.findById(id)
//         .populate('clinicId', 'name')
//         .populate('branchId', 'name')
//         .populate('createdBy', 'name surname');
//     } catch (error) {
//       logger.error(`Error finding product by ID: ${error}`);
//       return null;
//     }
//   }

//   /**
//    * ค้นหา Product โดยใช้ SKU
//    */
//   async findBySku(sku: string): Promise<IProductDocument | null> {
//     try {
//       return await Product.findOne({ sku: sku.toUpperCase() })
//         .populate('clinicId', 'name')
//         .populate('branchId', 'name')
//         .populate('createdBy', 'name surname');
//     } catch (error) {
//       logger.error(`Error finding product by SKU: ${error}`);
//       return null;
//     }
//   }

//   /**
//    * ดึงข้อมูล Product ทั้งหมด
//    */
//   async findAll(
//     filter: FilterQuery<IProductDocument> = {},
//     sort: Record<string, 1 | -1> = { createdAt: -1 },
//     page = 1,
//     limit = 10
//   ): Promise<{ products: IProductDocument[]; total: number; page: number; totalPages: number }> {
//     try {
//       const skip = (page - 1) * limit;
//       const products = await Product.find(filter)
//         .sort(sort)
//         .skip(skip)
//         .limit(limit)
//         .populate('clinicId', 'name')
//         .populate('branchId', 'name')
//         .populate('createdBy', 'name surname');
      
//       const total = await Product.countDocuments(filter);
//       const totalPages = Math.ceil(total / limit);

//       return { products, total, page, totalPages };
//     } catch (error) {
//       logger.error(`Error finding all products: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า', 500);
//     }
//   }

//   /**
//    * สร้าง Product ใหม่
//    */
//   async createProduct(productData: CreateProductInput, createdBy: string): Promise<IProductDocument> {
//     try {
//       // ตรวจสอบว่า SKU ซ้ำหรือไม่
//       const existingProduct = await this.findBySku(productData.sku);
//       if (existingProduct) {
//         throw new AppError('รหัสสินค้านี้มีอยู่แล้วในระบบ', 400);
//       }

//       // แปลง expiryDate เป็น Date ถ้าเป็น string
//       if (productData.expiryDate && typeof productData.expiryDate === 'string') {
//         productData.expiryDate = new Date(productData.expiryDate);
//       }

//       // สร้าง product
//       const newProduct = await Product.create({
//         ...productData,
//         createdBy
//       });

//       // สร้าง stock เริ่มต้น (quantity = 0)
//       await Stock.create({
//         productId: newProduct._id,
//         branchId: productData.branchId,
//         quantity: 0,
//         reservedQuantity: 0,
//         availableQuantity: 0
//       });

//       return await this.findById(newProduct._id.toString()) as IProductDocument;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       logger.error(`Error creating product: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการสร้างสินค้า', 500);
//     }
//   }

//   /**
//    * อัปเดต Product
//    */
//   async updateProduct(
//     productId: string,
//     updateData: UpdateProductInput
//   ): Promise<IProductDocument | null> {
//     try {
//       const product = await this.findById(productId);
//       if (!product) {
//         throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
//       }

//       // แปลง expiryDate เป็น Date ถ้าเป็น string
//       if (updateData.expiryDate && typeof updateData.expiryDate === 'string') {
//         updateData.expiryDate = new Date(updateData.expiryDate);
//       }

//       const updatedProduct = await Product.findByIdAndUpdate(
//         productId,
//         { $set: updateData },
//         { new: true, runValidators: true }
//       ).populate('clinicId', 'name')
//        .populate('branchId', 'name')
//        .populate('createdBy', 'name surname');

//       return updatedProduct;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       logger.error(`Error updating product: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสินค้า', 500);
//     }
//   }

//   /**
//    * ลบ Product (Soft delete - เปลี่ยนสถานะเป็น discontinued)
//    */
//   async deleteProduct(productId: string): Promise<boolean> {
//     try {
//       const product = await this.findById(productId);
//       if (!product) {
//         throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
//       }

//       // ตรวจสอบว่ามี stock หรือไม่
//       const stocks = await Stock.find({ productId });
//       const hasStock = stocks.some(stock => stock.quantity > 0);
      
//       if (hasStock) {
//         throw new AppError('ไม่สามารถลบสินค้าที่ยังมี stock คงเหลือ', 400);
//       }

//       // Soft delete โดยเปลี่ยนสถานะ
//       await Product.findByIdAndUpdate(
//         productId,
//         { $set: { status: ProductStatus.DISCONTINUED } }
//       );

//       return true;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       logger.error(`Error deleting product: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการลบสินค้า', 500);
//     }
//   }

//   /**
//    * ดึงข้อมูล Stock ของ Product
//    */
//   async getProductStock(productId: string, branchId?: string): Promise<IStockDocument[]> {
//     try {
//       const filter: FilterQuery<IStockDocument> = { productId };
//       if (branchId) {
//         filter.branchId = branchId;
//       }

//       return await Stock.find(filter)
//         .populate('branchId', 'name')
//         .populate('productId', 'name sku units');
//     } catch (error) {
//       logger.error(`Error getting product stock: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล stock', 500);
//     }
//   }

//   /**
//    * ปรับ Stock
//    */
//   async adjustStock(
//     adjustData: AdjustStockInput,
//     performedBy: string
//   ): Promise<IStockMovementDocument> {
//     try {
//       // ตรวจสอบว่ามี product หรือไม่
//       const product = await Product.findById(adjustData.productId);
//       if (!product) {
//         throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
//       }

//       // ตรวจสอบว่า unit ที่ระบุมีอยู่หรือไม่
//       const unit = product.units.find(u => u.unit === adjustData.unit.toUpperCase());
//       if (!unit) {
//         throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
//       }

//       // คำนวณจำนวนในหน่วยหลัก
//       const quantityInBaseUnit = adjustData.quantity * unit.conversionRate;

//       // หา stock หรือสร้างใหม่ถ้าไม่มี
//       let stock = await Stock.findOne({
//         productId: adjustData.productId,
//         branchId: adjustData.branchId
//       });

//       if (!stock) {
//         stock = await Stock.create({
//           productId: adjustData.productId,
//           branchId: adjustData.branchId,
//           quantity: 0,
//           reservedQuantity: 0,
//           availableQuantity: 0
//         });
//       }

//       // บันทึกยอดก่อน
//       const balanceBefore = stock.quantity;

//       // คำนวณยอดใหม่ตาม movement type
//       let newQuantity = stock.quantity;
//       switch (adjustData.movementType) {
//         case StockMovementType.IN:
//         case StockMovementType.RETURN:
//           newQuantity += quantityInBaseUnit;
//           break;
//         case StockMovementType.OUT:
//         case StockMovementType.DAMAGED:
//         case StockMovementType.EXPIRED:
//           if (quantityInBaseUnit > stock.availableQuantity) {
//             throw new AppError('จำนวนที่ต้องการเบิกมากกว่าจำนวนที่พร้อมใช้', 400);
//           }
//           newQuantity -= quantityInBaseUnit;
//           break;
//         case StockMovementType.ADJUSTMENT:
//           newQuantity += quantityInBaseUnit; // อาจเป็น + หรือ - ก็ได้
//           break;
//         case StockMovementType.TRANSFER:
//           // Transfer จะต้องมีการสร้าง movement 2 รายการ (out จากต้นทาง, in ที่ปลายทาง)
//           throw new AppError('กรุณาใช้ฟังก์ชัน transferStock สำหรับการโอนย้ายสินค้า', 400);
//       }

//       if (newQuantity < 0) {
//         throw new AppError('จำนวน stock ไม่สามารถติดลบได้', 400);
//       }

//       // อัปเดต stock
//       stock.quantity = newQuantity;
//       stock.availableQuantity = newQuantity - stock.reservedQuantity;
//       stock.lastUpdated = new Date();
//       await stock.save();

//       // บันทึก stock movement
//       const movement = await StockMovement.create({
//         productId: adjustData.productId,
//         branchId: adjustData.branchId,
//         movementType: adjustData.movementType,
//         quantity: adjustData.quantity,
//         unit: adjustData.unit.toUpperCase(),
//         quantityInBaseUnit,
//         balanceBefore,
//         balanceAfter: newQuantity,
//         referenceType: adjustData.referenceType,
//         referenceId: adjustData.referenceId,
//         reason: adjustData.reason,
//         notes: adjustData.notes,
//         performedBy,
//         performedAt: new Date()
//       });

//       // อัปเดตสถานะ product ถ้า stock = 0
//       if (newQuantity === 0) {
//         await Product.findByIdAndUpdate(
//           adjustData.productId,
//           { $set: { status: ProductStatus.OUT_OF_STOCK } }
//         );
//       } else if (product.status === ProductStatus.OUT_OF_STOCK) {
//         await Product.findByIdAndUpdate(
//           adjustData.productId,
//           { $set: { status: ProductStatus.ACTIVE } }
//         );
//       }

//       return await StockMovement.findById(movement._id)
//         .populate('productId', 'name sku')
//         .populate('branchId', 'name')
//         .populate('performedBy', 'name surname') as IStockMovementDocument;
//     } catch (error) {
//       if (error instanceof AppError) {
//         throw error;
//       }
//       logger.error(`Error adjusting stock: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการปรับ stock', 500);
//     }
//   }

//   /**
//    * ดึงประวัติการเคลื่อนไหว Stock
//    */
//   async getStockHistory(
//     productId: string,
//     filter: FilterQuery<IStockMovementDocument> = {},
//     page = 1,
//     limit = 20
//   ): Promise<{ movements: IStockMovementDocument[]; total: number; page: number; totalPages: number }> {
//     try {
//       const skip = (page - 1) * limit;
//       filter.productId = productId;

//       const movements = await StockMovement.find(filter)
//         .sort({ performedAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate('productId', 'name sku')
//         .populate('branchId', 'name')
//         .populate('performedBy', 'name surname');
      
//       const total = await StockMovement.countDocuments(filter);
//       const totalPages = Math.ceil(total / limit);

//       return { movements, total, page, totalPages };
//     } catch (error) {
//       logger.error(`Error getting stock history: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการดึงประวัติ stock', 500);
//     }
//   }

//   /**
//    * ตรวจสอบสินค้าที่ใกล้หมด
//    */
//   async getLowStockProducts(clinicId: string, branchId?: string): Promise<any[]> {
//     try {
//       const filter: FilterQuery<IProductDocument> = {
//         clinicId,
//         status: ProductStatus.ACTIVE,
//         reorderLevel: { $gt: 0 }
//       };

//       if (branchId) {
//         filter.branchId = branchId;
//       }

//       const products = await Product.find(filter);
//       const lowStockProducts = [];

//       for (const product of products) {
//         const stocks = await Stock.find({
//           productId: product._id,
//           ...(branchId && { branchId })
//         });

//         for (const stock of stocks) {
//           if (stock.availableQuantity <= (product.reorderLevel || 0)) {
//             lowStockProducts.push({
//               product: {
//                 id: product._id,
//                 sku: product.sku,
//                 name: product.name
//               },
//               branch: stock.branchId,
//               availableQuantity: stock.availableQuantity,
//               reorderLevel: product.reorderLevel,
//               unit: product.units.find(u => u.isBaseUnit)?.unit
//             });
//           }
//         }
//       }

//       return lowStockProducts;
//     } catch (error) {
//       logger.error(`Error getting low stock products: ${error}`);
//       throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบสินค้าที่ใกล้หมด', 500);
//     }
//   }
// }

// export default ProductService;

import { FilterQuery } from 'mongoose';
import Product from '../models/product.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IProductDocument,
  CreateProductInput,
  UpdateProductInput,
  ProductStatus,
  StockMovementType
} from '../types/product.types';
// Import Stock types from stock module
import {
  IStockDocument,
  IStockMovementDocument,
  AdjustStockInput
} from '../types/stock.types';
import Stock from '../models/stock.model';
import StockMovement from '../models/stock-movement.model';

export class ProductService {
  /**
   * ค้นหา Product โดยใช้ ID
   */
  async findById(id: string): Promise<IProductDocument | null> {
    try {
      return await Product.findById(id)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'name surname');
    } catch (error) {
      logger.error(`Error finding product by ID: ${error}`);
      return null;
    }
  }

  /**
   * ค้นหา Product โดยใช้ SKU
   */
  async findBySku(sku: string): Promise<IProductDocument | null> {
    try {
      return await Product.findOne({ sku: sku.toUpperCase() })
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'name surname');
    } catch (error) {
      logger.error(`Error finding product by SKU: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Product ทั้งหมด
   */
  async findAll(
    filter: FilterQuery<IProductDocument> = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10
  ): Promise<{ products: IProductDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('clinicId', 'name')
        .populate('branchId', 'name')
        .populate('createdBy', 'name surname');
      
      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { products, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding all products: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า', 500);
    }
  }

  /**
   * สร้าง Product ใหม่
   */
  async createProduct(productData: CreateProductInput, createdBy: string): Promise<IProductDocument> {
    try {
      // ตรวจสอบว่า SKU ซ้ำหรือไม่
      const existingProduct = await this.findBySku(productData.sku);
      if (existingProduct) {
        throw new AppError('รหัสสินค้านี้มีอยู่แล้วในระบบ', 400);
      }

      // แปลง expiryDate เป็น Date ถ้าเป็น string
      if (productData.expiryDate && typeof productData.expiryDate === 'string') {
        productData.expiryDate = new Date(productData.expiryDate);
      }

      // สร้าง product
      const newProduct = await Product.create({
        ...productData,
        createdBy
      });

      // สร้าง stock เริ่มต้น (quantity = 0)
      await Stock.create({
        productId: newProduct._id,
        branchId: productData.branchId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0
      });

      return await this.findById(newProduct._id.toString()) as IProductDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating product: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างสินค้า', 500);
    }
  }

  /**
   * อัปเดต Product
   */
  async updateProduct(
    productId: string,
    updateData: UpdateProductInput
  ): Promise<IProductDocument | null> {
    try {
      const product = await this.findById(productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      // แปลง expiryDate เป็น Date ถ้าเป็น string
      if (updateData.expiryDate && typeof updateData.expiryDate === 'string') {
        updateData.expiryDate = new Date(updateData.expiryDate);
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('clinicId', 'name')
       .populate('branchId', 'name')
       .populate('createdBy', 'name surname');

      return updatedProduct;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error updating product: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอัปเดตสินค้า', 500);
    }
  }

  /**
   * ลบ Product (Soft delete - เปลี่ยนสถานะเป็น discontinued)
   */
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const product = await this.findById(productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      // ตรวจสอบว่ามี stock หรือไม่
      const stocks = await Stock.find({ productId });
      const hasStock = stocks.some(stock => stock.quantity > 0);
      
      if (hasStock) {
        throw new AppError('ไม่สามารถลบสินค้าที่ยังมี stock คงเหลือ', 400);
      }

      // Soft delete โดยเปลี่ยนสถานะ
      await Product.findByIdAndUpdate(
        productId,
        { $set: { status: ProductStatus.DISCONTINUED } }
      );

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error deleting product: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการลบสินค้า', 500);
    }
  }

  /**
   * ดึงข้อมูล Stock ของ Product
   */
  async getProductStock(productId: string, branchId?: string): Promise<IStockDocument[]> {
    try {
      const filter: FilterQuery<IStockDocument> = { productId };
      if (branchId) {
        filter.branchId = branchId;
      }

      return await Stock.find(filter)
        .populate('branchId', 'name')
        .populate('productId', 'name sku units');
    } catch (error) {
      logger.error(`Error getting product stock: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล stock', 500);
    }
  }

  /**
   * ปรับ Stock
   */
  async adjustStock(
    adjustData: AdjustStockInput,
    performedBy: string
  ): Promise<IStockMovementDocument> {
    try {
      // ตรวจสอบว่ามี product หรือไม่
      const product = await Product.findById(adjustData.productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      // ตรวจสอบว่า unit ที่ระบุมีอยู่หรือไม่
      const unit = product.units.find(u => u.unit === adjustData.unit.toUpperCase());
      if (!unit) {
        throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
      }

      // คำนวณจำนวนในหน่วยหลัก
      const quantityInBaseUnit = adjustData.quantity * unit.conversionRate;

      // หา stock หรือสร้างใหม่ถ้าไม่มี
      let stock = await Stock.findOne({
        productId: adjustData.productId,
        branchId: adjustData.branchId
      });

      if (!stock) {
        stock = await Stock.create({
          productId: adjustData.productId,
          branchId: adjustData.branchId,
          quantity: 0,
          reservedQuantity: 0,
          availableQuantity: 0
        });
      }

      // บันทึกยอดก่อน
      const balanceBefore = stock.quantity;

      // คำนวณยอดใหม่ตาม movement type
      let newQuantity = stock.quantity;
      switch (adjustData.movementType) {
        case StockMovementType.IN:
        case StockMovementType.PURCHASE:
        case StockMovementType.RETURN:
        case StockMovementType.TRANSFER_IN:
          newQuantity += quantityInBaseUnit;
          break;
        case StockMovementType.OUT:
        case StockMovementType.SALE:
        case StockMovementType.DAMAGED:
        case StockMovementType.EXPIRED:
        case StockMovementType.TRANSFER_OUT:
          if (quantityInBaseUnit > stock.availableQuantity) {
            throw new AppError('จำนวนที่ต้องการเบิกมากกว่าจำนวนที่พร้อมใช้', 400);
          }
          newQuantity -= quantityInBaseUnit;
          break;
        case StockMovementType.ADJUSTMENT:
          newQuantity += quantityInBaseUnit; // อาจเป็น + หรือ - ก็ได้
          break;
      }

      if (newQuantity < 0) {
        throw new AppError('จำนวน stock ไม่สามารถติดลบได้', 400);
      }

      // อัปเดต stock
      stock.quantity = newQuantity;
      stock.availableQuantity = newQuantity - stock.reservedQuantity;
      stock.lastUpdated = new Date();
      await stock.save();

      // คำนวณต้นทุนรวม
      const totalCost = adjustData.cost ? adjustData.cost * Math.abs(quantityInBaseUnit) : undefined;

      // บันทึก stock movement
      const movement = await StockMovement.create({
        productId: adjustData.productId,
        branchId: adjustData.branchId,
        movementType: adjustData.movementType,
        quantity: adjustData.quantity,
        unit: adjustData.unit.toUpperCase(),
        quantityInBaseUnit,
        balanceBefore,
        balanceAfter: newQuantity,
        referenceType: adjustData.referenceType,
        referenceId: adjustData.referenceId,
        reason: adjustData.reason,
        notes: adjustData.notes,
        cost: adjustData.cost,
        totalCost,
        performedBy,
        performedAt: new Date()
      });

      // อัปเดตสถานะ product ถ้า stock = 0
      if (newQuantity === 0) {
        await Product.findByIdAndUpdate(
          adjustData.productId,
          { $set: { status: ProductStatus.OUT_OF_STOCK } }
        );
      } else if (product.status === ProductStatus.OUT_OF_STOCK) {
        await Product.findByIdAndUpdate(
          adjustData.productId,
          { $set: { status: ProductStatus.ACTIVE } }
        );
      }

      return await StockMovement.findById(movement._id)
        .populate('productId', 'name sku')
        .populate('branchId', 'name')
        .populate('performedBy', 'name surname') as IStockMovementDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error adjusting stock: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการปรับ stock', 500);
    }
  }

  /**
   * ดึงประวัติการเคลื่อนไหว Stock
   */
  async getStockHistory(
    productId: string,
    filter: FilterQuery<IStockMovementDocument> = {},
    page = 1,
    limit = 20
  ): Promise<{ movements: IStockMovementDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      filter.productId = productId;

      const movements = await StockMovement.find(filter)
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name sku')
        .populate('branchId', 'name')
        .populate('performedBy', 'name surname') as IStockMovementDocument[];
      
      const total = await StockMovement.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { movements, total, page, totalPages };
    } catch (error) {
      logger.error(`Error getting stock history: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงประวัติ stock', 500);
    }
  }

  /**
   * ตรวจสอบสินค้าที่ใกล้หมด
   */
  async getLowStockProducts(clinicId: string, branchId?: string): Promise<any[]> {
    try {
      const filter: FilterQuery<IProductDocument> = {
        clinicId,
        status: ProductStatus.ACTIVE,
        reorderLevel: { $gt: 0 }
      };

      if (branchId) {
        filter.branchId = branchId;
      }

      const products = await Product.find(filter);
      const lowStockProducts = [];

      for (const product of products) {
        const stocks = await Stock.find({
          productId: product._id,
          ...(branchId && { branchId })
        });

        for (const stock of stocks) {
          if (stock.availableQuantity <= (product.reorderLevel || 0)) {
            lowStockProducts.push({
              product: {
                id: product._id,
                sku: product.sku,
                name: product.name
              },
              branch: stock.branchId,
              availableQuantity: stock.availableQuantity,
              reorderLevel: product.reorderLevel,
              unit: product.units.find(u => u.isBaseUnit)?.unit
            });
          }
        }
      }

      return lowStockProducts;
    } catch (error) {
      logger.error(`Error getting low stock products: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการตรวจสอบสินค้าที่ใกล้หมด', 500);
    }
  }
}

export default ProductService;