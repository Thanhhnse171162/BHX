-- =====================================================
-- ENTERPRISE WAREHOUSE MANAGEMENT SYSTEM (WMS)
-- Database Schema for Multi-Store Retail Chain (FMCG)
-- Compatible with: SQL Server
-- Version: 1.0
-- Created: March 2026
-- =====================================================

-- =====================================================
-- A) STOCK MOVEMENT SYSTEM
-- =====================================================

-- Movement Types Enum
CREATE TABLE movement_types (
    id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    is_inbound BIT NOT NULL, -- TRUE for increase stock, FALSE for decrease
    requires_approval BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Insert Movement Types
INSERT INTO movement_types (code, name, description, is_inbound, requires_approval) VALUES
('PURCHASE', N'Purchase', N'Stock in from supplier purchase', 1, 1),
('TRANSFER_IN', N'Store Transfer In', N'Stock received from another store/warehouse', 1, 1),
('TRANSFER_OUT', N'Store Transfer Out', N'Stock sent to another store/warehouse', 0, 1),
('DAMAGE', N'Damage', N'Stock deduction due to damage', 0, 1),
('EXPIRED', N'Expired', N'Stock deduction due to expiry', 0, 1),
('ADJUSTMENT', N'Adjustment', N'Manual stock adjustment (reconciliation)', 0, 1), -- can be +/-
('RETURN_SUPPLIER', N'Return to Supplier', N'Return defective items to supplier', 0, 1),
('SALE_DEDUCTION', N'Sale Deduction', N'Stock deduction from POS sales', 0, 0), -- Auto, no approval needed
('PRODUCTION', N'Production', N'Stock created from production', 1, 1),
('SAMPLE', N'Sample', N'Stock used for sampling/testing', 0, 1);

-- Stock Movements (Main Transaction Table)
CREATE TABLE stock_movements (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    movement_number VARCHAR(50) UNIQUE NOT NULL, -- Format: SM-YYYYMMDD-XXXXX
    movement_type_id INT NOT NULL FOREIGN KEY REFERENCES movement_types(id),
    
    -- Location
    warehouse_id INT, -- Source/Destination warehouse
    store_id INT, -- Source/Destination store
    from_location_id INT, -- For transfers
    to_location_id INT, -- For transfers
    
    -- Reference Documents
    reference_type VARCHAR(50), -- PO, TRANSFER, ADJUSTMENT, INVOICE, etc.
    reference_number VARCHAR(100), -- External document number
    po_number VARCHAR(100), -- Purchase Order Number
    transfer_id BIGINT, -- Link to transfer request
    adjustment_id BIGINT, -- Link to adjustment
    invoice_number VARCHAR(100), -- Supplier invoice
    
    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED, CANCELLED
    
    -- Financial
    total_quantity DECIMAL(18,3) NOT NULL,
    total_value DECIMAL(18,2), -- Total cost/value of movement
    currency_code VARCHAR(10) DEFAULT 'VND',
    
    -- Metadata
    notes NVARCHAR(1000),
    remarks NVARCHAR(1000),
    created_by INT NOT NULL, -- User ID
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_by INT,
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Approval Workflow
    submitted_by INT, -- User who submitted for approval
    submitted_at DATETIME2,
    approved_by INT, -- User who approved
    approved_at DATETIME2,
    rejected_by INT,
    rejected_at DATETIME2,
    rejection_reason NVARCHAR(500),
    
    -- Audit
    completed_at DATETIME2,
    cancelled_at DATETIME2,
    cancellation_reason NVARCHAR(500),
    
    CONSTRAINT CK_movement_status CHECK (status IN ('CREATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'))
);

-- Stock Movement Items (Detail Lines)
CREATE TABLE stock_movement_items (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    movement_id BIGINT NOT NULL FOREIGN KEY REFERENCES stock_movements(id),
    
    -- Product Info
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name NVARCHAR(500),
    
    -- Batch/Lot Management
    batch_id BIGINT, -- Link to batch master
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    
    -- Quantity
    quantity DECIMAL(18,3) NOT NULL,
    unit_of_measure VARCHAR(50),
    
    -- Cost/Value (for FIFO/Moving Average)
    unit_cost DECIMAL(18,2),
    total_cost DECIMAL(18,2),
    
    -- Quality
    quality_status VARCHAR(50) DEFAULT 'GOOD', -- GOOD, DAMAGED, EXPIRED, QUARANTINE
    
    -- Location (Bin/Shelf)
    from_bin_location VARCHAR(50),
    to_bin_location VARCHAR(50),
    
    -- Expiry (For FMCG)
    expiry_date DATE,
    manufacturing_date DATE,
    
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_quality_status CHECK (quality_status IN ('GOOD', 'DAMAGED', 'EXPIRED', 'QUARANTINE'))
);

-- Stock Movement Attachments (Invoice, Proof Photos)
CREATE TABLE stock_movement_attachments (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    movement_id BIGINT NOT NULL FOREIGN KEY REFERENCES stock_movements(id),
    attachment_type VARCHAR(50) NOT NULL, -- INVOICE, PHOTO, DELIVERY_NOTE, SIGNATURE, etc.
    file_name NVARCHAR(500) NOT NULL,
    file_path NVARCHAR(1000) NOT NULL,
    file_size BIGINT, -- in bytes
    mime_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_attachment_type CHECK (attachment_type IN ('INVOICE', 'PHOTO', 'DELIVERY_NOTE', 'SIGNATURE', 'PACKING_LIST', 'QUALITY_CERT', 'OTHER'))
);

-- =====================================================
-- B) PURCHASE REQUEST & PURCHASE ORDER FLOW
-- =====================================================

