import { FilterQuery } from 'mongoose';
import Stock from '../models/stock.model';
import StockMovement from '../models/stock-movement.model';
import StockTransfer from '../models/stock-transfer.model';
import Product from '../models/product.model';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import {
  IStockDocument,
  IStockMovementDocument,
  IStockTransferDocument,
  AdjustStockInput,
  TransferStockInput,
  ReceiveTransferInput,
  StockMovementType,
  TransferStatus,
  StockSummaryResponse
} from '../types/stock.types';

export class StockService {
  /**
   * ดึงข้อมูล Stock ตาม Product และ Branch
   */
  async findStock(productId: string, branchId: string): Promise<IStockDocument | null> {
    try {
      return await Stock.findOne({ productId, branchId })
        .populate('productId', 'name sku units')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error finding stock: ${error}`);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Stock ทั้งหมดของ Product
   */
  async findProductStocks(productId: string): Promise<IStockDocument[]> {
    try {
      return await Stock.find({ productId })
        .populate('productId', 'name sku units')
        .populate('branchId', 'name');
    } catch (error) {
      logger.error(`Error finding product stocks: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล stock', 500);
    }
  }

  /**
   * ดึงข้อมูล Stock ทั้งหมดของ Branch
   */
  async findBranchStocks(
    branchId: string,
    filter: FilterQuery<IStockDocument> = {},
    page = 1,
    limit = 20
  ): Promise<{ stocks: IStockDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      filter.branchId = branchId;
      
      const stocks = await Stock.find(filter)
        .populate('productId', 'name sku category brand units reorderLevel')
        .populate('branchId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ 'productId.name': 1 });
      
      const total = await Stock.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { stocks, total, page, totalPages };
    } catch (error) {
      logger.error(`Error finding branch stocks: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูล stock', 500);
    }
  }

  /**
   * สร้าง Stock เริ่มต้นสำหรับ Product ใหม่
   */
  async createInitialStock(productId: string, branchId: string): Promise<IStockDocument> {
    try {
      const existingStock = await this.findStock(productId, branchId);
      if (existingStock) {
        return existingStock;
      }

      const stock = await Stock.create({
        productId,
        branchId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0
      });

      return await this.findStock(productId, branchId) as IStockDocument;
    } catch (error) {
      logger.error(`Error creating initial stock: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้าง stock เริ่มต้น', 500);
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
      // ตรวจสอบ Product
      const product = await Product.findById(adjustData.productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      // ตรวจสอบหน่วย
      const unit = product.units.find(u => u.unit === adjustData.unit.toUpperCase());
      if (!unit) {
        throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
      }

      // คำนวณจำนวนในหน่วยหลัก
      const quantityInBaseUnit = adjustData.quantity * unit.conversionRate;

      // หา Stock หรือสร้างใหม่
      let stock = await this.findStock(adjustData.productId, adjustData.branchId);
      if (!stock) {
        stock = await this.createInitialStock(adjustData.productId, adjustData.branchId);
      }

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

      // อัปเดต Stock
      await stock.setStock(newQuantity);

      // คำนวณต้นทุนรวม
      const totalCost = adjustData.cost ? adjustData.cost * Math.abs(quantityInBaseUnit) : undefined;

      // บันทึก Stock Movement
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
   * จอง Stock
   */
  async reserveStock(
    productId: string,
    branchId: string,
    quantity: number,
    unit: string,
    referenceType: string,
    referenceId: string,
    performedBy: string,
    notes?: string
  ): Promise<IStockDocument> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      const unitInfo = product.units.find(u => u.unit === unit.toUpperCase());
      if (!unitInfo) {
        throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
      }

      const quantityInBaseUnit = quantity * unitInfo.conversionRate;

      let stock = await this.findStock(productId, branchId);
      if (!stock) {
        throw new AppError('ไม่พบข้อมูล stock', 404);
      }

      if (quantityInBaseUnit > stock.availableQuantity) {
        throw new AppError('จำนวนที่ต้องการจองมากกว่าจำนวนที่พร้อมใช้', 400);
      }

      await stock.reserve(quantityInBaseUnit);

      // บันทึก Movement สำหรับการจอง
      await StockMovement.create({
        productId,
        branchId,
        movementType: StockMovementType.OUT, // ถือว่าเป็นการเบิกออกชั่วคราว
        quantity: -quantity, // ติดลบเพื่อแสดงว่าเป็นการจอง
        unit: unit.toUpperCase(),
        quantityInBaseUnit: -quantityInBaseUnit,
        balanceBefore: stock.quantity,
        balanceAfter: stock.quantity, // quantity ไม่เปลี่ยน เปลี่ยนแค่ reserved
        referenceType,
        referenceId,
        reason: 'การจองสินค้า',
        notes,
        performedBy,
        performedAt: new Date()
      });

      return stock;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error reserving stock: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการจอง stock', 500);
    }
  }

  /**
   * ยกเลิกการจอง Stock
   */
  async unreserveStock(
    productId: string,
    branchId: string,
    quantity: number,
    unit: string,
    referenceType: string,
    referenceId: string,
    performedBy: string,
    notes?: string
  ): Promise<IStockDocument> {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      const unitInfo = product.units.find(u => u.unit === unit.toUpperCase());
      if (!unitInfo) {
        throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
      }

      const quantityInBaseUnit = quantity * unitInfo.conversionRate;

      let stock = await this.findStock(productId, branchId);
      if (!stock) {
        throw new AppError('ไม่พบข้อมูล stock', 404);
      }

      if (quantityInBaseUnit > stock.reservedQuantity) {
        throw new AppError('จำนวนที่ต้องการยกเลิกการจองมากกว่าจำนวนที่จองไว้', 400);
      }

      await stock.unreserve(quantityInBaseUnit);

      // บันทึก Movement สำหรับการยกเลิกการจอง
      await StockMovement.create({
        productId,
        branchId,
        movementType: StockMovementType.IN, // คืนกลับมา
        quantity,
        unit: unit.toUpperCase(),
        quantityInBaseUnit,
        balanceBefore: stock.quantity,
        balanceAfter: stock.quantity, // quantity ไม่เปลี่ยน เปลี่ยนแค่ reserved
        referenceType,
        referenceId,
        reason: 'ยกเลิกการจองสินค้า',
        notes,
        performedBy,
        performedAt: new Date()
      });

      return stock;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error unreserving stock: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการยกเลิกการจอง stock', 500);
    }
  }

  /**
   * สร้างคำขอโอน Stock
   */
  async createTransferRequest(
    transferData: TransferStockInput,
    requestedBy: string
  ): Promise<IStockTransferDocument> {
    try {
      // ตรวจสอบ Product
      const product = await Product.findById(transferData.productId);
      if (!product) {
        throw new AppError('ไม่พบข้อมูลสินค้านี้', 404);
      }

      // ตรวจสอบหน่วย
      const unit = product.units.find(u => u.unit === transferData.unit.toUpperCase());
      if (!unit) {
        throw new AppError('ไม่พบหน่วยที่ระบุ', 400);
      }

      // ตรวจสอบ Stock ที่สาขาต้นทาง
      const sourceStock = await this.findStock(transferData.productId, transferData.fromBranchId);
      if (!sourceStock) {
        throw new AppError('ไม่พบข้อมูล stock ที่สาขาต้นทาง', 404);
      }

      const quantityInBaseUnit = transferData.quantity * unit.conversionRate;
      if (quantityInBaseUnit > sourceStock.availableQuantity) {
        throw new AppError('จำนวนที่ต้องการโอนมากกว่าจำนวนที่พร้อมใช้', 400);
      }

      // สร้างคำขอโอน
      const transfer = await StockTransfer.create({
        productId: transferData.productId,
        fromBranchId: transferData.fromBranchId,
        toBranchId: transferData.toBranchId,
        quantity: transferData.quantity,
        unit: transferData.unit.toUpperCase(),
        quantityInBaseUnit,
        reason: transferData.reason,
        notes: transferData.notes,
        requestedBy
      });

      return await StockTransfer.findById(transfer._id)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname') as IStockTransferDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error creating transfer request: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการสร้างคำขอโอน', 500);
    }
  }

