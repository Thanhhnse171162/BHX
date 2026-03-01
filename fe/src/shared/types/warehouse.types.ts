/**
 * =====================================================
 * ENTERPRISE WAREHOUSE MANAGEMENT SYSTEM (WMS)
 * TypeScript Type Definitions
 * Version: 1.0
 * =====================================================
 */

// =====================================================
// A) STOCK MOVEMENT TYPES
// =====================================================

export type MovementTypeCode =
  | 'PURCHASE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'DAMAGE'
  | 'EXPIRED'
  | 'ADJUSTMENT'
  | 'RETURN_SUPPLIER'
  | 'SALE_DEDUCTION'
  | 'PRODUCTION'
  | 'SAMPLE';

export type MovementStatus =
  | 'CREATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type QualityStatus = 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE';

export interface MovementType {
  id: number;
  code: MovementTypeCode;
  name: string;
  description?: string;
  isInbound: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  movementNumber: string; // SM-YYYYMMDD-XXXXX
  movementTypeId: number;
  movementType?: MovementType;

  // Location
  warehouseId?: number;
  storeId?: number;
  fromLocationId?: number;
  toLocationId?: number;

  // Reference Documents
  referenceType?: string;
  referenceNumber?: string;
  poNumber?: string;
  transferId?: number;
  adjustmentId?: number;
  invoiceNumber?: string;

  // Status
  status: MovementStatus;

  // Financial
  totalQuantity: number;
  totalValue?: number;
  currencyCode: string;

  // Metadata
  notes?: string;
  remarks?: string;
  createdBy: number;
  createdAt: string;
  updatedBy?: number;
  updatedAt: string;

  // Approval Workflow
  submittedBy?: number;
  submittedAt?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;

  // Completion
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  // Relations
  items?: StockMovementItem[];
  attachments?: StockMovementAttachment[];
}

export interface StockMovementItem {
  id: number;
  movementId: number;

  // Product
  productId: number;
  sku: string;
  productName: string;

  // Batch/Lot
  batchId?: number;
  batchNumber?: string;
  lotNumber?: string;
  serialNumber?: string;

  // Quantity
  quantity: number;
  unitOfMeasure: string;

  // Cost
  unitCost?: number;
  totalCost?: number;

  // Quality
  qualityStatus: QualityStatus;

  // Location
  fromBinLocation?: string;
  toBinLocation?: string;

  // Expiry
  expiryDate?: string;
  manufacturingDate?: string;

  notes?: string;
  createdAt: string;
}

export interface StockMovementAttachment {
  id: number;
  movementId: number;
  attachmentType: 'INVOICE' | 'PHOTO' | 'DELIVERY_NOTE' | 'SIGNATURE' | 'PACKING_LIST' | 'QUALITY_CERT' | 'OTHER';
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: number;
  uploadedAt: string;
}

// =====================================================
// B) PURCHASE REQUEST & PURCHASE ORDER
// =====================================================