-- Suppliers Master
CREATE TABLE suppliers (
    id INT PRIMARY KEY IDENTITY(1,1),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(500) NOT NULL,
    contact_person NVARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(255),
    address NVARCHAR(1000),
    tax_code VARCHAR(50),
    payment_terms NVARCHAR(200),
    lead_time_days INT, -- Average delivery time
    rating DECIMAL(3,2), -- 0.00 to 5.00
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_supplier_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED'))
);

-- Purchase Request (PR) - Reorder Request
CREATE TABLE purchase_requests (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    pr_number VARCHAR(50) UNIQUE NOT NULL, -- Format: PR-YYYYMMDD-XXXXX
    
    -- Requester
    requested_by INT NOT NULL, -- User ID
    warehouse_id INT,
    store_id INT,
    
    -- Request Details
    request_date DATE NOT NULL,
    required_date DATE NOT NULL, -- When stock is needed
    priority VARCHAR(50) DEFAULT 'NORMAL', -- URGENT, HIGH, NORMAL, LOW
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, REJECTED, CONVERTED_TO_PO, CANCELLED
    
    -- Approval
    approved_by INT,
    approved_at DATETIME2,
    rejected_by INT,
    rejected_at DATETIME2,
    rejection_reason NVARCHAR(500),
    
    -- Notes
    notes NVARCHAR(1000),
    justification NVARCHAR(1000), -- Why this purchase is needed
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_pr_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED_TO_PO', 'CANCELLED')),
    CONSTRAINT CK_pr_priority CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW'))
);

