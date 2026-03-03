/**
 * ProductDB Types - Generated from SQL Server ProductDB schema
 * Database: ProductDB
 * Date: March 3, 2026
 */

// ========================================
// Product Entity (dbo.products table)
// ========================================

export interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  category_id: string
  brand: string | null
  origin: string | null
  price: number
  original_price: number | null
  cost_price: number | null
  unit: string
  weight: number | null
  volume: number | null
  quantity_per_unit: number | null
  min_order_quantity: number | null
  max_order_quantity: number | null
  expiration_date: Date | null
  shelf_life_days: number | null
  storage_instructions: string | null
  is_perishable: boolean | null
  image_url: string | null
  images: string | null
  is_available: boolean
  is_featured: boolean | null
  is_new: boolean | null
  is_on_sale: boolean | null
  is_deleted: boolean
  slug: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  created_at: Date
  updated_at: Date | null
  created_by: string | null
  updated_by: string | null
}

// ========================================
// Category Entity (dbo.categories table)
// ========================================

export interface Category {
  id: string
  name: string
  status: string
  is_deleted: boolean
  created_at: Date
  updated_at: Date | null
}

// ========================================
// DTOs for API
// ========================================

export interface CreateProductDto {
  sku: string
  barcode: string
  name: string
  description?: string
  category_id: string
  brand: string
  origin: string
  price: number
  original_price: number
  cost_price?: number
  unit: string
  weight: number
  volume?: number
  quantity_per_unit?: number
  min_order_quantity?: number
  max_order_quantity?: number
  expiration_date?: Date
  shelf_life_days?: number
  storage_instructions?: string
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string
}

export interface ProductListQuery {
  page?: number
  limit?: number
  category_id?: string
  search?: string
  min_price?: number
  max_price?: number
  brand?: string
  origin?: string
  sort_by?: 'name' | 'price' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface ProductListResponse {
  data: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ========================================
// Category DTOs
// ========================================

export interface CreateCategoryDto {
  name: string
  status?: string
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string
}