  /**
   * อนุมัติการโอน
   */
  async approveTransfer(
    transferId: string,
    approvedBy: string,
    notes?: string
  ): Promise<IStockTransferDocument> {
    try {
      const transfer = await StockTransfer.findById(transferId);
      if (!transfer) {
        throw new AppError('ไม่พบข้อมูลการโอน', 404);
      }

      // จอง Stock ที่สาขาต้นทาง
      await this.reserveStock(
        transfer.productId.toString(),
        transfer.fromBranchId.toString(),
        transfer.quantity,
        transfer.unit,
        'transfer',
        transfer._id.toString(),
        approvedBy,
        'จองสำหรับการโอน'
      );

      await transfer.approve(approvedBy, notes);

      return await StockTransfer.findById(transferId)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname')
        .populate('approvedBy', 'name surname') as IStockTransferDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error approving transfer: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการอนุมัติการโอน', 500);
    }
  }

  /**
   * ส่งสินค้า
   */
  async sendTransfer(
    transferId: string,
    sentBy: string,
    notes?: string
  ): Promise<IStockTransferDocument> {
    try {
      const transfer = await StockTransfer.findById(transferId);
      if (!transfer) {
        throw new AppError('ไม่พบข้อมูลการโอน', 404);
      }

      // ลด Stock ที่สาขาต้นทาง
      await this.adjustStock({
        productId: transfer.productId.toString(),
        branchId: transfer.fromBranchId.toString(),
        quantity: transfer.quantity,
        unit: transfer.unit,
        movementType: StockMovementType.TRANSFER_OUT,
        referenceType: 'transfer',
        referenceId: transfer._id.toString(),
        notes: 'โอนออกไปยังสาขาอื่น'
      }, sentBy);

      // ยกเลิกการจอง
      await this.unreserveStock(
        transfer.productId.toString(),
        transfer.fromBranchId.toString(),
        transfer.quantity,
        transfer.unit,
        'transfer',
        transfer._id.toString(),
        sentBy,
        'ยกเลิกการจองหลังจากส่งสินค้า'
      );

      await transfer.send(sentBy, notes);

      return await StockTransfer.findById(transferId)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname')
        .populate('approvedBy', 'name surname')
        .populate('sentBy', 'name surname') as IStockTransferDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error sending transfer: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการส่งสินค้า', 500);
    }
  }