-- Purchase Request Items
CREATE TABLE purchase_request_items (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    pr_id BIGINT NOT NULL FOREIGN KEY REFERENCES purchase_requests(id),
    
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name NVARCHAR(500),
    
    -- Current Stock Info
    current_stock DECIMAL(18,3),
    min_stock_level DECIMAL(18,3),
    max_stock_level DECIMAL(18,3),
    
    -- Calculation
    avg_daily_sales DECIMAL(18,3), -- Average daily consumption
    lead_time_days INT, -- Supplier lead time
    suggested_quantity DECIMAL(18,3), -- Auto-calculated: avg_daily_sales * lead_time * safety_factor
    requested_quantity DECIMAL(18,3) NOT NULL,
    unit_of_measure VARCHAR(50),
    
    -- Estimated Cost
    estimated_unit_price DECIMAL(18,2),
    estimated_total DECIMAL(18,2),
    
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Purchase Orders (PO)
CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    po_number VARCHAR(50) UNIQUE NOT NULL, -- Format: PO-YYYYMMDD-XXXXX
    
    -- Supplier
    supplier_id INT NOT NULL FOREIGN KEY REFERENCES suppliers(id),
    
    -- Reference
    pr_id BIGINT, -- Link to Purchase Request
    
    -- Dates
    po_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Location
    delivery_warehouse_id INT,
    delivery_store_id INT,
    delivery_address NVARCHAR(1000),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, CONFIRMED, IN_TRANSIT, PARTIAL_RECEIVED, RECEIVED, CLOSED, CANCELLED
    
    -- Financial
    subtotal DECIMAL(18,2),
    tax_amount DECIMAL(18,2),
    shipping_cost DECIMAL(18,2),
    total_amount DECIMAL(18,2),
    currency_code VARCHAR(10) DEFAULT 'VND',
    
    -- Payment
    payment_terms NVARCHAR(200),
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID
    
    -- Approval
    created_by INT NOT NULL,
    approved_by INT,
    approved_at DATETIME2,
    
    notes NVARCHAR(1000),
    terms_and_conditions NVARCHAR(MAX),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_po_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'IN_TRANSIT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT CK_payment_status CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID'))
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    po_id BIGINT NOT NULL FOREIGN KEY REFERENCES purchase_orders(id),
    pr_item_id BIGINT, -- Link back to PR item
    
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name NVARCHAR(500),
    
    ordered_quantity DECIMAL(18,3) NOT NULL,
    received_quantity DECIMAL(18,3) DEFAULT 0,
    unit_of_measure VARCHAR(50),
    
    unit_price DECIMAL(18,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 10, -- VAT 10%
    line_total DECIMAL(18,2),
    
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- =====================================================
-- C) BATCH/LOT/EXPIRY MANAGEMENT (FMCG)
-- =====================================================

-- Batch Master (For tracking batches/lots)
CREATE TABLE batches (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    lot_number VARCHAR(100),
    
    -- Product
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    
    -- Supplier
    supplier_id INT,
    
    -- Dates
    manufacturing_date DATE,
    expiry_date DATE,
    received_date DATE,
    
    -- Quantity Tracking
    initial_quantity DECIMAL(18,3) NOT NULL,
    current_quantity DECIMAL(18,3) NOT NULL,
    reserved_quantity DECIMAL(18,3) DEFAULT 0,
    available_quantity AS (current_quantity - reserved_quantity) PERSISTED,
    
    -- Cost (for FIFO)
    unit_cost DECIMAL(18,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, DEPLETED, QUARANTINE, RECALLED
    
    -- Quality
    quality_status VARCHAR(50) DEFAULT 'GOOD',
    quality_checked_by INT,
    quality_checked_at DATETIME2,
    quality_notes NVARCHAR(500),
    
    -- Location
    warehouse_id INT,
    bin_location VARCHAR(50),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_batch_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'DEPLETED', 'QUARANTINE', 'RECALLED')),
    CONSTRAINT CK_batch_quality CHECK (quality_status IN ('GOOD', 'DAMAGED', 'EXPIRED', 'QUARANTINE'))
);

-- Batch Transactions (Track all batch movements)
CREATE TABLE batch_transactions (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    batch_id BIGINT NOT NULL FOREIGN KEY REFERENCES batches(id),
    
    transaction_type VARCHAR(50) NOT NULL, -- IN, OUT, ADJUSTMENT, RESERVE, RELEASE
    transaction_ref VARCHAR(100), -- Reference to source transaction
    
    quantity DECIMAL(18,3) NOT NULL,
    quantity_before DECIMAL(18,3),
    quantity_after DECIMAL(18,3),
    
    movement_id BIGINT, -- Link to stock movement
    
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_batch_txn_type CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT', 'RESERVE', 'RELEASE'))
);

