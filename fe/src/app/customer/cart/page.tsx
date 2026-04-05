'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { Header } from '@/shared/ui/Header'
import { Button } from '@/shared/ui/Button'

// Suggested products for "You may also like" section
const SUGGESTED_PRODUCTS = [
  { 
    id: '101', 
    name: 'Rau xà lách tươi', 
    price: 18000, 
    image: '🥗',
    unit: 'kg',
    category: 'Rau củ'
  },
  { 
    id: '102', 
    name: 'Chuối sứ', 
    price: 25000, 
    image: '🍌',
    unit: 'kg',
    category: 'Trái cây'
  },
  { 
    id: '103', 
    name: 'Cà rót', 
    price: 22000, 
    image: '🥕',
    unit: 'kg',
    category: 'Rau củ'
  },
]

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getSavings, clearCart } = useCartStore()
  const [selectedItems, setSelectedItems] = useState<string[]>(items.map(item => item.id))
  const [shippingFee] = useState(15000)
  const [voucher] = useState(20000)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(item => item.id))
    }
  }

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const finalTotal = selectedTotal + shippingFee - voucher

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn sản phẩm để thanh toán')
      return
    }
    // Navigate to checkout page
    router.push('/customer/checkout')
  }

  const handleAddSuggestedProduct = (product: typeof SUGGESTED_PRODUCTS[0]) => {
    const { addItem } = useCartStore.getState()
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      unit: product.unit,
      category: product.category,
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-32 h-32 mx-auto mb-6 text-8xl">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-6">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
            <Link href="/customer">
              <Button className="px-8 py-3">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/customer" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cửa hàng
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
          >
            Đang mở
          </button>
        </div>

        {/* Store Info */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              BH
            </div>
            <div>
              <h3 className="font-bold text-white">GR-SCMS Quận 1</h3>
              <p className="text-sm text-gray-400">127 Nguyễn Huệ, Q1, TP HCM</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All */}
            <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.length === items.length}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
              />
              <span className="text-white font-medium">Chọn tất cả ({items.length})</span>
            </div>

            {/* Cart Items List */}
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800 rounded-xl p-4 transition-all hover:bg-gray-750"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800 mt-2"
                  />

                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-5xl">
                    {item.image}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                        {item.badge && (
                          <span className="inline-block px-2 py-0.5 bg-orange-500 text-white text-xs rounded font-medium">
                            {item.badge}
                          </span>
                        )}
                        {item.category && (
                          <p className="text-gray-400 text-sm mt-1">{item.category}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Xóa sản phẩm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-2 bg-gray-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center text-white hover:bg-gray-600 rounded-l-lg transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center text-white font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center text-white hover:bg-gray-600 rounded-r-lg transition-colors bg-green-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.originalPrice && (
                          <div className="text-gray-500 text-sm line-through">
                            {formatPrice(item.originalPrice)}
                          </div>
                        )}
                        <div className="text-green-400 font-bold text-lg">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-24 space-y-4">
              <h3 className="text-white font-bold text-lg mb-4">Tổng thanh toán</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Tổng tạm tính</span>
                  <span className="font-medium">{formatPrice(selectedTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium">{formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Giảm giá voucher</span>
                  <span className="font-medium">-{formatPrice(voucher)}</span>
                </div>
                {getSavings() > 0 && (
                  <div className="flex justify-between text-orange-400">
                    <span>Tiết kiệm</span>
                    <span className="font-medium">-{formatPrice(getSavings())}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white font-semibold">Tổng cộng</span>
                  <span className="text-green-400 font-bold text-2xl">{formatPrice(finalTotal)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Thanh toán</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Products */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Có thể bạn cũng thích</h2>
            <Link href="/customer" className="text-green-400 hover:text-green-300 text-sm font-medium">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUGGESTED_PRODUCTS.map((product) => (
              <div key={product.id} className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-xl p-6 flex flex-col items-center text-center group hover:scale-105 transition-transform">
                <div className="text-6xl mb-3">{product.image}</div>
                <h4 className="text-white font-semibold mb-2">{product.name}</h4>
                <div className="text-green-400 font-bold text-lg mb-3">{formatPrice(product.price)}</div>
                <button
                  onClick={() => handleAddSuggestedProduct(product)}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Thêm
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