  /**
   * รับสินค้า
   */
  async receiveTransfer(
    transferId: string,
    receiveData: ReceiveTransferInput,
    receivedBy: string
  ): Promise<IStockTransferDocument> {
    try {
      const transfer = await StockTransfer.findById(transferId);
      if (!transfer) {
        throw new AppError('ไม่พบข้อมูลการโอน', 404);
      }

      const receivedQuantity = receiveData.receivedQuantity || transfer.quantity;

      // เพิ่ม Stock ที่สาขาปลายทาง
      await this.adjustStock({
        productId: transfer.productId.toString(),
        branchId: transfer.toBranchId.toString(),
        quantity: receivedQuantity,
        unit: transfer.unit,
        movementType: StockMovementType.TRANSFER_IN,
        referenceType: 'transfer',
        referenceId: transfer._id.toString(),
        notes: receiveData.notes || 'รับโอนจากสาขาอื่น'
      }, receivedBy);

      await transfer.receive(receivedBy, receiveData.notes);

      return await StockTransfer.findById(transferId)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname')
        .populate('approvedBy', 'name surname')
        .populate('sentBy', 'name surname')
        .populate('receivedBy', 'name surname') as IStockTransferDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error receiving transfer: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการรับสินค้า', 500);
    }
  }

  /**
   * ยกเลิกการโอน
   */
  async cancelTransfer(
    transferId: string,
    reason: string,
    cancelledBy: string
  ): Promise<IStockTransferDocument> {
    try {
      const transfer = await StockTransfer.findById(transferId);
      if (!transfer) {
        throw new AppError('ไม่พบข้อมูลการโอน', 404);
      }

      // ถ้ามีการจองไว้ ให้ยกเลิกการจอง
      if (transfer.status === TransferStatus.IN_TRANSIT) {
        try {
          await this.unreserveStock(
            transfer.productId.toString(),
            transfer.fromBranchId.toString(),
            transfer.quantity,
            transfer.unit,
            'transfer',
            transfer._id.toString(),
            cancelledBy,
            'ยกเลิกการจองเนื่องจากยกเลิกการโอน'
          );
        } catch (error) {
          // ถ้ายกเลิกการจองไม่ได้ อาจเป็นเพราะได้ส่งสินค้าไปแล้ว
          logger.warn(`Could not unreserve stock for cancelled transfer: ${error}`);
        }
      }

      await transfer.cancel(reason);

      return await StockTransfer.findById(transferId)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname') as IStockTransferDocument;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Error cancelling transfer: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการยกเลิกการโอน', 500);
    }
  }

  /**
   * ดึงประวัติการเคลื่อนไหว Stock
   */
  async getStockMovements(
    filter: FilterQuery<IStockMovementDocument> = {},
    page = 1,
    limit = 20
  ): Promise<{ movements: IStockMovementDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      const movements = await StockMovement.find(filter)
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name sku')
        .populate('branchId', 'name')
        .populate('performedBy', 'name surname')
        .populate('transferId', 'transferNumber');
      
      const total = await StockMovement.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { movements, total, page, totalPages };
    } catch (error) {
      logger.error(`Error getting stock movements: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงประวัติการเคลื่อนไหว stock', 500);
    }
  }

  /**
   * ดึงข้อมูลการโอน
   */
  async getStockTransfers(
    filter: FilterQuery<IStockTransferDocument> = {},
    page = 1,
    limit = 20
  ): Promise<{ transfers: IStockTransferDocument[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      const transfers = await StockTransfer.find(filter)
        .sort({ requestedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('productId', 'name sku')
        .populate('fromBranchId', 'name')
        .populate('toBranchId', 'name')
        .populate('requestedBy', 'name surname')
        .populate('approvedBy', 'name surname')
        .populate('sentBy', 'name surname')
        .populate('receivedBy', 'name surname');
      
      const total = await StockTransfer.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      return { transfers, total, page, totalPages };
    } catch (error) {
      logger.error(`Error getting stock transfers: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการโอน', 500);
    }
  }

  /**
   * ดึงสรุป Stock
   */
  async getStockSummary(branchId?: string, includeValue = false): Promise<StockSummaryResponse[]> {
    try {
      const pipeline: any[] = [];

      // Match stage
      const match: any = {};
      if (branchId) {
        match.branchId = branchId;
      }
      if (Object.keys(match).length > 0) {
        pipeline.push({ $match: match });
      }

      // Lookup product data
      pipeline.push({
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      });

      pipeline.push({ $unwind: '$product' });

      // Group by branch
      const groupStage: any = {
        $group: {
          _id: '$branchId',
          totalProducts: { $sum: 1 },
          lowStockProducts: {
            $sum: {
              $cond: [
                {
                  $lte: [
                    '$availableQuantity',
                    { $ifNull: ['$product.reorderLevel', 0] }
                  ]
                },
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ['$availableQuantity', 0] }, 1, 0]
            }
          }
        }
      };

      if (includeValue) {
        groupStage.$group.totalValue = {
          $sum: { $multiply: ['$quantity', '$product.cost'] }
        };
      }

      pipeline.push(groupStage);

      // Lookup branch data
      pipeline.push({
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      });

      pipeline.push({ $unwind: '$branch' });

      const results = await Stock.aggregate(pipeline);

      return results.map((result: any) => ({
        branchId: result._id.toString(),
        branchName: result.branch.name,
        totalProducts: result.totalProducts,
        lowStockProducts: result.lowStockProducts,
        outOfStockProducts: result.outOfStockProducts,
        totalValue: result.totalValue || 0
      }));
    } catch (error) {
      logger.error(`Error getting stock summary: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสรุป stock', 500);
    }
  }

  /**
   * ดึงสินค้าที่ใกล้หมด
   */
  async getLowStockProducts(
    branchId?: string,
    threshold = 0,
    page = 1,
    limit = 20
  ): Promise<{ products: any[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;

      const lowStockData = await Stock.findLowStock(branchId, threshold);
      const total = lowStockData.length;
      const totalPages = Math.ceil(total / limit);
      const products = lowStockData.slice(skip, skip + limit);

      return { products, total, page, totalPages };
    } catch (error) {
      logger.error(`Error getting low stock products: ${error}`);
      throw new AppError('เกิดข้อผิดพลาดในการดึงสินค้าที่ใกล้หมด', 500);
    }
  }
}

export default StockService;