-- Expiry Alerts Configuration
CREATE TABLE expiry_alert_config (
    id INT PRIMARY KEY IDENTITY(1,1),
    product_category_id INT,
    alert_days_before INT NOT NULL, -- Alert X days before expiry
    critical_days_before INT NOT NULL, -- Critical alert
    notification_emails NVARCHAR(1000), -- Comma-separated emails
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE()
);

-- =====================================================
-- D) INVENTORY CHECK (CYCLE COUNT) - ENTERPRISE VERSION
-- =====================================================

-- Inventory Check Types
CREATE TABLE inventory_check_types (
    id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    frequency_days INT, -- How often this type should be done
    created_at DATETIME2 DEFAULT GETDATE()
);

INSERT INTO inventory_check_types (code, name, description, frequency_days) VALUES
('FULL_COUNT', N'Full Inventory Count', N'Complete physical count of all items', 365),
('CATEGORY_COUNT', N'Category Count', N'Count all items in specific category', 90),
('SPOT_CHECK', N'Spot Check', N'Random sampling of items', 30),
('ABC_A', N'ABC Analysis - A Items', N'High-value items (top 20%)', 30),
('ABC_B', N'ABC Analysis - B Items', N'Medium-value items', 60),
('ABC_C', N'ABC Analysis - C Items', N'Low-value items', 180);

-- Inventory Checks (Cycle Counts)
CREATE TABLE inventory_checks (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    check_number VARCHAR(50) UNIQUE NOT NULL, -- Format: IC-YYYYMMDD-XXXXX
    
    -- Type & Scope
    check_type_id INT NOT NULL FOREIGN KEY REFERENCES inventory_check_types(id),
    
    -- Location
    warehouse_id INT,
    store_id INT,
    
    -- Category Filter (for category count)
    category_id INT,
    
    -- Schedule
    scheduled_date DATE,
    started_at DATETIME2,
    completed_at DATETIME2,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, APPROVED, POSTED, CANCELLED
    
    -- Assigned Staff
    assigned_to INT, -- User ID of counter
    verified_by INT, -- User ID of verifier (2-person rule)
    
    -- Summary Metrics
    total_items_to_count INT,
    total_items_counted INT,
    items_with_variance INT,
    
    -- Variance Summary
    total_variance_qty DECIMAL(18,3),
    total_variance_value DECIMAL(18,2),
    variance_percent AS (CASE WHEN total_items_to_count > 0 THEN (CAST(items_with_variance AS DECIMAL) / total_items_to_count * 100) ELSE 0 END) PERSISTED,
    
    -- Approval
    approved_by INT,
    approved_at DATETIME2,
    
    -- Adjustment Posting
    adjustment_posted BIT DEFAULT 0,
    adjustment_movement_id BIGINT, -- Link to stock movement
    posted_at DATETIME2,
    posted_by INT,
    
    notes NVARCHAR(1000),
    created_by INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_check_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'POSTED', 'CANCELLED'))
);

