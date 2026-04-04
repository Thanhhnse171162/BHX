'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, RotateCcw, Loader, AlertCircle } from 'lucide-react'

interface OrderDetails {
  orderId: string
  totalAmount: number
  customerName: string
  paymentMethod: string
  timestamp: string
  items: Array<{
    productName: string
    quantity: number
    price: number
  }>
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const orderId = searchParams.get('orderId') || searchParams.get('orderld')
  const resultCode = searchParams.get('resultCode')
  const amountParam = searchParams.get('amount')
  const isSuccess = resultCode === '0'

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Không tìm thấy thông tin đơn hàng')
        setIsLoading(false)
        return
      }

      try {
        // Try to fetch invoice/order details from API
        console.log('Fetching invoice for:', orderId)
        
        // Extract saleId from orderId (format: SALE-20260404-2CB1C3D8-...)
        const saleId = orderId.includes('SALE-') ? orderId.split('-').slice(0, 4).join('-') : orderId
        
        let foundInvoice = null
        let totalAmountFromApi = 0

        // Try 1: Fetch from /api/sales/{saleId}
        try {
          const saleResponse = await fetch(`/api/sales/${saleId}?_ts=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          })
          if (saleResponse.ok) {
            const saleData = await saleResponse.json().catch(() => null)
            if (saleData) {
              console.log('Sale API response:', saleData)
              totalAmountFromApi = saleData.totalAmount || saleData.amount || saleData.total || 0
              if (totalAmountFromApi > 0) {
                foundInvoice = saleData
              }
            }
          }
        } catch (err) {
          console.log('Sale API fetch failed, trying invoices list...')
        }

        // Try 2: Fetch from /api/cashier/invoices/list
        if (!foundInvoice) {
          const response = await fetch(`/api/cashier/invoices/list`)
          if (response.ok) {
            const data = await response.json()
            console.log('Invoices response:', data)
            
            const invoices = Array.isArray(data) ? data : data.data || data.invoices || []
            foundInvoice = invoices.find((inv: any) => 
              String(inv.id || inv.invoiceNumber || '').includes(orderId) ||
              String(orderId).includes(String(inv.id || inv.invoiceNumber || ''))
            )
            
            if (foundInvoice) {
              totalAmountFromApi = foundInvoice.totalAmount || foundInvoice.amount || 0
            }
          }
        }

        // Set order with data from API or fallback to query parameters
        const finalAmount = amountParam ? parseInt(amountParam) : totalAmountFromApi
        setOrder({
          orderId: foundInvoice?.id || foundInvoice?.invoiceNumber || orderId,
          totalAmount: finalAmount,
          customerName: foundInvoice?.customerName || 'Khách hàng',
          paymentMethod: foundInvoice?.paymentMethod || 'MoMo',
          timestamp: foundInvoice?.createdAt ? new Date(foundInvoice.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          items: foundInvoice?.items || foundInvoice?.products || [],
        })
      } catch (err) {
        console.error('Error fetching invoice:', err)
        // Still show order with amount from query param
        if (amountParam) {
          setOrder({
            orderId: orderId,
            totalAmount: parseInt(amountParam),
            customerName: 'Khách hàng',
            paymentMethod: 'MoMo',
            timestamp: new Date().toLocaleString('vi-VN'),
            items: [],
          })
        } else {
          setError('Không thể tải chi tiết hóa đơn')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 text-purple-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin hóa đơn...</p>
        </div>
      </div>
    )
  }

  if (!isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
          <p className="text-gray-600 mb-8">Giao dịch của bạn không thành công. Vui lòng thử lại.</p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h1>
          <p className="text-gray-600 mb-8">{error || 'Không thể tải thông tin hóa đơn'}</p>
          <button
            onClick={() => router.push('/cashier/pos')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Quay lại POS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 pt-8 pb-6 px-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-green-100 uppercase tracking-wider mb-2">
              GIAO DỊCH THÀNH CÔNG
            </h2>
            <h1 className="text-2xl font-bold text-white">Thanh toán thành công</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Amount */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
              <p className="text-gray-500 text-sm mb-1">Số tiền thanh toán</p>
              <p className="text-3xl font-bold text-green-600">
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 text-sm">Khách hàng</span>
                <span className="text-gray-900 font-medium text-right">{order.customerName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 text-sm">Thời gian</span>
                <span className="text-gray-900 font-medium text-sm">{order.timestamp}</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 text-sm">Phương thức thanh toán</span>
                <span className="text-gray-900 font-medium">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Mã hóa đơn</span>
                <span className="text-gray-900 font-mono text-xs font-semibold">{order.orderId}</span>
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Chi tiết hóa đơn</h3>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.productName || `Sản phẩm ${idx + 1}`} x{item.quantity}
                      </span>
                      <span className="text-gray-900 font-medium">
                        {((item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <button
              onClick={() => router.push('/cashier/pos')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw size={18} />
              Quay lại POS
            </button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Giao dịch MoMo{' '}
              <span className="text-green-600 font-semibold">đã xác nhận</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader size={48} className="mx-auto mb-4 text-purple-600 animate-spin" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
