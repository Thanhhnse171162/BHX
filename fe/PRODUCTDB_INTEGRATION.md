# ProductDB Integration Guide

**Date**: March 3, 2026  
**Database**: ProductDB (MSSQL Server)  
**Purpose**: Product Catalog & Category Management

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Configuration](#database-configuration)
3. [File Structure](#file-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)

---

## 🎯 Overview

ProductDB integration cung cấp kết nối trực tiếp với SQL Server database chứa dữ liệu sản phẩm và danh mục. Hệ thống sử dụng **Repository Pattern** để tách biệt logic database khỏi API routes.

### Key Features

✅ **Separate Connection Pool** - ProductDB có connection pool riêng, độc lập với IdentityDB  
✅ **Type Safety** - Full TypeScript types cho tất cả entities  
✅ **CRUD Operations** - Complete Create, Read, Update, Delete cho Products & Categories  
✅ **Advanced Queries** - Pagination, filtering, sorting, search  
✅ **Error Handling** - Comprehensive error messages và validation  
✅ **RESTful APIs** - Standard HTTP methods (GET, POST, PUT, DELETE)

---

## ⚙️ Database Configuration

### 1. Environment Variables

Thêm cấu hình ProductDB vào file `.env.local`:

```env
# ProductDB - Catalog & Products
PRODUCT_DB_USER=sa
PRODUCT_DB_PASSWORD=12345
PRODUCT_DB_SERVER=localhost
PRODUCT_DB_NAME=ProductDB
PRODUCT_DB_ENCRYPT=false
PRODUCT_DB_TRUST_CERT=true
```

### 2. Connection Pool

File: `src/lib/db/product-db.ts`

```typescript
// Khởi tạo connection pool tự động
import { getProductDbConnection } from '@/lib/db/product-db'

const pool = await getProductDbConnection()
// ✅ Connected to ProductDB
```

**Features:**
- Auto-reconnect nếu connection lost
- Connection pooling (max: 10, min: 0)
- Idle timeout: 30 seconds
- Console logging cho debugging

---

## 📁 File Structure

```
src/
├── lib/db/
│   ├── config.ts                      # IdentityDB connection (existing)
│   ├── product-db.ts                  # ✨ ProductDB connection
│   └── product-repository.ts          # ✨ Repository functions
├── shared/types/
│   └── product-db.types.ts            # ✨ TypeScript types
└── app/api/
    ├── products/
    │   └── route.ts                   # ✨ Products API endpoint
    └── categories/
        └── route.ts                   # ✨ Categories API endpoint
```

### Files Created

| File | Purpose |
|------|---------|
| `product-db.ts` | ProductDB connection pool & query helpers |
| `product-repository.ts` | Database operations (CRUD) |
| `product-db.types.ts` | TypeScript interfaces & DTOs |
| `api/products/route.ts` | REST API for products |
| `api/categories/route.ts` | REST API for categories |

---

## 🗄️ Database Schema

### Table: `dbo.products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar(50) | Primary key (GUID) |
| `sku` | varchar(50) | Stock Keeping Unit (unique) |
| `barcode` | varchar(50) | Product barcode (unique) |
| `name` | nvarchar(255) | Product name |
| `description` | nvarchar(max) | Product description |
| `category_id` | varchar(50) | Foreign key to categories |
| `brand` | nvarchar(100) | Brand name |
| `origin` | nvarchar(100) | Country of origin |
| `price` | decimal(18,2) | Selling price |
| `original_price` | decimal(18,2) | Original/listed price |
| `cost_price` | decimal(18,2) | Cost price |
| `unit` | nvarchar(20) | Unit of measure (Kg, Hộp, etc.) |
| `weight` | decimal(10,2) | Weight in grams |
| `volume` | decimal(10,2) | Volume |
| `quantity_per_unit` | int | Quantity per unit |
| `min_order_quantity` | int | Minimum order quantity |
| `max_order_quantity` | int | Maximum order quantity |
| `expiration_date` | datetime | Expiration date |
| `shelf_life_days` | int | Shelf life in days |
| `storage_instructions` | nvarchar(500) | Storage instructions |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

### Table: `dbo.categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | varchar(50) | Primary key (GUID) |
| `name` | nvarchar(255) | Category name |
| `description` | nvarchar(max) | Category description |
| `parent_id` | varchar(50) | Parent category ID (nullable) |
| `image_url` | nvarchar(500) | Category image URL |
| `is_active` | bit | Active status |
| `display_order` | int | Display order |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## 🔌 API Endpoints

### Products API (`/api/products`)

#### GET - List Products

```bash
GET /api/products?page=1&limit=20
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `category_id` | string | Filter by category |
| `search` | string | Search in name, SKU, barcode |
| `min_price` | number | Minimum price |
| `max_price` | number | Maximum price |
| `brand` | string | Filter by brand |
| `origin` | string | Filter by origin |
| `sort_by` | string | Sort by field (name, price, created_at) |
| `sort_order` | string | asc or desc |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "20F335F9-1C0D-4AEB-87D9-14BD3AF006D6",
      "sku": "RAU-001",
      "barcode": "893456002341234",
      "name": "Rau Muống",
      "price": 15000,
      "brand": "Đà Lạt",
      "origin": "Việt Nam",
      ...
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

#### GET - Single Product

```bash
# By ID
GET /api/products?id=20F335F9-1C0D-4AEB-87D9-14BD3AF006D6

# By SKU
GET /api/products?sku=RAU-001

# By Barcode
GET /api/products?barcode=893456002341234
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "20F335F9-1C0D-4AEB-87D9-14BD3AF006D6",
    "sku": "RAU-001",
    "name": "Rau Muống",
    ...
  }
}
```

#### POST - Create Product

```bash
POST /api/products
Content-Type: application/json
```

**Request Body:**

```json
{
  "sku": "RAU-999",
  "barcode": "893456009999",
  "name": "Rau Cải Xanh",
  "description": "Rau tươi hữu cơ",
  "category_id": "F314BF7B-E68F-4219-9F24-C1683F3C6E63",
  "brand": "Đà Lạt",
  "origin": "Việt Nam",
  "price": 12000,
  "original_price": 15000,
  "cost_price": 8000,
  "unit": "Kg",
  "weight": 1000,
  "quantity_per_unit": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Product created successfully"
}
```

#### PUT - Update Product

```bash
PUT /api/products
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "20F335F9-1C0D-4AEB-87D9-14BD3AF006D6",
  "price": 18000,
  "original_price": 20000
}
```

#### DELETE - Delete Product

```bash
DELETE /api/products?id=20F335F9-1C0D-4AEB-87D9-14BD3AF006D6
```

---

### Categories API (`/api/categories`)

#### GET - List Categories

```bash
GET /api/categories
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "F314BF7B-E68F-4219-9F24-C1683F3C6E63",
      "name": "Bách Hóa Xanh",
      "is_active": true,
      "display_order": 1,
      ...
    }
  ],
  "total": 10
}
```

#### GET - Single Category

```bash
# By ID
GET /api/categories?id=F314BF7B-E68F-4219-9F24-C1683F3C6E63