-- Inventory Check Items (Individual Count Records)
CREATE TABLE inventory_check_items (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    check_id BIGINT NOT NULL FOREIGN KEY REFERENCES inventory_checks(id),
    
    -- Product
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    product_name NVARCHAR(500),
    
    -- Batch (if applicable)
    batch_id BIGINT,
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Location
    bin_location VARCHAR(50),
    
    -- Quantities
    system_quantity DECIMAL(18,3) NOT NULL, -- From system
    counted_quantity DECIMAL(18,3), -- Physically counted
    variance_quantity AS (counted_quantity - system_quantity) PERSISTED,
    
    -- Values (for financial impact)
    unit_cost DECIMAL(18,2),
    system_value AS (system_quantity * unit_cost) PERSISTED,
    counted_value AS (counted_quantity * unit_cost) PERSISTED,
    variance_value AS ((counted_quantity - system_quantity) * unit_cost) PERSISTED,
    
    -- Root Cause Analysis
    variance_reason VARCHAR(50), -- SHRINKAGE, THEFT, DAMAGED, COUNT_ERROR, SYSTEM_ERROR, EXPIRED, OTHER
    root_cause NVARCHAR(500),
    corrective_action NVARCHAR(500),
    
    -- Count Details
    counted_by INT, -- User who counted
    counted_at DATETIME2,
    verified_by INT, -- Second person verification
    verified_at DATETIME2,
    
    -- Photos
    has_photo BIT DEFAULT 0,
    
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_variance_reason CHECK (variance_reason IN ('SHRINKAGE', 'THEFT', 'DAMAGED', 'COUNT_ERROR', 'SYSTEM_ERROR', 'EXPIRED', 'RECEIVING_ERROR', 'OTHER'))
);

-- Inventory Check Photos
CREATE TABLE inventory_check_photos (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    check_item_id BIGINT NOT NULL FOREIGN KEY REFERENCES inventory_check_items(id),
    file_name NVARCHAR(500),
    file_path NVARCHAR(1000),
    uploaded_by INT,
    uploaded_at DATETIME2 DEFAULT GETDATE()
);

-- =====================================================
-- E) INVENTORY VALUATION
-- =====================================================

-- Inventory Valuation Methods
CREATE TABLE valuation_methods (
    id INT PRIMARY KEY IDENTITY(1,1),
    code VARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    is_active BIT DEFAULT 1
);

INSERT INTO valuation_methods (code, name, description) VALUES
('FIFO', 'First In First Out', 'First items received are first to be sold'),
('MOVING_AVG', 'Moving Average', 'Weighted average cost recalculated on each receipt'),
('STANDARD', 'Standard Costing', 'Fixed standard cost'),
('LIFO', 'Last In First Out', 'Last items received are first to be sold (rare in FMCG)');

-- Product Costing (Track cost per product)
CREATE TABLE product_costing (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    product_id INT NOT NULL,
    sku VARCHAR(100) NOT NULL,
    
    valuation_method_id INT NOT NULL FOREIGN KEY REFERENCES valuation_methods(id),
    
    -- Current Cost
    current_cost DECIMAL(18,2),
    standard_cost DECIMAL(18,2),
    
    -- Moving Average Tracking
    total_quantity DECIMAL(18,3),
    total_value DECIMAL(18,2),
    moving_avg_cost AS (CASE WHEN total_quantity > 0 THEN total_value / total_quantity ELSE 0 END) PERSISTED,
    
    last_purchase_cost DECIMAL(18,2),
    last_purchase_date DATE,
    
    -- History
    cost_history_json NVARCHAR(MAX), -- JSON array of historical costs
    
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT UQ_product_costing UNIQUE (product_id)
);

-- Inventory Valuation Snapshot (Daily/Monthly)
CREATE TABLE inventory_valuation_snapshots (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    snapshot_date DATE NOT NULL,
    warehouse_id INT,
    
    -- Summary Metrics
    total_sku_count INT,
    total_quantity DECIMAL(18,3),
    total_value DECIMAL(18,2),
    
    -- Category Breakdown
    category_breakdown NVARCHAR(MAX), -- JSON
    
    created_by INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT UQ_snapshot UNIQUE (snapshot_date, warehouse_id)
);

-- =====================================================
-- F) WAREHOUSE & LOCATION MASTER DATA
-- =====================================================

