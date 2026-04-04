'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  XCircle,
  AlertCircle,
  RotateCcw,
  Loader,
  ChevronDown,
  Phone,
  HelpCircle,
} from 'lucide-react'

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

interface ErrorInfo {
  code: string
  message: string
  description: string
  suggestion: string
}

// Mapping resultCode to error information
const getErrorInfo = (resultCode: string): ErrorInfo => {
  const errorMap: Record<string, ErrorInfo> = {
    '1001': {
      code: '1001',
      message: 'Lỗi xác thực',
      description: 'Thông tin xác thực không hợp lệ',
      suggestion: 'Kiểm tra thông tin tài khoản hoặc liên hệ hỗ trợ',
    },
    '1002': {
      code: '1002',
      message: 'Lỗi kết nối',
      description: 'Không thể kết nối đến cổng thanh toán',
      suggestion: 'Kiểm tra kết nối internet và thử lại',
    },
    '1003': {
      code: '1003',
      message: 'Hạn mức vượt quá',
      description: 'Số tiền vượt quá hạn mức cho phép',
      suggestion: 'Giảm số tiền hoặc liên hệ nhà cung cấp dịch vụ',
    },
    '1004': {
      code: '1004',
      message: 'Sai mật khẩu',
      description: 'PIN hoặc mật khẩu thanh toán không đúng',
      suggestion: 'Nhập lại PIN hoặc mật khẩu chính xác',
    },
    '1005': {
      code: '1005',
      message: 'Tài khoản bị khóa',
      description: 'Tài khoản đã bị tạm khóa',
      suggestion: 'Liên hệ tổng đài hỗ trợ để mở khóa tài khoản',
    },
    '1006': {
      code: '1006',
      message: 'Giao dịch bị từ chối',
      description: 'Giao dịch đã bị từ chối bởi hệ thống',
      suggestion: 'Thử lại sau vài phút hoặc liên hệ hỗ trợ',
    },
    '1007': {
      code: '1007',
      message: 'Hết thời gian chờ',
      description: 'Yêu cầu thanh toán đã hết thời gian',
      suggestion: 'Khởi tạo giao dịch mới',
    },
    '1008': {
      code: '1008',
      message: 'Không đủ số dư',
      description: 'Số dư tài khoản không đủ',
      suggestion: 'Nạp thêm tiền vào tài khoản',
    },
    '9999': {
      code: '9999',
      message: 'Lỗi hệ thống',
      description: 'Có lỗi xảy ra trên máy chủ',
      suggestion: 'Vui lòng liên hệ bộ phận hỗ trợ kỹ thuật',
    },
  }

  return (
    errorMap[resultCode] || {
      code: resultCode || 'UNKNOWN',
      message: 'Thanh toán thất bại',
      description: 'Giao dịch không thành công vì lý do không xác định',
      suggestion: 'Vui lòng thử lại hoặc liên hệ hỗ trợ',
    }
  )
}

function PaymentFailureContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const orderId = searchParams.get('orderId') || searchParams.get('orderld')
  const resultCode = searchParams.get('resultCode') || '9999'
  const amountParam = searchParams.get('amount')
  const errorInfo = getErrorInfo(resultCode)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false)
        return
      }

      try {
        console.log('Fetching invoice for:', orderId)

        // Extract saleId from orderId
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
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size={48} className="mx-auto mb-4 text-red-600 animate-spin" />
          <p className="text-gray-600">Đang tải thông tin hóa đơn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Failure Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 pt-8 pb-6 px-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <XCircle size={48} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-red-100 uppercase tracking-wider mb-2">
              GIAO DỊCH THẤT BẠI
            </h2>
            <h1 className="text-2xl font-bold text-white">Thanh toán thất bại</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Code & Message */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Mã lỗi: {errorInfo.code}</p>
                  <p className="text-lg font-bold text-red-600 mb-2">{errorInfo.message}</p>
                  <p className="text-sm text-gray-700">{errorInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Amount */}
            {order && order.totalAmount > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-gray-500 text-sm mb-1">Số tiền cần thanh toán</p>
                <p className="text-3xl font-bold text-gray-900">
                  {order.totalAmount.toLocaleString('vi-VN')}đ
                </p>
              </div>
            )}

            {/* Order Details */}
            {order && (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Mã hóa đơn</span>
                  <span className="text-gray-900 font-mono text-xs font-semibold">{order.orderId}</span>
                </div>

                {order.customerName && (
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-gray-500 text-sm">Khách hàng</span>
                    <span className="text-gray-900 font-medium text-right">{order.customerName}</span>
                  </div>
                )}

                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-500 text-sm">Thời gian</span>
                  <span className="text-gray-900 font-medium text-sm">{order.timestamp}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Hình thức thanh toán</span>
                  <span className="text-gray-900 font-medium">{order.paymentMethod}</span>
                </div>
              </div>
            )}

            {/* Items */}
            {order && order.items && order.items.length > 0 && (
              <div className="bg-gray-50 rounded-xl overflow-hidden mb-6">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'items' ? null : 'items')}
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 text-sm">Chi tiết hóa đơn ({order.items.length} sản phẩm)</h3>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${
                      expandedSection === 'items' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedSection === 'items' && (
                  <div className="border-t border-gray-200 px-4 py-3 space-y-2">
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
                )}
              </div>
            )}

            {/* Suggestion */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <HelpCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Gợi ý</p>
                  <p className="text-sm text-blue-800">{errorInfo.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/cashier/pos`)}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw size={18} />
                Thử lại thanh toán
              </button>
              <button
                onClick={() => router.push('/cashier/pos')}
                className="w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                Giao dịch MoMo{' '}
                <span className="text-red-600 font-semibold">không thành công</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={12} />
                Cần hỗ trợ? Hãy liên hệ bộ phận chăm sóc khách hàng
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader size={48} className="mx-auto mb-4 text-red-600 animate-spin" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <PaymentFailureContent />
    </Suspense>
  )
}