# With products
GET /api/categories?id=F314BF7B-E68F-4219-9F24-C1683F3C6E63&include_products=true

# Child categories
GET /api/categories?parent_id=F314BF7B-E68F-4219-9F24-C1683F3C6E63
```

#### POST - Create Category

```bash
POST /api/categories
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Trái Cây Nhập Khẩu",
  "description": "Trái cây cao cấp từ nước ngoài",
  "parent_id": null,
  "is_active": true,
  "display_order": 5
}
```

#### PUT - Update Category

```bash
PUT /api/categories
```

#### DELETE - Delete Category

```bash
DELETE /api/categories?id=F314BF7B-E68F-4219-9F24-C1683F3C6E63
```

**Note:** Không thể xóa category nếu:
- Có products thuộc category này
- Có child categories

---

## 💻 Usage Examples

### In React Components

#### 1. Fetch Products

```typescript
'use client'
import { useEffect, useState } from 'react'
import { Product } from '@/shared/types/product-db.types'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products?page=1&limit=20')
        const data = await response.json()
        
        if (data.success) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Price: {product.price.toLocaleString('vi-VN')} đ</p>
          <p>Brand: {product.brand}</p>
        </div>
      ))}
    </div>
  )
}
```

#### 2. Create Product

```typescript
import { CreateProductDto } from '@/shared/types/product-db.types'

