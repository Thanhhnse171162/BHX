'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DamageReportAPIService, DamageReportFromAPI } from '@/services/damage-report-api.service'
import { ProductAPIService } from '@/services/product-api.service'
import { UserAPIService } from '@/services/user-api.service'
import { WarehouseLookupAPIService } from '@/services/warehouse-lookup-api.service'

interface DamageReportDetailPageProps {
  params: {
    id: string
  }
}

interface ReportDetail {
  report: DamageReportFromAPI | null
  productName: string | null
  reporterName: string | null
  locationName: string | null
}

export default function DamageReportDetailPage({ params }: DamageReportDetailPageProps) {
  const [detail, setDetail] = useState<ReportDetail>({
    report: null,
    productName: null,
    reporterName: null,
    locationName: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportDetail = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch main report
        const report = await DamageReportAPIService.getDamageReportById(params.id)
        if (!report) {
          setError('Không tìm thấy báo cáo')
          setDetail({ report: null, productName: null, reporterName: null, locationName: null })
          setIsLoading(false)
          return
        }

        // Fetch product name
        let productName: string | null = null
        if (report.productId) {
          try {
            const product = await ProductAPIService.getById(report.productId)
            if (product) {
              productName = product.name || null
              console.log('Product fetched:', { productId: report.productId, product, productName })
            } else {
              console.warn('Product API returned null for product ID:', report.productId)
            }
          } catch (err) {
            console.error('Error fetching product:', err)
          }
        }

        // Fetch reporter name
        let reporterName: string | null = null
        if (report.reportedBy) {
          try {
            const user = await UserAPIService.getById(report.reportedBy)
            if (user) {
              reporterName = user.full_name || user.fullName || user.name || null
              console.log('Reporter user fetched:', { userId: report.reportedBy, user, reporterName })
            } else {
              console.warn('User API returned null for reporter ID:', report.reportedBy)
            }
          } catch (err) {
            console.error('Error fetching reporter user:', err)
          }
        }

        // Fetch location name (warehouse/store)
        let locationName: string | null = null
        if (report.locationId) {
          try {
            const location = await WarehouseLookupAPIService.getById(report.locationId)
            if (location) {
              locationName = location.name || null
              console.log('Location fetched:', { locationId: report.locationId, location, locationName })
            } else {
              console.warn('Location API returned null for location ID:', report.locationId)
            }
          } catch (err) {
            console.error('Error fetching location:', err)
          }
        }

        setDetail({
          report,
          productName,
          reporterName,
          locationName,
        })
      } catch (err) {
        setError('Lỗi khi tải báo cáo')
        console.error('Error fetching damage report:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchReportDetail()
    }
  }, [params.id])

  const statusMap: Record<string, { label: string; color: string }> = {
    'PENDING': { label: 'Chờ xử lý', color: 'bg-yellow-50 text-yellow-700' },
    'PROCESSING': { label: 'Đang xử lý', color: 'bg-blue-50 text-blue-700' },
    'COMPLETED': { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700' },
    'APPROVED': { label: 'Đã phê duyệt', color: 'bg-green-50 text-green-700' },
  }

  const locationMap: Record<string, string> = {
    'WAREHOUSE': 'Kho hàng',
    'STORE': 'Cửa hàng',
  }

  const currentStatus = detail.report?.status ? statusMap[detail.report.status] || { label: detail.report.status, color: 'bg-gray-50 text-gray-700' } : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Link href="/admin/reports" className="hover:text-gray-600">
                Báo cáo sự cố
              </Link>
              <span>/</span>
              <span className="text-gray-600 font-medium">Chi tiết</span>
            </nav>
            <h1 className="text-2xl font-semibold text-gray-900">Chi tiết báo cáo sự cố</h1>
          </div>
          <Link
            href="/admin/reports"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Quay lại
          </Link>
        </div>
      </div>

      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-sm text-gray-500">Đang tải...</div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-sm text-red-700">{error}</div>
            <Link
              href="/admin/reports"
              className="inline-block mt-4 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Quay lại danh sách
            </Link>
          </div>
        ) : detail.report ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Report Header */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{detail.report.reportNumber || `Báo cáo #${detail.report.id.substring(0, 8)}`}</h2>
                  <p className="text-sm text-gray-500 mb-3">ID: {detail.report.id}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {currentStatus && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${currentStatus.color}`}>
                        {currentStatus.label}
                      </span>
                    )}
                    {detail.report.locationType && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                        {locationMap[detail.report.locationType] || detail.report.locationType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="px-6 py-6 space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Loại hư hại</p>
                  <p className="text-sm text-gray-900">{detail.report.damageType || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mức độ hư hại</p>
                  <p className="text-sm text-gray-900">{detail.report.quality || '—'}</p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vị trí</p>
                  <p className="text-sm text-gray-900">{detail.locationName || detail.report.locationId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sản phẩm</p>
                  <p className="text-sm text-gray-900">{detail.productName || detail.report.productId || '—'}</p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ngày báo cáo</p>
                  <p className="text-sm text-gray-900">
                    {detail.report.reportedDate ? new Date(detail.report.reportedDate).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Người báo cáo</p>
                  <p className="text-sm text-gray-900">{detail.reporterName || detail.report.reportedBy || '—'}</p>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ngày tạo</p>
                  <p className="text-sm text-gray-900">
                    {detail.report.createdAt ? new Date(detail.report.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ngày phê duyệt</p>
                  <p className="text-sm text-gray-900">
                    {detail.report.approvedDate ? new Date(detail.report.approvedDate).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '—'}
                  </p>
                </div>
              </div>

              {/* Row 5 */}
              {detail.report.approvedBy && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Người phê duyệt</p>
                  <p className="text-sm text-gray-900">{detail.report.approvedBy}</p>
                </div>
              )}

              {/* Description */}
              {detail.report.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mô tả</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{detail.report.description}</p>
                </div>
              )}

              {/* Photos */}
              {detail.report.photos && detail.report.photos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Hình ảnh</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {detail.report.photos.map((photo, idx) => (
                      <a
                        key={idx}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                      >
                        <img
                          src={photo}
                          alt={`Hình ảnh ${idx + 1}`}
                          className="w-full h-32 object-cover group-hover:opacity-75 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <Link
                href="/admin/reports"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Quay lại
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
