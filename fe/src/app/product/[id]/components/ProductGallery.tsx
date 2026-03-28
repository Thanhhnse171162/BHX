'use client'

import { useState, memo } from 'react'

interface Props {
  images: string[]
  productName: string
}

export const ProductGallery = memo(function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      aria-label={productName ? `Ảnh sản phẩm: ${productName}` : 'Ảnh sản phẩm'}
    >
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
        <div className="text-9xl">{images[activeIndex]}</div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`aspect-square bg-gray-50 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center hover:border-green-500 ${
              activeIndex === idx ? 'border-green-600 ring-2 ring-green-200' : 'border-gray-200'
            }`}
          >
            <div className="text-4xl">{img}</div>
          </button>
        ))}
      </div>

      {/* Image Counter */}
      <div className="text-center mt-4 text-sm text-gray-500">
        {activeIndex + 1} / {images.length}
      </div>
    </div>
  )
})