async function createProduct(data: CreateProductDto) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      console.log('Product created:', result.data)
      return result.data
    } else {
      console.error('Error:', result.error)
    }
  } catch (error) {
    console.error('Network error:', error)
  }
}
```

#### 3. Search Products

```typescript
async function searchProducts(searchTerm: string) {
  const response = await fetch(
    `/api/products?search=${encodeURIComponent(searchTerm)}&limit=10`
  )
  const data = await response.json()
  return data.data
}
```

### Direct Database Access (Server-Side)

```typescript
import { getAllProducts, getProductById } from '@/lib/db/product-repository'

// In a Server Component or API route
export default async function ServerComponent() {
  // Get products directly from database
  const result = await getAllProducts({ page: 1, limit: 10 })
  
  return (
    <div>
      <h1>Products ({result.total})</h1>
      {result.data.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

---

## 🧪 Testing

### Test Connection

Tạo file `scripts/test-productdb-connection.js`:

```javascript
const sql = require('mssql')

const config = {
  user: 'sa',
  password: '12345',
  server: 'localhost',
  database: 'ProductDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
}

async function testConnection() {
  try {
    const pool = await sql.connect(config)
    console.log('✅ Connected to ProductDB')

    // Test query
    const result = await pool.request().query('SELECT TOP 5 * FROM dbo.products')
    console.log('📦 Products:', result.recordset.length)
    console.table(result.recordset)

    await pool.close()
    console.log('🔌 Connection closed')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testConnection()
```

Chạy test:

```bash
node scripts/test-productdb-connection.js
```

### Test API Endpoints

#### Using cURL

```bash
# List products
curl http://localhost:3000/api/products

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "barcode": "999999999",
    "name": "Test Product",
    "category_id": "F314BF7B-E68F-4219-9F24-C1683F3C6E63",
    "brand": "Test Brand",
    "origin": "Vietnam",
    "price": 10000,
    "original_price": 12000,
    "unit": "Kg",
    "weight": 1000
  }'

# Search products
curl "http://localhost:3000/api/products?search=rau&limit=5"

# Get categories
curl http://localhost:3000/api/categories
```

#### Using Postman/Thunder Client

Import collection với các endpoints trên và test từng API.

---

## 🔐 Security Notes

1. **Environment Variables**: Không commit file `.env.local` lên Git
2. **SQL Injection**: Tất cả queries sử dụng parameterized queries (@param)
3. **Validation**: API endpoints validate input trước khi gọi database
4. **Error Messages**: Không expose database errors ra client (production)

---

## 📝 Troubleshooting

### Connection Issues

**Error**: "Failed to connect to ProductDB"

**Solution**:
1. Kiểm tra SQL Server đang chạy
2. Verify credentials trong `.env.local`
3. Check database name: `ProductDB`
4. Kiểm tra firewall/port 1433

### Query Errors

**Error**: "Invalid column name"

**Solution**: Kiểm tra tên cột trong database schema khớp với types

### Permission Errors

**Error**: "Login failed for user 'sa'"

**Solution**: Verify user có quyền truy cập ProductDB

---

## 🎓 Next Steps

1. **Add TanStack Query**: Integrate React Query cho caching
2. **Add Validation**: Sử dụng Zod schema validation
3. **Add Image Upload**: Thêm product image upload
4. **Add Inventory Integration**: Link với warehouse system
5. **Add Search Engine**: Implement full-text search

---

**Documentation Generated**: March 3, 2026  
**Last Updated**: March 3, 2026  
**Version**: 1.0.0
