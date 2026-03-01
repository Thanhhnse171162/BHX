# ENTERPRISE WAREHOUSE MANAGEMENT SYSTEM (WMS)
## Complete Implementation Guide

**Document Version:** 1.0  
**Created:** March 2026  
**Target:** Multi-Store Retail Chain (FMCG Model - Bach Hoa Xanh Style)

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Business Logic & Workflows](#2-business-logic--workflows)
3. [Database Schema](#3-database-schema)
4. [API Structure](#4-api-structure)
5. [Permission Matrix](#5-permission-matrix)
6. [UI Structure](#6-ui-structure)
7. [Audit & Logging](#7-audit--logging)
8. [Inventory Valuation](#8-inventory-valuation)
9. [Batch & Expiry Management](#9-batch--expiry-management)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Risk Management & Edge Cases](#11-risk-management--edge-cases)

---

## 1. SYSTEM OVERVIEW

### 1.1 Current State vs Enterprise State

|  Feature | Current (Small Store) | Enterprise (Production) |
|---|---|---|
| **Stock Movement** | Simple In/Out tracking | Multi-type movements with approval workflow |
| **Approval** | None | Multi-level approval based on value/type |
| **Batch Tracking** | None | Full batch/lot/expiry tracking with FEFO |
| **Purchase Flow** | Manual | Low Stock → PR → PO → GRN → Stock In |
| **Inventory Check** | Basic count | Cycle count (Full/Category/Spot) with variance analysis |
| **Valuation** | None | FIFO/Moving Average with financial impact |
| **Audit Trail** | None | Complete audit log with before/after values |
| **Multi-Store** | Single warehouse | Multi-warehouse with inter-store transfers |
| **Permissions** | Basic role | Granular action-level permissions |

### 1.2 Key Enterprise Features

1. **Approval Workflow System**
   - Configurable approval thresholds
   - Multi-level approvals
   - Email/SMS notifications
   - Approval delegation

2. **Batch/Lot/Expiry Management**
   - Track every item by batch
   - FEFO (First Expired First Out) logic
   - Expiry alerts (7/30/60 days)
   - Quarantine management

3. **Purchase Request Flow**
   - Auto-generate from low stock
   - Suggested reorder quantity calculation
   - Supplier comparison
   - Lead time tracking

4. **Inventory Valuation**
   - real-time inventory value calculation
   - Shrinkage % tracking
   - Cost impact analysis
   - Financial reconciliation

5. **Cycle Count Program**
   - ABC classification
   - Scheduled counting
   - Variance root cause analysis
   - Automatic adjustment posting

---

## 2. BUSINESS LOGIC & WORKFLOWS

### 2.1 Stock Movement Workflow

```
┌─────────────┐
│   CREATED   │ ◄── Staff creates movement
└──────┬──────┘
       │ submit()
       ▼
┌──────────────────┐
│ PENDING_APPROVAL │ ◄── Awaits manager approval
└──────┬───────────┘
       │
       ├─── approve() ──► ┌──────────┐
       │                   │ APPROVED │ ─┬─► complete() ──► ┌───────────┐
       │                   └──────────┘  │                   │ COMPLETED │
       │                                  │                   └───────────┘
       │                                  └─► cancel() ──► ┌───────────┐
       │                                                     │ CANCELLED │
       │                                                     └───────────┘
       └─── reject() ──► ┌──────────┐
                         │ REJECTED  │
                         └──────────┘
```

**Business Rules:**

1. **Creation Phase (CREATED)**
   - Creator can edit/delete
   - Must have all required fields
   - Can attach invoice/photos
   - No inventory impact yet

2. **Pending Approval (PENDING_APPROVAL)**
   - Cannot be edited
   - Awaits designated approver
   - Approval based on:
     - Movement type
     - Value threshold
     - Quantity threshold
   - Creator cannot approve own movement

3. **Approved (APPROVED)**
   - Locked for editing
   - Ready for execution
   - Auto-trigger or manual complete
   
4. **Completed (COMPLETED)**
   - Inventory updated
   - Batch transactions created
   - Audit log recorded
   - Cannot reverse (must create new opposite movement)

5. **Rejected (REJECTED)**
   - Terminal state
   - Must provide rejection reason
   - Can create new movement based on rejected one

### 2.2 Purchase Request → Purchase Order Flow

```
   LOW STOCK ALERT
        │
        ▼
 ┌──────────────────┐
 │ Auto-Generate PR │
 │  or Manual Create│
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │ Calculate Reorder│
 │   Quantity       │ ◄── (Avg Daily Sales × Lead Time × Safety Factor)
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │  Submit PR for   │
 │   Approval       │
 └────────┬─────────┘
          │
    ┌────┴────┐
    │ Approve?│
    └────┬────┘
         │ Yes
         ▼
 ┌──────────────────┐
 │  Convert to PO   │
 │ Select Supplier  │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │   Confirm PO     │
 │ Send to Supplier │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │  Goods Receipt   │
 │ Create Stock In  │
 └────────┬─────────┘
          │
          ▼
 ┌──────────────────┐
 │ Inventory Updated│
 │  Batch Created   │
 └──────────────────┘
```

**Reorder Quantity Calculation:**

```typescript
function calculateReorderQuantity(
  currentStock: number,
  minStock: number,
  maxStock: number,
  avgDailySales: number,
  leadTimeDays: number,
  safetyFactor: number = 1.5
): number {
  // Lead time demand
  const leadTimeDemand = avgDailySales * leadTimeDays * safetyFactor
  
  // Suggested order quantity to reach max stock
  const suggestedQty = maxStock - currentStock + leadTimeDemand
  
  // Round up to MOQ (Minimum Order Quantity) if applicable
  const moq = 100 // Example: 100 units
  return Math.ceil(suggestedQty / moq) * moq
}
```

### 2.3 Inventory Check (Cycle Count) Workflow

```
┌─────────────┐
│  SCHEDULED  │ ◄── Create check schedule
└──────┬──────┘
       │ start()
       ▼
┌─────────────┐
│ IN_PROGRESS │ ◄── Generate items to count
└──────┬──────┘
       │
       │ (Staff counts each item)
       │
       ▼
┌─────────────┐
│  COMPLETED  │ ◄── All items counted
└──────┬──────┘
       │ approve()
       ▼
┌─────────────┐
│  APPROVED   │ ◄── Manager reviews variances
└──────┬──────┘
       │ post()
       ▼
┌─────────────┐
│   POSTED    │ ◄── Adjustment created & inventory updated
└─────────────┘
```

**Cycle Count Types:**

1. **Full Count**
   - All SKUs in warehouse
   - Frequency: Annual
   - Duration: 2-3 days
   - Requires warehouse lockdown

2. **Category Count**
   - All items in specific category (e.g., Dairy, Frozen)
   - Frequency: Quarterly
   - Duration: 4-8 hours
   - Can operate during business

3. **Spot Check**
   - Random sample (e.g., 50 SKUs)
   - Frequency: Weekly
   - Duration: 1-2 hours
   - Focus on high-risk items

4. **ABC Analysis Count**
   - **A Items** (High value - 20% of SKUs, 80% of value): Monthly
   - **B Items** (Medium value): Quarterly
   - **C Items** (Low value): Annually

**Variance Analysis:**

```typescript
interface VarianceAnalysis {
  systemQty: number;
  physicalQty: number;
  varianceQty: number;
  variancePercent: number;
  varianceValue: number;
  varianceReason: 'SHRINKAGE' | 'THEFT' | 'DAMAGED' | 'COUNT_ERROR' | 'SYSTEM_ERROR' | 'EXPIRED';
  rootCause: string;
  correctiveAction: string;
}

function calculateVarianceImpact(items: InventoryCheckItem[]): VarianceImpact {
  const totalVarianceValue = items.reduce((sum, item) => sum + (item.varianceValue || 0), 0);
  const totalSystemValue = items.reduce((sum, item) => sum + (item.systemValue || 0), 0);
  
  return {
    totalVarianceValue,
    shrinkagePercent: (totalVarianceValue / totalSystemValue) * 100,
    itemsWithVariance: items.filter(i => i.varianceQty !== 0).length,
    accuracyPercent: ((items.length - items.filter(i => i.varianceQty !== 0).length) / items.length) * 100
  };
}
```

### 2.4 Batch/Expiry Management Workflow

```
   GOODS RECEIPT
        │
        ▼
┌────────────────┐
│  Create Batch  │
│ - Batch Number │
│ - Mfg Date     │
│ - Expiry Date  │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│Quality Check   │ ◄── Optional QC
└───────┬────────┘
        │
   ┌────┴─────┐
   │ Pass QC? │
   └────┬─────┘
        │ Yes
        ▼
┌────────────────┐
│  Batch ACTIVE  │
│ Available for  │
│   Picking      │
└───────┬────────┘
        │
        ├──► (Daily) Check Expiry
        │
        ▼
   Days to Expire?
        │
        ├──► 30 days: Send alert
        ├──► 7 days: Critical alert
        ├──► 0 days: Auto-quarantine
        │
        ▼
┌────────────────┐
│ Batch EXPIRED  │
│or QUARANTINE   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Create Expired │
│Stock Movement  │
└────────────────┘
```

**FEFO (First Expired First Out) Logic:**

```sql
-- Get batches in FEFO order for a product
SELECT 
    batch_id,
    batch_number,
    expiry_date,
    available_quantity,
    DATEDIFF(day, GETDATE(), expiry_date) as days_to_expire
FROM batches
WHERE product_id = @productId
    AND status = 'ACTIVE'
    AND available_quantity > 0
    AND expiry_date >= GETDATE()
ORDER BY 
    expiry_date ASC,  -- FEFO: earliest expiry first
    received_date ASC; -- Tie-breaker: oldest batch first
```

```typescript
function allocateBatchesForSale(productId: number, requestedQty: number): BatchAllocation[] {
  const batches = getBatchesFEFO(productId);
  const allocations: BatchAllocation[] = [];
  let remainingQty = requestedQty;

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    const allocQty = Math.min(batch.availableQuantity, remainingQty);
    
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: allocQty,
      expiryDate: batch.expiryDate
    });

    remainingQty -= allocQty;
  }

  if (remainingQty > 0) {
    throw new Error(`Insufficient stock. Short by ${remainingQty} units`);
  }

  return allocations;
}
```

---

## 3. DATABASE SCHEMA

See [warehouse-schema.sql](../database/warehouse-schema.sql) for complete schema.

**Key Tables:**

1. **stock_movements** - Main transaction table
2. **stock_movement_items** - Line items with batch tracking
3. **batches** - Batch/lot master with expiry
4. **purchase_requests** - Reorder requests
5. **purchase_orders** - PO management
6. **inventory_checks** - Cycle count headers
7. **inventory_check_items** - Count details with variance
8. **audit_logs** - Complete audit trail

---

## 4. API STRUCTURE

See [warehouse-api-endpoints.ts](../docs/warehouse-api-endpoints.ts) for complete API documentation.

(API endpoints ở file docs/warehouse-api-endpoints.ts đã được tạo trước đó)

---

## 5. PERMISSION MATRIX

### 5.1 Role Definitions

| Role | Description | Scope |
|---|---|---|
| **WAREHOUSE_STAFF** | Front-line warehouse workers | Basic operations, no approval rights |
| **WAREHOUSE_SUPERVISOR** | Team lead/supervisor | Can approve small movements |
| **WAREHOUSE_MANAGER** | Warehouse manager | Full control of warehouse ops |
| **AREA_MANAGER** | Regional/area manager | Approve large movements across warehouses |
| **SUPPLY_CHAIN** | Supply chain team | PO management, supplier coordination |
| **ADMIN** | System administrator | All permissions |

### 5.2 Permission Matrix

| Permission | STAFF | SUPERVISOR | MANAGER | AREA MGR | SUPPLY CHAIN | ADMIN |
|---|---|---|---|---|---|---|
| **Stock Movement - View** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Stock Movement - Create** | ✓ | ✓ | ✓ | | | ✓ |
| **Stock Movement - Edit** | | ✓ | ✓ | | | ✓ |
| **Stock Movement - Approve <100K** | | ✓ | ✓ | ✓ | | ✓ |
| **Stock Movement - Approve >100K** | | | ✓ | ✓ | | ✓ |
| **Purchase Request - Create** | ✓ | ✓ | ✓ | | | ✓ |
| **Purchase Request - Approve** | | | ✓ | ✓ | ✓ | ✓ |
| **Purchase Order - Create** | | | ✓ | | ✓ | ✓ |
| **Purchase Order - Approve** | | | ✓ | ✓ | ✓ | ✓ |
| **Inventory Check - Perform** | ✓ | ✓ | ✓ | | | ✓ |
| **Inventory Check - Approve** | | ✓ | ✓ | | | ✓ |
| **Inventory Check - Post Adjustment** | | | ✓ | | | ✓ |
| **Batch - Quarantine/Release** | | ✓ | ✓ | | | ✓ |
| **Reports - Inventory Value** | | | ✓ | ✓ | ✓ | ✓ |
| **Reports - Variance Analysis** | | ✓ | ✓ | ✓ | | ✓ |
| **Master Data - Manage** | | | ✓ | | ✓ | ✓ |

### 5.3 Approval Thresholds

```typescript
interface ApprovalRule {
  movementType: MovementTypeCode;
  minValue?: number;
  maxValue?: number;
  requiredRole: WMSRole[];
  requiresMultipleApprovals: boolean;
}

const APPROVAL_RULES: ApprovalRule[] = [
  {
    movementType: 'PURCHASE',
    minValue: 0,
    maxValue: 100000000,  // 100M VND
    requiredRole: ['WAREHOUSE_SUPERVISOR', 'WAREHOUSE_MANAGER'],
    requiresMultipleApprovals: false
  },
  {
    movementType: 'PURCHASE',
    minValue: 100000000,
    maxValue: Infinity,
    requiredRole: ['WAREHOUSE_MANAGER', 'AREA_MANAGER'],
    requiresMultipleApprovals: true  // Requires both manager + area manager
  },
  {
    movementType: 'ADJUSTMENT',
    minValue: 0,
    maxValue: Infinity,
    requiredRole: ['WAREHOUSE_MANAGER'],
    requiresMultipleApprovals: false
  },
  {
    movementType: 'DAMAGE',
    minValue: 0,
    maxValue: 50000000,  // 50M VND
    requiredRole: ['WAREHOUSE_SUPERVISOR', 'WAREHOUSE_MANAGER'],
    requiresMultipleApprovals: false
  },
  {
    movementType: 'DAMAGE',
    minValue: 50000000,
    maxValue: Infinity,
    requiredRole: ['WAREHOUSE_MANAGER', 'AREA_MANAGER'],
    requiresMultipleApprovals: true
  },
];
```

---

## 6. UI STRUCTURE

### 6.1 Warehouse Staff Portal - Module Structure

```
/warehouse
├── page.tsx                    # Dashboard với enterprise metrics
├── layout.tsx                  # Warehouse layout với sidebar
├── stock-movement/
│   ├── page.tsx               # Movement list với filters
│   ├── [id]/                  # Movement detail
│   │   └── page.tsx           # View/Edit movement
│   └── create/
│       └── page.tsx           # Create new movement
├── purchase-requests/
│   ├── page.tsx               # PR list
│   ├── create/
│   │   └── page.tsx           # Create PR
│   └── [id]/
│       └── page.tsx           # PR detail với approval actions
├── inventory/
│   ├── page.tsx               # Inventory list với batch info
│   └── [productId]/
│       └── page.tsx           # Product stock detail với batches
├── batches/
│   ├── page.tsx               # Batch list với expiry alerts
│   ├── expiring-soon/
│   │   └── page.tsx           # Expiring items (30/60 days)
│   └── [id]/
│       └── page.tsx           # Batch detail với transactions
├── checks/
│   ├── page.tsx               # Cycle count list
│   ├── create/
│   │   └── page.tsx           # Schedule new count
│   └── [id]/
│       ├── page.tsx           # Count header
│       └── count/
│           └── page.tsx       # Perform counting (mobile-optimized)
├── low-stock/
│   └── page.tsx               # Low stock alerts với reorder suggestions
├── out-of-stock/
│   └── page.tsx               # Out of stock items
├── reports/
│   ├── variance/
│   │   └── page.tsx           # Variance analysis report
│   ├── expiry-risk/
│   │   └── page.tsx           # Expiry risk report
│   └── inventory-value/
│       └── page.tsx           # Inventory valuation report
└── profile/
    └── page.tsx               # User profile
```

### 6.2 Dashboard Metrics (Enterprise Level)

```typescript
interface DashboardMetrics {
  // Inventory Health
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  
  // Financial Metrics
  totalInventoryValue: number;        // Current stock value
  shrinkagePercent: number;            // Shrinkage %
  shrinkageValue: number;              // Loss in VND
  
  // Operational Efficiency
  stockTurnoverRate: number;           // Times per year
  avgDaysToSell: number;               // Average inventory days
  stockAccuracyPercent: number;        // From cycle counts
  
  // Expiry Risk (Critical for FMCG)
  itemsExpiringIn7Days: number;
  itemsExpiringIn30Days: number;
  expiryRiskValue: number;             // Value at risk
  
  // Out of Stock Impact
  outOfStockDurationDays: number;      // Avg OOS duration
  lostSalesEstimate: number;           // Estimated lost revenue
  
  // Workflow Metrics
  pendingApprovals: number;
  recentStockIns: number;
  recentStockOuts: number;
  
  // Quality Metrics
  activeBatches: number;
  expiredBatches: number;
  quarantinedBatches: number;
}
```

---

## 7. AUDIT & LOGGING

### 7.1 Audit Log Structure

All critical operations are logged in `audit_logs` table:

```typescript
interface AuditLog {
  id: number;
  tableName: string;               // Which table was affected
  recordId: number;                // Which record was affected
  action: AuditAction;              // INSERT, UPDATE, DELETE, APPROVE, etc.
  fieldName: string;                // Which field changed
  oldValue: string;                 // Before value (JSON)
  newValue: string;                 // After value (JSON)
  userId: number;                   // Who made the change
  userName: string;                 // User name (denormalized for history)
  userRole: string;                 // User role at time of action
  ipAddress: string;                // Client IP
  userAgent: string;                // Browser info
  operationContext: string;         // Business context
  createdAt: string;                // When
}
```

### 7.2 Tracked Operations

- **Stock Movements**: All status changes, quantity edits, approval/rejection
- **Purchase Requests**: Creation, modification, approval
- **Purchase Orders**: All PO lifecycle events
- **Inventory Checks**: Count creation, variance updates, posting
- **Batches**: Quarantine, release, status changes
- **Master Data**: Supplier, warehouse, product changes

### 7.3 Audit Query Examples

```sql
-- Get full audit trail for a stock movement
SELECT *
FROM audit_logs
WHERE table_name = 'stock_movements'
  AND record_id = 12345
ORDER BY created_at ASC;

-- Track all approvals by a specific user
SELECT *
FROM audit_logs
WHERE action = 'APPROVE'
  AND user_id = 123
  AND created_at >= '2026-01-01'
ORDER BY created_at DESC;

-- Find all inventory adjustments over 1M VND
SELECT al.*, sm.total_value
FROM audit_logs al
JOIN stock_movements sm ON al.record_id = sm.id
WHERE al.table_name = 'stock_movements'
  AND al.action = 'INSERT'
  AND sm.movement_type_id = (SELECT id FROM movement_types WHERE code = 'ADJUSTMENT')
  AND sm.total_value > 1000000;
```

### 7.4 Soft Delete Policy

All major entities support soft delete:

```sql
ALTER TABLE stock_movements ADD deleted BIT DEFAULT 0;
ALTER TABLE stock_movements ADD deleted_by INT;
ALTER TABLE stock_movements ADD deleted_at DATETIME2;
ALTER TABLE stock_movements ADD deletion_reason NVARCHAR(500);
```

Benefits:
- Data integrity preserved
- Audit trail intact
- Can recover accidentally deleted records
- Compliance with data retention policies

---

## 8. INVENTORY VALUATION

### 8.1 FIFO (First In First Out)

**Principle:** First items purchased are first items sold.

**Example:**

| Date | Transaction | Qty | Unit Cost | Total Cost |
|---|---|---|---|---|
| Jan 1 | Purchase | 100 | $10 | $1,000 |
| Jan 15 | Purchase | 150 | $12 | $1,800 |
| Feb 1 | Sale | (120) | | |

**FIFO Cost of Goods Sold:**
- 100 units @ $10 = $1,000
- 20 units @ $12 = $240
- **Total COGS = $1,240**

**Remaining Inventory:**
- 130 units @ $12 = $1,560

### 8.2 Moving Average Cost

**Principle:** Average cost recalculated after each purchase.

**Formula:**
```
New Avg Cost = (Current Total Value + New Purchase Value) / (Current Qty + New Qty)
```

**Example:**

| Date | Transaction | Qty | Cost | Total Value | Avg Cost |
|---|---|---|---|---|---|
| Jan 1 | Opening | 100 | $10 | $1,000 | $10.00 |
| Jan 15 | Purchase | 150 | $12 | $1,800 | |
| *After Purchase* | | 250 | | $2,800 | **$11.20** |
| Feb 1 | Sale | (120) | | ($1,344) | $11.20 |
| *After Sale* | | 130 | | $1,456 | $11.20 |

**SQL Implementation:**

```sql
CREATE PROCEDURE usp_UpdateMovingAvgCost
    @ProductId INT,
    @NewQty DECIMAL(18,3),
    @NewUnitCost DECIMAL(18,2)
AS
BEGIN
    DECLARE @CurrentQty DECIMAL(18,3);
    DECLARE @CurrentValue DECIMAL(18,2);
    DECLARE @NewTotalQty DECIMAL(18,3);
    DECLARE @NewTotalValue DECIMAL(18,2);
    DECLARE @NewAvgCost DECIMAL(18,2);

    -- Get current values
    SELECT 
        @CurrentQty = total_quantity,
        @CurrentValue = total_value
    FROM product_costing
    WHERE product_id = @ProductId;

    -- Calculate new values
    SET @NewTotalQty = @CurrentQty + @NewQty;
    SET @NewTotalValue = @CurrentValue + (@NewQty * @NewUnitCost);
    SET @NewAvgCost = CASE 
        WHEN @NewTotalQty > 0 THEN @NewTotalValue / @NewTotalQty 
        ELSE 0 
    END;

    -- Update
    UPDATE product_costing
    SET total_quantity = @NewTotalQty,
        total_value = @NewTotalValue,
        current_cost = @NewAvgCost,
        last_purchase_cost = @NewUnitCost,
        last_purchase_date = GETDATE(),
        updated_at = GETDATE()
    WHERE product_id = @ProductId;
END;
```

### 8.3 Dashboard Metrics Calculation

```typescript
async function calculateInventoryMetrics(): Promise<InventoryMetrics> {
  // Total Inventory Value
  const totalValue = await db.query(`
    SELECT SUM(total_value) as total_inventory_value
    FROM product_costing
  `);

  // Shrinkage % (from last 30 days)
  const shrinkage = await db.query(`
    SELECT 
      COUNT(*) as variance_count,
      SUM(variance_value) as total_variance_value,
      SUM(system_value) as total_system_value,
      (SUM(variance_value) / NULLIF(SUM(system_value), 0)) * 100 as shrinkage_percent
    FROM inventory_check_items ici
    JOIN inventory_checks ic ON ici.check_id = ic.id
    WHERE ic.status = 'POSTED'
      AND ic.posted_at >= DATEADD(day, -30, GETDATE())
      AND ici.variance_value < 0  -- Only negative variances (losses)
  `);

  // Stock Turnover (annual)
  const turnover = await db.query(`
    SELECT 
      SUM(ABS(smi.quantity * smi.unit_cost)) / 365 as avg_daily_cogs,
      SUM(pc.total_value) as avg_inventory_value
    FROM stock_movement_items smi
    JOIN stock_movements sm ON smi.movement_id = sm.id
    JOIN product_costing pc ON smi.product_id = pc.product_id
    WHERE sm.movement_type_id IN (SELECT id FROM movement_types WHERE code = 'SALE_DEDUCTION')
      AND sm.created_at >= DATEADD(year, -1, GETDATE())
  `);

  const stockTurnoverRate = (turnover.avg_daily_cogs * 365) / turnover.avg_inventory_value;
  const avgDaysToSell = 365 / stockTurnoverRate;

  return {
    totalInventoryValue: totalValue.total_inventory_value,
    shrinkagePercent: shrinkage.shrinkage_percent,
    shrinkageValue: Math.abs(shrinkage.total_variance_value),
    stockTurnoverRate,
    avgDaysToSell,
    stockAccuracyPercent: 100 - shrinkage.shrinkage_percent
  };
}
```

---

## 9. BATCH & EXPIRY MANAGEMENT

### 9.1 Batch Creation on Goods Receipt

```typescript
async function createBatchOnGoodsReceipt(
  movementItem: StockMovementItem
): Promise<Batch> {
  const batch = await db.insert('batches', {
    batch_number: generateBatchNumber(),  // e.g., BATCH-20260301-001
    product_id: movementItem.productId,
    sku: movementItem.sku,
    supplier_id: movement.supplierId,
    manufacturing_date: movementItem.manufacturingDate,
    expiry_date: movementItem.expiryDate,
    initial_quantity: movementItem.quantity,
    current_quantity: movementItem.quantity,
    reserved_quantity: 0,
    unit_cost: movementItem.unitCost,
    status: 'ACTIVE',
    quality_status: 'GOOD',
    warehouse_id: movement.warehouseId,
    bin_location: movementItem.toBinLocation
  });

  // Create batch transaction
  await db.insert('batch_transactions', {
    batch_id: batch.id,
    transaction_type: 'IN',
    quantity: movementItem.quantity,
    quantity_before: 0,
    quantity_after: movementItem.quantity,
    movement_id: movement.id,
    created_by: movement.createdBy
  });

  return batch;
}
```

### 9.2 FEFO Allocation on Sale

```typescript
async function allocateStockForSale(
  productId: number,
  requestedQty: number
): Promise<BatchAllocation[]> {
  // Get batches in FEFO order
  const batches = await db.query(`
    SELECT 
      id,
      batch_number,
      expiry_date,
      available_quantity,
      unit_cost,
      DATEDIFF(day, GETDATE(), expiry_date) as days_to_expire
    FROM batches
    WHERE product_id = @productId
      AND status = 'ACTIVE'
      AND available_quantity > 0
      AND expiry_date >= GETDATE()
    ORDER BY 
      expiry_date ASC,
      received_date ASC
  `, { productId });

  const allocations: BatchAllocation[] = [];
  let remainingQty = requestedQty;

  for (const batch of batches) {
    if (remainingQty <= 0) break;

    // Check if batch is expiring soon
    if (batch.days_to_expire <= 7) {
      // Priority deduction for near-expiry items
      console.warn(`Using near-expiry batch: ${batch.batch_number} (${batch.days_to_expire} days remaining)`);
    }

    const allocQty = Math.min(batch.available_quantity, remainingQty);

    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantity: allocQty,
      expiryDate: batch.expiryDate,
      unitCost: batch.unit_cost,
      lineTotal: allocQty * batch.unit_cost
    });

    // Reserve the quantity
    await db.execute(`
      UPDATE batches
      SET reserved_quantity = reserved_quantity + @allocQty
      WHERE id = @batchId
    `, { allocQty, batchId: batch.id });

    remainingQty -= allocQty;
  }

  if (remainingQty > 0) {
    throw new InsufficientStockError(`Cannot fulfill order. Short by ${remainingQty} units`);
  }

  return allocations;
}
```

### 9.3 Expiry Alert System

```typescript
// Daily cron job to check expiring items
async function checkExpiringBatches(): Promise<void> {
  const alerts = await db.query(`
    SELECT 
      b.id,
      b.batch_number,
      b.product_id,
      p.name as product_name,
      b.expiry_date,
      b.available_quantity,
      b.unit_cost,
      (b.available_quantity * b.unit_cost) as at_risk_value,
      DATEDIFF(day, GETDATE(), b.expiry_date) as days_to_expire,
      w.name as warehouse_name,
      wm.email as manager_email
    FROM batches b
    JOIN products p ON b.product_id = p.id
    JOIN warehouses w ON b.warehouse_id = w.id
    JOIN users wm ON w.manager_id = wm.id
    WHERE b.status = 'ACTIVE'
      AND b.available_quantity > 0
      AND b.expiry_date BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
    ORDER BY b.expiry_date ASC
  `);

  for (const alert of alerts) {
    const severity = 
      alert.days_to_expire <= 7 ? 'CRITICAL' :
      alert.days_to_expire <= 14 ? 'HIGH' :
      'MEDIUM';

    await sendExpiryAlert({
      to: alert.manager_email,
      severity,
      batchNumber: alert.batch_number,
      productName: alert.product_name,
      expiryDate: alert.expiry_date,
      daysToExpire: alert.days_to_expire,
      quantity: alert.available_quantity,
      atRiskValue: alert.at_risk_value,
      warehouse: alert.warehouse_name
    });

    // Auto-quarantine if expired
    if (alert.days_to_expire <= 0) {
      await db.execute(`
        UPDATE batches
        SET status = 'EXPIRED',
            updated_at = GETDATE()
        WHERE id = @batchId
      `, { batchId: alert.id });

      // Create expired stock movement
      await createExpiredStockMovement(alert);
    }
  }
}
```

---

## 10. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] Setup database schema
- [ ] Create core types & interfaces
- [ ] Setup API structure
- [ ] Create base UI components
- [ ] Implement authentication & authorization

### Phase 2: Stock Movement (Weeks 3-4)
- [ ] Implement stock movement CRUD
- [ ] Build approval workflow
- [ ] Create movement UI with filters
- [ ] Add attachment upload
- [ ] Test approval transitions

### Phase 3: Batch Management (Weeks 5-6)
- [ ] Implement batch creation
- [ ] Build FEFO allocation logic
- [ ] Create expiry alert system
- [ ] Build batch UI pages
- [ ] Test batch transactions

### Phase 4: Purchase Flow (Weeks 7-8)
- [ ] Implement PR functionality
- [ ] Build PO management
- [ ] Create reorder suggestion logic
- [ ] Integrate with stock movements
- [ ] Test end-to-end PR → PO → GRN flow

### Phase 5: Inventory Check (Weeks 9-10)
- [ ] Build cycle count functionality
- [ ] Create variance analysis
- [ ] Implement adjustment posting
- [ ] Build counting UI (mobile-optimized)
- [ ] Test accuracy metrics

### Phase 6: Reports & Analytics (Weeks 11-12)
- [ ] Implement inventory valuation
- [ ] Build dashboard metrics
- [ ] Create variance reports
- [ ] Build expiry risk reports
- [ ] Implement audit trail viewer

### Phase 7: Testing & Optimization (Weeks 13-14)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation

### Phase 8: Deployment (Week 15)
- [ ] Production deployment
- [ ] Data migration
- [ ] User training
- [ ] Go-live support
- [ ] Post-deployment monitoring

---

## 11. RISK MANAGEMENT & EDGE CASES

### 11.1 Concurrency Issues

**Problem:** Two users approve the same movement simultaneously.

**Solution:** Optimistic locking with version control

```typescript
interface StockMovement {
  // ... other fields
  version: number;  // Incremented on each update
}

async function approveMovement(id: number, expectedVersion: number) {
  const result = await db.execute(`
    UPDATE stock_movements
    SET status = 'APPROVED',
        approved_by = @userId,
        approved_at = GETDATE(),
        version = version + 1
    WHERE id = @id
      AND version = @expectedVersion
      AND status = 'PENDING_APPROVAL'
  `, { id, expectedVersion, userId });

  if (result.rowsAffected === 0) {
    throw new ConcurrentModificationError('Movement has been modified by another user');
  }
}
```

### 11.2 Negative Stock

**Problem:** Stock goes negative due to incorrect deduction.

**Solution:** Database constraint + application validation

```sql
-- Add constraint
ALTER TABLE batches
ADD CONSTRAINT CK_batch_quantity_non_negative
CHECK (current_quantity >= 0 AND available_quantity >= 0);

-- Add trigger to prevent negative stock
CREATE TRIGGER trg_prevent_negative_stock
ON batches
FOR UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted WHERE current_quantity < 0)
    BEGIN
        RAISERROR('Stock quantity cannot be negative', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
```

### 11.3 Batch Already Expired

**Problem:** User tries to use expired batch.

**Solution:** Validation on allocation

```typescript
function validateBatchForUse(batch: Batch): void {
  if (batch.status === 'EXPIRED') {
    throw new BatchExpiredError(`Batch ${batch.batch_number} has expired`);
  }

  if (batch.expiry_date && new Date(batch.expiry_date) < new Date()) {
    // Auto-expire
    updateBatchStatus(batch.id, 'EXPIRED');
    throw new BatchExpiredError(`Batch ${batch.batch_number} has expired`);
  }

  if (batch.status === 'QUARANTINE') {
    throw new BatchQuarantinedError(`Batch ${batch.batch_number} is in quarantine`);
  }
}
```

### 11.4 Approval Loop

**Problem:** User creates movement, submits for approval, but there's no approver available.

**Solution:** Approval delegation + escalation

```typescript
interface ApprovalRule {
  role: WMSRole;
  fallbackRole?: WMSRole;  // Escalate to this role if no approver
  escalationDays: number;   // Auto-escalate after X days
}

async function checkApprovalEscalation(): Promise<void> {
  const stuckApprovals = await db.query(`
    SELECT id, submitted_at, movement_type_id, total_value
    FROM stock_movements
    WHERE status = 'PENDING_APPROVAL'
      AND DATEDIFF(day, submitted_at, GETDATE()) > 3  -- Stuck for 3+ days
  `);

  for (const movement of stuckApprovals) {
    await escalateApproval(movement);
  }
}
```

### 11.5 Data Integrity During Posting

**Problem:** Inventory check adjustment fails mid-update, leaving partial data.

**Solution:** Database transaction with rollback

```typescript
async function postInventoryAdjustment(checkId: number): Promise<void> {
  const transaction = await db.beginTransaction();
  try {
    // 1. Create adjustment movement
    const movement = await createAdjustmentMovement(checkId, transaction);

    // 2. Update batch quantities
    await updateBatchQuantities(checkId, movement.id, transaction);

    // 3. Update product costing (moving average)
    await updateProductCosting(checkId, transaction);

    // 4. Mark check as posted
    await db.execute(`
      UPDATE inventory_checks
      SET status = 'POSTED',
          adjustment_posted = 1,
          adjustment_movement_id = @movementId,
          posted_at = GETDATE(),
          posted_by = @userId
      WHERE id = @checkId
    `, { checkId, movementId: movement.id, userId }, transaction);

    // 5. Create audit logs
    await createAuditLog({
      tableName: 'inventory_checks',
      recordId: checkId,
      action: 'POST',
      userId,
      context: 'Inventory adjustment posted'
    }, transaction);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw new PostingError(`Failed to post inventory adjustment: ${error.message}`);
  }
}
```

---

## 12. NEXT STEPS FOR IMPLEMENTATION

### 12.1 Immediate Actions

1. **Review & Update Database Schema**
   - Run `warehouse-schema.sql` on development database
   - Create necessary indexes
   - Set up triggers for data integrity

2. **Setup TypeScript Types**
   - Import types from `warehouse.types.ts`
   - Add to project's shared types
   - Configure TypeScript paths

3. **Create API Layer**
   - Implement endpoints from `warehouse-api-endpoints.ts`
   - Add request/response validation (Zod/Yup)
   - Setup error handling middleware

4. **Build UI Components**
   - Use provided page structure as reference
   - Implement reusable components (filters, tables, modals)
   - Add responsive design for mobile counting

5. **Implement Permissions**
   - Add permission middleware to API routes
   - Implement UI permission guards
   - Test permission matrix thoroughly

### 12.2 Testing Strategy

1. **Unit Tests**
   - Business logic functions (FEFO, moving average, etc.)
   - Approval workflow transitions
   - Validation rules

2. **Integration Tests**
   - API endpoint flows
   - Database transactions
   - Batch allocation logic

3. **End-to-End Tests**
   - Complete workflows (PR → PO → GRN)
   - Approval scenarios
   - Inventory check posting

4. **Performance Tests**
   - Large dataset operations
   - Concurrent user scenarios
   - Report generation speed

### 12.3 Production Readiness Checklist

- [ ] All database indexes created
- [ ] API rate limiting configured
- [ ] Error logging setup (Sentry/similar)
- [ ] Monitoring dashboards (Grafana/similar)
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] User training materials prepared
- [ ] Security audit completed
- [ ] Load testing passed
- [ ] Data migration script tested

---

## CONCLUSION

This enterprise WMS system is designed to handle:

✅ **Multi-store operations** with inter-warehouse transfers  
✅ **Full approval workflows** with configurable thresholds  
✅ **Batch/lot/expiry tracking** with FEFO logic  
✅ **Complete purchase flow** from reorder to goods receipt  
✅ **Comprehensive cycle counting** with variance analysis  
✅ **Inventory valuation** (FIFO/Moving Average)  
✅ **Granular permissions** with role-based access  
✅ **Complete audit trail** for compliance  
✅ **Real-time dashboards** with KPIs  

This is production-grade system architecture suitable for retail chains with hundreds of stores and thousands of SKUs.

---

**Document Version:** 1.0  
**Last Updated:** March 1, 2026  
**Prepared By:** Senior Enterprise Solution Architect  
**For:** FMCG Retail Chain Warehouse Management System