export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED_TO_PO' | 'CANCELLED';
export type PRPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type POStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Supplier {
  id: number;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequest {
  id: number;
  prNumber: string; // PR-YYYYMMDD-XXXXX

  // Requester
  requestedBy: number;
  warehouseId?: number;
  storeId?: number;

  // Dates
  requestDate: string;
  requiredDate: string;
  priority: PRPriority;

  // Status
  status: PRStatus;

  // Approval
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;

  // Notes
  notes?: string;
  justification?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  items?: PurchaseRequestItem[];
}

export interface PurchaseRequestItem {
  id: number;
  prId: number;

  productId: number;
  sku: string;
  productName: string;

  // Stock Info
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;

  // Calculation
  avgDailySales: number;
  leadTimeDays: number;
  suggestedQuantity: number;
  requestedQuantity: number;
  unitOfMeasure: string;

  // Cost
  estimatedUnitPrice?: number;
  estimatedTotal?: number;

  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string; // PO-YYYYMMDD-XXXXX

  // Supplier
  supplierId: number;
  supplier?: Supplier;

  // Reference
  prId?: number;

  // Dates
  poDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;

  // Location
  deliveryWarehouseId?: number;
  deliveryStoreId?: number;
  deliveryAddress?: string;

  // Status
  status: POStatus;

  // Financial
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount?: number;
  currencyCode: string;

  // Payment
  paymentTerms?: string;
  paymentStatus: PaymentStatus;

  // Approval
  createdBy: number;
  approvedBy?: number;
  approvedAt?: string;

  notes?: string;
  termsAndConditions?: string;

  createdAt: string;
  updatedAt: string;

  // Relations
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  poId: number;
  prItemId?: number;

  productId: number;
  sku: string;
  productName: string;

  orderedQuantity: number;
  receivedQuantity: number;
  unitOfMeasure: string;

  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal?: number;

  notes?: string;
  createdAt: string;
}

// =====================================================
// C) BATCH/LOT/EXPIRY MANAGEMENT
// =====================================================

export type BatchStatus = 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'QUARANTINE' | 'RECALLED';

export interface Batch {
  id: number;
  batchNumber: string;
  lotNumber?: string;

  // Product
  productId: number;
  sku: string;

  // Supplier
  supplierId?: number;

  // Dates
  manufacturingDate?: string;
  expiryDate?: string;
  receivedDate?: string;
  daysToExpire?: number; // Calculated

  // Quantity
  initialQuantity: number;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number; // currentQuantity - reservedQuantity

  // Cost
  unitCost?: number;

  // Status
  status: BatchStatus;
  qualityStatus: QualityStatus;
  qualityCheckedBy?: number;
  qualityCheckedAt?: string;
  qualityNotes?: string;

  // Location
  warehouseId?: number;
  binLocation?: string;

  createdAt: string;
  updatedAt: string;
}

export interface BatchTransaction {
  id: number;
  batchId: number;

  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';
  transactionRef?: string;

  quantity: number;
  quantityBefore: number;
  quantityAfter: number;

  movementId?: number;

  createdBy: number;
  createdAt: string;
}

export interface ExpiryAlertConfig {
  id: number;
  productCategoryId?: number;
  alertDaysBefore: number;
  criticalDaysBefore: number;
  notificationEmails?: string;
  isActive: boolean;
  createdAt: string;
}

// =====================================================
// D) INVENTORY CHECK (CYCLE COUNT)
// =====================================================

export type InventoryCheckStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'POSTED' | 'CANCELLED';
export type VarianceReason = 'SHRINKAGE' | 'THEFT' | 'DAMAGED' | 'COUNT_ERROR' | 'SYSTEM_ERROR' | 'EXPIRED' | 'RECEIVING_ERROR' | 'OTHER';

export interface InventoryCheckType {
  id: number;
  code: string;
  name: string;
  description?: string;
  frequencyDays?: number;
  createdAt: string;
}

export interface InventoryCheck {
  id: number;
  checkNumber: string; // IC-YYYYMMDD-XXXXX

  // Type
  checkTypeId: number;
  checkType?: InventoryCheckType;

  // Location
  warehouseId?: number;
  storeId?: number;

  // Category
  categoryId?: number;

  // Schedule
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;

  // Status
  status: InventoryCheckStatus;

  // Assigned
  assignedTo?: number;
  verifiedBy?: number;

  // Summary
  totalItemsToCount: number;
  totalItemsCounted: number;
  itemsWithVariance: number;
  totalVarianceQty: number;
  totalVarianceValue: number;
  variancePercent: number;

  // Approval
  approvedBy?: number;
  approvedAt?: string;

  // Posting
  adjustmentPosted: boolean;
  adjustmentMovementId?: number;
  postedAt?: string;
  postedBy?: number;

  notes?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  items?: InventoryCheckItem[];
}

export interface InventoryCheckItem {
  id: number;
  checkId: number;

  // Product
  productId: number;
  sku: string;
  productName: string;

  // Batch
  batchId?: number;
  batchNumber?: string;
  expiryDate?: string;

  // Location
  binLocation?: string;

  // Quantities
  systemQuantity: number;
  countedQuantity?: number;
  varianceQuantity: number; // counted - system

  // Values
  unitCost?: number;
  systemValue: number;
  countedValue: number;
  varianceValue: number;

  // Root Cause
  varianceReason?: VarianceReason;
  rootCause?: string;
  correctiveAction?: string;

  // Count Details
  countedBy?: number;
  countedAt?: string;
  verifiedBy?: number;
  verifiedAt?: string;

  hasPhoto: boolean;
  notes?: string;
  createdAt: string;
}

export interface InventoryCheckPhoto {
  id: number;
  checkItemId: number;
  fileName: string;
  filePath: string;
  uploadedBy?: number;
  uploadedAt: string;
}

// =====================================================
// E) INVENTORY VALUATION
// =====================================================

export type ValuationMethod = 'FIFO' | 'MOVING_AVG' | 'STANDARD' | 'LIFO';

export interface ValuationMethodConfig {
  id: number;
  code: ValuationMethod;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ProductCosting {
  id: number;
  productId: number;
  sku: string;

  valuationMethodId: number;

  // Costs
  currentCost?: number;
  standardCost?: number;

  // Moving Average
  totalQuantity: number;
  totalValue: number;
  movingAvgCost: number;

  lastPurchaseCost?: number;
  lastPurchaseDate?: string;

  // History
  costHistoryJson?: string;

  updatedAt: string;
}

export interface InventoryValuationSnapshot {
  id: number;
  snapshotDate: string;
  warehouseId?: number;

  totalSkuCount: number;
  totalQuantity: number;
  totalValue: number;

  categoryBreakdown?: string; // JSON

  createdBy?: number;
  createdAt: string;
}

// =====================================================
// F) WAREHOUSE & LOCATION
// =====================================================

export interface Warehouse {
  id: number;
  warehouseCode: string;
  name: string;
  type?: 'MAIN' | 'BRANCH' | 'COLD_STORAGE' | 'TRANSIT';

  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;

  managerId?: number;
  phone?: string;
  email?: string;

  capacitySqm?: number;

  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocation {
  id: number;
  warehouseId: number;

  locationCode: string;
  locationType?: 'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN';

  parentLocationId?: number;

  // Climate
  temperatureControlled: boolean;
  temperatureMin?: number;
  temperatureMax?: number;

  // Capacity
  capacityWeight?: number;
  capacityVolume?: number;

  status: 'ACTIVE' | 'INACTIVE' | 'DAMAGED' | 'MAINTENANCE';
  createdAt: string;
}

// =====================================================
// G) AUDIT & LOGGING
// =====================================================

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'SUBMIT' | 'COMPLETE';

export interface AuditLog {
  id: number;

  // Entity
  tableName: string;
  recordId: number;

  // Action
  action: AuditAction;

  // Changes
  fieldName?: string;
  oldValue?: string;
  newValue?: string;

  // User
  userId: number;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;

  // Context
  operationContext?: string;

  createdAt: string;
}

// =====================================================
// H) DASHBOARD METRICS (Enterprise Level)
// =====================================================

export interface WarehouseDashboardMetrics {
  // Basic Counts
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;

  // Value Metrics
  totalInventoryValue: number;
  totalInventoryQty: number;

  // Turnover
  stockTurnoverRate: number; // times per year
  avgDaysToSell: number;

  // Accuracy & Quality
  stockAccuracyPercent: number; // From cycle counts
  shrinkagePercent: number;
  shrinkageValue: number;

  // Expiry Risk (FMCG)
  itemsExpiringIn7Days: number;
  itemsExpiringIn30Days: number;
  expiryRiskValue: number;

  // Out of Stock Impact
  outOfStockDurationDays: number;
  lostSalesEstimate: number;

  // Recent Activity
  recentStockIns: number;
  recentStockOuts: number;
  pendingApprovals: number;

  // Batch Health
  activeBatches: number;
  expiredBatches: number;
  quarantinedBatches: number;
}

// =====================================================
// I) PERMISSION MATRIX
// =====================================================

export type WMSPermission =
  // Stock Movement
  | 'STOCK_MOVEMENT_VIEW'
  | 'STOCK_MOVEMENT_CREATE'
  | 'STOCK_MOVEMENT_EDIT'
  | 'STOCK_MOVEMENT_DELETE'
  | 'STOCK_MOVEMENT_APPROVE'
  | 'STOCK_MOVEMENT_SUBMIT'

  // Purchase Request
  | 'PR_VIEW'
  | 'PR_CREATE'
  | 'PR_EDIT'
  | 'PR_APPROVE'
  | 'PR_REJECT'

  // Purchase Order
  | 'PO_VIEW'
  | 'PO_CREATE'
  | 'PO_EDIT'
  | 'PO_APPROVE'
  | 'PO_CANCEL'

  // Inventory Check
  | 'INVENTORY_CHECK_VIEW'
  | 'INVENTORY_CHECK_CREATE'
  | 'INVENTORY_CHECK_PERFORM'
  | 'INVENTORY_CHECK_APPROVE'
  | 'INVENTORY_CHECK_POST'

  // Batch Management
  | 'BATCH_VIEW'
  | 'BATCH_CREATE'
  | 'BATCH_EDIT'
  | 'BATCH_QUARANTINE'

  // Reports
  | 'REPORT_INVENTORY_VALUE'
  | 'REPORT_STOCK_MOVEMENT'
  | 'REPORT_EXPIRY'
  | 'REPORT_VARIANCE'

  // Master Data
  | 'WAREHOUSE_MANAGE'
  | 'SUPPLIER_MANAGE'
  | 'LOCATION_MANAGE';

export type WMSRole =
  | 'WAREHOUSE_STAFF'
  | 'WAREHOUSE_SUPERVISOR'
  | 'WAREHOUSE_MANAGER'
  | 'AREA_MANAGER'
  | 'SUPPLY_CHAIN'
  | 'ADMIN';

export interface RolePermissions {
  role: WMSRole;
  permissions: WMSPermission[];
}

// Default Permission Matrix
export const WMS_PERMISSION_MATRIX: Record<WMSRole, WMSPermission[]> = {
  WAREHOUSE_STAFF: [
    'STOCK_MOVEMENT_VIEW',
    'STOCK_MOVEMENT_CREATE',
    'STOCK_MOVEMENT_SUBMIT',
    'PR_VIEW',
    'PR_CREATE',
    'INVENTORY_CHECK_VIEW',
    'INVENTORY_CHECK_PERFORM',
    'BATCH_VIEW',
    'BATCH_CREATE',
  ],
  WAREHOUSE_SUPERVISOR: [
    'STOCK_MOVEMENT_VIEW',
    'STOCK_MOVEMENT_CREATE',
    'STOCK_MOVEMENT_EDIT',
    'STOCK_MOVEMENT_SUBMIT',
    'STOCK_MOVEMENT_APPROVE', // Can approve small movements
    'PR_VIEW',
    'PR_CREATE',
    'PR_EDIT',
    'INVENTORY_CHECK_VIEW',
    'INVENTORY_CHECK_CREATE',
    'INVENTORY_CHECK_PERFORM',
    'INVENTORY_CHECK_APPROVE',
    'BATCH_VIEW',
    'BATCH_CREATE',
    'BATCH_EDIT',
    'BATCH_QUARANTINE',
    'REPORT_STOCK_MOVEMENT',
    'REPORT_EXPIRY',
  ],
  WAREHOUSE_MANAGER: [
    'STOCK_MOVEMENT_VIEW',
    'STOCK_MOVEMENT_CREATE',
    'STOCK_MOVEMENT_EDIT',
    'STOCK_MOVEMENT_DELETE',
    'STOCK_MOVEMENT_APPROVE',
    'STOCK_MOVEMENT_SUBMIT',
    'PR_VIEW',
    'PR_CREATE',
    'PR_EDIT',
    'PR_APPROVE',
    'PR_REJECT',
    'PO_VIEW',
    'PO_CREATE',
    'PO_EDIT',
    'INVENTORY_CHECK_VIEW',
    'INVENTORY_CHECK_CREATE',
    'INVENTORY_CHECK_PERFORM',
    'INVENTORY_CHECK_APPROVE',
    'INVENTORY_CHECK_POST',
    'BATCH_VIEW',
    'BATCH_CREATE',
    'BATCH_EDIT',
    'BATCH_QUARANTINE',
    'REPORT_INVENTORY_VALUE',
    'REPORT_STOCK_MOVEMENT',
    'REPORT_EXPIRY',
    'REPORT_VARIANCE',
    'WAREHOUSE_MANAGE',
    'LOCATION_MANAGE',
  ],
  AREA_MANAGER: [
    'STOCK_MOVEMENT_VIEW',
    'STOCK_MOVEMENT_APPROVE',
    'PR_VIEW',
    'PR_APPROVE',
    'PR_REJECT',
    'PO_VIEW',
    'PO_APPROVE',
    'INVENTORY_CHECK_VIEW',
    'INVENTORY_CHECK_APPROVE',
    'BATCH_VIEW',
    'REPORT_INVENTORY_VALUE',
    'REPORT_STOCK_MOVEMENT',
    'REPORT_EXPIRY',
    'REPORT_VARIANCE',
  ],
  SUPPLY_CHAIN: [
    'STOCK_MOVEMENT_VIEW',
    'PR_VIEW',
    'PR_APPROVE',
    'PO_VIEW',
    'PO_CREATE',
    'PO_EDIT',
    'PO_APPROVE',
    'PO_CANCEL',
    'BATCH_VIEW',
    'REPORT_INVENTORY_VALUE',
    'REPORT_STOCK_MOVEMENT',
    'REPORT_EXPIRY',
    'SUPPLIER_MANAGE',
  ],
  ADMIN: [
    // Admin has all permissions
    'STOCK_MOVEMENT_VIEW',
    'STOCK_MOVEMENT_CREATE',
    'STOCK_MOVEMENT_EDIT',
    'STOCK_MOVEMENT_DELETE',
    'STOCK_MOVEMENT_APPROVE',
    'STOCK_MOVEMENT_SUBMIT',
    'PR_VIEW',
    'PR_CREATE',
    'PR_EDIT',
    'PR_APPROVE',
    'PR_REJECT',
    'PO_VIEW',
    'PO_CREATE',
    'PO_EDIT',
    'PO_APPROVE',
    'PO_CANCEL',
    'INVENTORY_CHECK_VIEW',
    'INVENTORY_CHECK_CREATE',
    'INVENTORY_CHECK_PERFORM',
    'INVENTORY_CHECK_APPROVE',
    'INVENTORY_CHECK_POST',
    'BATCH_VIEW',
    'BATCH_CREATE',
    'BATCH_EDIT',
    'BATCH_QUARANTINE',
    'REPORT_INVENTORY_VALUE',
    'REPORT_STOCK_MOVEMENT',
    'REPORT_EXPIRY',
    'REPORT_VARIANCE',
    'WAREHOUSE_MANAGE',
    'SUPPLIER_MANAGE',
    'LOCATION_MANAGE',
  ],
};

// =====================================================
// J) API REQUEST/RESPONSE TYPES
// =====================================================

// Stock Movement Creation Request
export interface CreateStockMovementRequest {
  movementTypeId: number;
  warehouseId?: number;
  storeId?: number;
  referenceNumber?: string;
  poNumber?: string;
  notes?: string;
  items: {
    productId: number;
    sku: string;
    quantity: number;
    unitCost?: number;
    batchNumber?: string;
    expiryDate?: string;
    manufacturingDate?: string;
  }[];
}

// Purchase Request Creation
export interface CreatePurchaseRequestRequest {
  warehouseId?: number;
  storeId?: number;
  requiredDate: string;
  priority: PRPriority;
  justification?: string;
  items: {
    productId: number;
    requestedQuantity: number;
    estimatedUnitPrice?: number;
  }[];
}

// Inventory Check Creation
export interface CreateInventoryCheckRequest {
  checkTypeId: number;
  warehouseId?: number;
  storeId?: number;
  categoryId?: number;
  scheduledDate: string;
  assignedTo?: number;
  notes?: string;
}

// Inventory Check Item Update
export interface UpdateInventoryCheckItemRequest {
  countedQuantity: number;
  varianceReason?: VarianceReason;
  rootCause?: string;
  correctiveAction?: string;
  notes?: string;
}

// =====================================================
// K) FILTER & QUERY TYPES
// =====================================================

export interface StockMovementFilters {
  status?: MovementStatus[];
  movementType?: MovementTypeCode[];
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: number;
  storeId?: number;
  createdBy?: number;
  searchTerm?: string;
}

export interface InventoryCheckFilters {
  status?: InventoryCheckStatus[];
  checkType?: number;
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: number;
  assignedTo?: number;
}

export interface BatchFilters {
  productId?: number;
  status?: BatchStatus[];
  expiryDateFrom?: string;
  expiryDateTo?: string;
  warehouseId?: number;
}
