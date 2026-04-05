'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/shared/api/errors'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true)
    setError('')

    try {
      const response = await authService.forgotPassword(data.email)
      setSuccessMessage(response.message || 'Mã OTP đã được gửi đến email của bạn.')
      setSentEmail(data.email)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err) || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Yêu cầu đã được gửi</h1>
            <p className="text-gray-600 mb-6">
              {successMessage}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/reset-password?email=${encodeURIComponent(sentEmail)}`)}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
              >
                Nhập mã OTP
              </button>
              <Link href="/login">
                <Button fullWidth variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-lg font-bold mb-2">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            GR-SCMS
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
            <p className="text-gray-600 text-sm">
              Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              {...register('email')}
              error={errors.email?.message}
              className="focus:border-emerald-500 focus:ring-emerald-500"
            />

            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Bạn gặp khó khăn? Liên hệ hotline <span className="font-semibold text-emerald-600">1900 959999</span></p>
        </div>
      </div>
    </div>
  )
}
