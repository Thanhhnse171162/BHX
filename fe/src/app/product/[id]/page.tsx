import { notFound } from 'next/navigation'
import { Header } from '@/shared/ui/Header'
import { getProductById, getProductsByCategory } from '@/services/product.service'
import type { CategorySlug } from '@/shared/types/product.types'
import { ProductDetailClient } from './ProductDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const productId = parseInt(id)
  
  if (isNaN(productId)) {
    notFound()
  }

  // Fetch product data
  const product = await getProductById(productId)
  
  if (!product) {
    notFound()
  }

  // Fetch related products from same category
  const relatedProducts = await getProductsByCategory(product.categorySlug as CategorySlug)
  const filteredRelated = relatedProducts.filter(p => p.id !== product.id).slice(0, 8)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <ProductDetailClient product={product} relatedProducts={filteredRelated} />
    </div>
  )
}