-- Warehouses
CREATE TABLE warehouses (
    id INT PRIMARY KEY IDENTITY(1,1),
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(200) NOT NULL,
    type VARCHAR(50), -- MAIN, BRANCH, COLD_STORAGE, TRANSIT
    
    address NVARCHAR(1000),
    city NVARCHAR(100),
    district NVARCHAR(100),
    postal_code VARCHAR(20),
    
    manager_id INT, -- User ID
    phone VARCHAR(50),
    email VARCHAR(255),
    
    capacity_sqm DECIMAL(18,2), -- Storage capacity in square meters
    
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_warehouse_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED'))
);

-- Storage Locations (Zones/Aisles/Racks/Bins)
CREATE TABLE storage_locations (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    warehouse_id INT NOT NULL FOREIGN KEY REFERENCES warehouses(id),
    
    location_code VARCHAR(50) NOT NULL,
    location_type VARCHAR(50), -- ZONE, AISLE, RACK, SHELF, BIN
    
    parent_location_id BIGINT, -- For hierarchy
    
    -- Climate Control (for FMCG)
    temperature_controlled BIT DEFAULT 0,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    
    capacity_weight DECIMAL(18,2), -- kg
    capacity_volume DECIMAL(18,2), -- cubic meters
    
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT UQ_location UNIQUE (warehouse_id, location_code),
    CONSTRAINT CK_location_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DAMAGED', 'MAINTENANCE'))
);

-- =====================================================
-- G) AUDIT & LOGGING
-- =====================================================

-- Audit Log (Central tracking for all changes)
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    
    -- Entity Tracking
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    
    -- Action
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, APPROVE, REJECT, CANCEL
    
    -- Changes
    field_name VARCHAR(100),
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    
    -- User & Session
    user_id INT NOT NULL,
    user_name NVARCHAR(200),
    user_role VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent NVARCHAR(500),
    
    -- Context
    operation_context NVARCHAR(500), -- What operation triggered this
    
    -- Timestamp
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT CK_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'SUBMIT', 'COMPLETE'))
);

-- Soft Delete Policy (for data integrity)
-- Add to all major tables:
-- deleted BIT DEFAULT 0
-- deleted_by INT
-- deleted_at DATETIME2
-- deletion_reason NVARCHAR(500)

-- =====================================================
-- H) INDEXES FOR PERFORMANCE
-- =====================================================

-- Stock Movements
CREATE INDEX IX_stock_movements_number ON stock_movements(movement_number);
CREATE INDEX IX_stock_movements_status ON stock_movements(status);
CREATE INDEX IX_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IX_stock_movements_type ON stock_movements(movement_type_id);

-- Batches
CREATE INDEX IX_batches_product ON batches(product_id);
CREATE INDEX IX_batches_expiry ON batches(expiry_date);
CREATE INDEX IX_batches_status ON batches(status);

-- Inventory Checks
CREATE INDEX IX_checks_status ON inventory_checks(status);
CREATE INDEX IX_checks_date ON inventory_checks(scheduled_date);

-- Audit Logs
CREATE INDEX IX_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX IX_audit_user ON audit_logs(user_id);
CREATE INDEX IX_audit_date ON audit_logs(created_at);

-- =====================================================
-- SAMPLE DATA QUERIES
-- =====================================================

-- Get expiring items in next 30 days
/*
SELECT 
    b.batch_number,
    p.name,
    b.expiry_date,
    DATEDIFF(day, GETDATE(), b.expiry_date) as days_to_expire,
    b.current_quantity
FROM batches b
JOIN products p ON b.product_id = p.id
WHERE b.expiry_date BETWEEN GETDATE() AND DATEADD(day, 30, GETDATE())
    AND b.status = 'ACTIVE'
    AND b.current_quantity > 0
ORDER BY b.expiry_date ASC;
*/

-- Get low stock items needing reorder
/*
SELECT 
    p.name,
    p.sku,
    i.quantity as current_stock,
    p.min_stock_level,
    p.max_stock_level,
    (p.max_stock_level - i.quantity) as suggested_reorder_qty
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity <= p.min_stock_level
    AND p.status = 'ACTIVE'
ORDER BY (p.min_stock_level - i.quantity) DESC;
*/
