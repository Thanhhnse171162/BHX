import { executeProductQuery } from './product-db'
import {
  Product,
  CreateProductDto,
  ProductListQuery,
  ProductListResponse,
  Category,
  CreateCategoryDto,
} from '@/shared/types/product-db.types'

/**
 * Product Repository
 * Contains all database operations for products
 */

// ========================================
// PRODUCT CRUD OPERATIONS
// ========================================

/**
 * Get all products with pagination and filters
 */
export async function getAllProducts(
  query: ProductListQuery = {}
): Promise<ProductListResponse> {
  const {
    page = 1,
    limit = 20,
    category_id,
    search,
    min_price,
    max_price,
    brand,
    origin,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query

  const offset = (page - 1) * limit

  // Build WHERE clause
  const conditions: string[] = []
  const params: Record<string, any> = {}

  if (category_id) {
    conditions.push('category_id = @category_id')
    params.category_id = category_id
  }

  if (search) {
    conditions.push('(name LIKE @search OR sku LIKE @search OR barcode LIKE @search)')
    params.search = `%${search}%`
  }

  if (min_price !== undefined) {
    conditions.push('price >= @min_price')
    params.min_price = min_price
  }

  if (max_price !== undefined) {
    conditions.push('price <= @max_price')
    params.max_price = max_price
  }

  if (brand) {
    conditions.push('brand = @brand')
    params.brand = brand
  }

  if (origin) {
    conditions.push('origin = @origin')
    params.origin = origin
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM dbo.products
    ${whereClause}
  `
  const countResult = await executeProductQuery<{ total: number }>(countQuery, params)
  const total = countResult[0]?.total || 0

  // Get paginated data
  const dataQuery = `
    SELECT *
    FROM dbo.products
    ${whereClause}
    ORDER BY ${sort_by} ${sort_order.toUpperCase()}
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `
  const products = await executeProductQuery<Product>(dataQuery, {
    ...params,
    offset,
    limit,
  })

  return {
    data: products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const query = `
    SELECT *
    FROM dbo.products
    WHERE id = @id
  `
  const result = await executeProductQuery<Product>(query, { id })
  return result[0] || null
}

/**
 * Get product by SKU
 */
export async function getProductBySku(sku: string): Promise<Product | null> {
  const query = `
    SELECT *
    FROM dbo.products
    WHERE sku = @sku
  `
  const result = await executeProductQuery<Product>(query, { sku })
  return result[0] || null
}

/**
 * Get product by Barcode
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const query = `
    SELECT *
    FROM dbo.products
    WHERE barcode = @barcode
  `
  const result = await executeProductQuery<Product>(query, { barcode })
  return result[0] || null
}

/**
 * Create new product
 */
export async function createProduct(data: CreateProductDto): Promise<Product> {
  const query = `
    INSERT INTO dbo.products (
      sku, barcode, name, description, category_id, brand, origin,
      price, original_price, cost_price, unit, weight, volume,
      quantity_per_unit, min_order_quantity, max_order_quantity,
      expiration_date, shelf_life_days, storage_instructions
    )
    OUTPUT INSERTED.*
    VALUES (
      @sku, @barcode, @name, @description, @category_id, @brand, @origin,
      @price, @original_price, @cost_price, @unit, @weight, @volume,
      @quantity_per_unit, @min_order_quantity, @max_order_quantity,
      @expiration_date, @shelf_life_days, @storage_instructions
    )
  `

  const result = await executeProductQuery<Product>(query, {
    sku: data.sku,
    barcode: data.barcode,
    name: data.name,
    description: data.description || null,
    category_id: data.category_id,
    brand: data.brand,
    origin: data.origin,
    price: data.price,
    original_price: data.original_price,
    cost_price: data.cost_price || null,
    unit: data.unit,
    weight: data.weight,
    volume: data.volume || null,
    quantity_per_unit: data.quantity_per_unit || 1,
    min_order_quantity: data.min_order_quantity || null,
    max_order_quantity: data.max_order_quantity || null,
    expiration_date: data.expiration_date || null,
    shelf_life_days: data.shelf_life_days || null,
    storage_instructions: data.storage_instructions || null,
  })

  return result[0]
}

/**
 * Update product
 */
export async function updateProduct(id: string, data: Partial<CreateProductDto>): Promise<Product | null> {
  // Build SET clause dynamically
  const setFields: string[] = []
  const params: Record<string, any> = { id }

  Object.entries(data).forEach(([key, value]) => {
    setFields.push(`${key} = @${key}`)
    params[key] = value
  })

  if (setFields.length === 0) {
    throw new Error('No fields to update')
  }

  const query = `
    UPDATE dbo.products
    SET ${setFields.join(', ')}, updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @id
  `

  const result = await executeProductQuery<Product>(query, params)
  return result[0] || null
}

/**
 * Delete product (soft delete - nếu có cột is_deleted)
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const query = `
    DELETE FROM dbo.products
    WHERE id = @id
  `
  await executeProductQuery(query, { id })
  return true
}

// ========================================
// CATEGORY CRUD OPERATIONS
// ========================================

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  const query = `
    SELECT *
    FROM dbo.categories
    WHERE is_deleted = 0
    ORDER BY name ASC
  `
  return await executeProductQuery<Category>(query)
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const query = `
    SELECT *
    FROM dbo.categories
    WHERE id = @id
  `
  const result = await executeProductQuery<Category>(query, { id })
  return result[0] || null
}

/**
 * Get child categories
 */
export async function getChildCategories(_parentId: string): Promise<Category[]> {
  // Note: Current schema doesn't have parent_id
  // Return empty array for now
  return []
}

/**
 * Create new category
 */
export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  const query = `
    INSERT INTO dbo.categories (
      name, status
    )
    OUTPUT INSERTED.*
    VALUES (
      @name, @status
    )
  `

  const result = await executeProductQuery<Category>(query, {
    name: data.name,
    status: data.status || 'active',
  })

  return result[0]
}

/**
 * Update category
 */
export async function updateCategory(id: string, data: Partial<CreateCategoryDto>): Promise<Category | null> {
  const setFields: string[] = []
  const params: Record<string, any> = { id }

  Object.entries(data).forEach(([key, value]) => {
    setFields.push(`${key} = @${key}`)
    params[key] = value
  })

  if (setFields.length === 0) {
    throw new Error('No fields to update')
  }

  const query = `
    UPDATE dbo.categories
    SET ${setFields.join(', ')}, updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @id
  `

  const result = await executeProductQuery<Category>(query, params)
  return result[0] || null
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  // Check if category has products
  const checkQuery = `
    SELECT COUNT(*) as count
    FROM dbo.products
    WHERE category_id = @id
  `
  const checkResult = await executeProductQuery<{ count: number }>(checkQuery, { id })
  
  if (checkResult[0]?.count > 0) {
    throw new Error('Cannot delete category with existing products')
  }

  // Delete category
  const query = `
    DELETE FROM dbo.categories
    WHERE id = @id
  `
  await executeProductQuery(query, { id })
  return true
}

/**
 * Get products by category
 */
export async function getProductsByCategory(categoryId: string, limit = 20): Promise<Product[]> {
  const query = `
    SELECT TOP (@limit) *
    FROM dbo.products
    WHERE category_id = @categoryId
    ORDER BY created_at DESC
  `
  return await executeProductQuery<Product>(query, { categoryId, limit })
}
