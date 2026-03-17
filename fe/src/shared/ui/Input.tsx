'use client'

import React, { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors
            ${error ? 'border-red-500' : 'border-gray-300'}
            disabled:bg-gray-100 disabled:cursor-not-allowed
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:m-0
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:m-0
            [&[type=number]]:appearance-textfield
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-red-500 text-sm mt-1 block">{error}</span>}
        {helperText && !error && <span className="text-gray-500 text-sm mt-1 block">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
