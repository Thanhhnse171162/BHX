'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera } from 'lucide-react'

interface AvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  onImageChange?: (file: File) => void
  className?: string
}

const sizeClasses = {
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-3xl',
  xl: 'w-32 h-32 text-4xl',
}

export const Avatar = ({
  src,
  name = '',
  size = 'lg',
  editable = false,
  onImageChange,
  className = '',
}: AvatarProps) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File ảnh không được vượt quá 5MB')
        return
      }

      // Preview image
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageSrc(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Call callback
      if (onImageChange) {
        onImageChange(file)
      }
    }
  }

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          relative
          ${sizeClasses[size]}
          rounded-full overflow-hidden
          ${editable ? 'cursor-pointer' : ''}
          ${isHovered && editable ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
          transition-all
        `}
        onMouseEnter={() => editable && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name || 'Avatar'}
            fill
            sizes="(max-width: 768px) 128px, 128px"
            className="object-cover"
            unoptimized={
              imageSrc.startsWith('data:') ||
              imageSrc.startsWith('blob:') ||
              !/^https?:\/\//i.test(imageSrc)
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold">
            {getInitials(name)}
          </div>
        )}

        {/* Overlay on hover for editable avatar */}
        {editable && isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Edit button badge */}
      {editable && !isHovered && (
        <button
          onClick={handleClick}
          className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Change avatar"
        >
          <Camera className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
