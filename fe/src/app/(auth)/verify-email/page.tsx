'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/shared/api/errors'
const verifyEmailSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  otp: z.string().min(6, 'Vui lòng nhập mã OTP 6 số').max(6, 'Mã OTP phải có 6 số'),
})

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
  })

  const email = watch('email')

  useEffect(() => {
    // Get email from URL query params if available
    const emailFromUrl = searchParams.get('email')
    if (emailFromUrl) {
      setValue('email', emailFromUrl)
    }
  }, [searchParams, setValue])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [resendCooldown])

  const onSubmit = async (data: VerifyEmailForm) => {
    setLoading(true)
    setError('')
    setResendMessage('')

    try {
      const response = await authService.verifyEmail(data.email, data.otp)
      setSuccessMessage(response.message || 'Xác thực email thành công!')
      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      setError(getErrorMessage(err) || 'Không thể xác thực email. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0) return

    setResendLoading(true)
    setError('')
    setResendMessage('')

    try {
      const response = await authService.resendEmailOtp(email)
      setResendMessage(response.message || 'Mã OTP mới đã được gửi đến email của bạn.')
      setResendCooldown(60) // 60 seconds cooldown
    } catch (err) {
      setError(getErrorMessage(err) || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    } finally {
      setResendLoading(false)
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác thực thành công!</h1>
            <p className="text-gray-600 mb-4">
              {successMessage}
            </p>
            <p className="text-sm text-gray-500">Đang chuyển đến trang đăng nhập...</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác thực Email</h1>
            <p className="text-gray-600 text-sm">
              Nhập mã OTP đã được gửi đến email của bạn để xác thực tài khoản
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

          {resendMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{resendMessage}</span>
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

            <div>
              <Input
                label="Mã OTP"
                type="text"
                placeholder="Nhập mã OTP 6 số"
                maxLength={6}
                {...register('otp')}
                error={errors.otp?.message}
                className="focus:border-emerald-500 focus:ring-emerald-500"
              />
              <div className="mt-2 text-sm text-gray-600">
                Không nhận được mã?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!email || resendCooldown > 0 || resendLoading}
                  className="text-emerald-600 hover:text-emerald-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Đang gửi...' : resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {loading ? 'Đang xác thực...' : 'Xác thực Email'}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
          Đang tải...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
