'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import { EmptyState } from '@/shared/ui/EmptyState'

type TransactionType = 'REVENUE' | 'COGS' | 'OPERATING_EXPENSE' | 'OTHER_INCOME' | 'OTHER_EXPENSE'

interface FinancialTransaction extends Record<string, unknown> {
  id: string
  date: string
  category: string
  type: TransactionType
  description: string
  amount: number
  reference?: string
  storeName?: string
}

interface ProfitLossSummary {
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  operatingIncome: number
  operatingMargin: number
  otherIncome: number
  otherExpenses: number
  netIncome: number
  netMargin: number
}

const typeLabels: Record<TransactionType, string> = {
  REVENUE: 'Doanh thu',
  COGS: 'Giá vốn hàng bán',
  OPERATING_EXPENSE: 'Chi phí hoạt động',
  OTHER_INCOME: 'Thu nhập khác',
  OTHER_EXPENSE: 'Chi phí khác',
}

const typeColors: Record<TransactionType, string> = {
  REVENUE: 'bg-green-100 text-green-800',
  COGS: 'bg-red-100 text-red-800',
  OPERATING_EXPENSE: 'bg-orange-100 text-orange-800',
  OTHER_INCOME: 'bg-blue-100 text-blue-800',
  OTHER_EXPENSE: 'bg-gray-100 text-gray-800',
}

export default function ProfitLossPage() {
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-02-03')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Demo data
  const transactions: FinancialTransaction[] = useMemo(
    () => [
      // Revenue
      {
        id: '1',
        date: '2026-01-15',
        category: 'Bán hàng Online',
        type: 'REVENUE',
        description: 'Doanh thu bán hàng online tháng 1',
        amount: 450000000,
        reference: 'REV-2026-01-001',
        storeName: 'Online Store',
      },
      {
        id: '2',
        date: '2026-01-15',
        category: 'Bán hàng POS',
        type: 'REVENUE',
        description: 'Doanh thu bán hàng tại cửa hàng',
        amount: 380000000,
        reference: 'REV-2026-01-002',
        storeName: 'BHX Quận 1',
      },
      {
        id: '3',
        date: '2026-01-31',
        category: 'Bán hàng POS',
        type: 'REVENUE',
        description: 'Doanh thu cửa hàng Quận 2',
        amount: 320000000,
        reference: 'REV-2026-01-003',
        storeName: 'BHX Quận 2',
      },
      // COGS
      {
        id: '4',
        date: '2026-01-15',
        category: 'Giá vốn',
        type: 'COGS',
        description: 'Giá vốn hàng bán tháng 1',
        amount: -650000000,
        reference: 'COGS-2026-01-001',
      },
      // Operating Expenses
      {
        id: '5',
        date: '2026-01-05',
        category: 'Lương nhân viên',
        type: 'OPERATING_EXPENSE',
        description: 'Lương tháng 1/2026',
        amount: -180000000,
        reference: 'EXP-2026-01-001',
      },
      {
        id: '6',
        date: '2026-01-10',
        category: 'Thuê mặt bằng',
        type: 'OPERATING_EXPENSE',
        description: 'Tiền thuê cửa hàng tháng 1',
        amount: -95000000,
        reference: 'EXP-2026-01-002',
      },
      {
        id: '7',
        date: '2026-01-15',
        category: 'Marketing',
        type: 'OPERATING_EXPENSE',
        description: 'Chiến dịch quảng cáo Facebook & Google',
        amount: -45000000,
        reference: 'EXP-2026-01-003',
      },
      {
        id: '8',
        date: '2026-01-20',
        category: 'Điện nước',
        type: 'OPERATING_EXPENSE',
        description: 'Hóa đơn điện nước tháng 1',
        amount: -12000000,
        reference: 'EXP-2026-01-004',
      },
      {
        id: '9',
        date: '2026-01-25',
        category: 'Vận chuyển',
        type: 'OPERATING_EXPENSE',
        description: 'Chi phí giao hàng và logistics',
        amount: -28000000,
        reference: 'EXP-2026-01-005',
      },
      // Other Income
      {
        id: '10',
        date: '2026-01-20',
        category: 'Lãi tiền gửi',
        type: 'OTHER_INCOME',
        description: 'Lãi ngân hàng tháng 1',
        amount: 5000000,
        reference: 'INC-2026-01-001',
      },
      // Other Expenses
      {
        id: '11',
        date: '2026-01-28',
        category: 'Phí ngân hàng',
        type: 'OTHER_EXPENSE',
        description: 'Phí duy trì tài khoản và giao dịch',
        amount: -2000000,
        reference: 'EXP-2026-01-006',
      },
      // February
      {
        id: '12',
        date: '2026-02-01',
        category: 'Bán hàng Online',
        type: 'REVENUE',
        description: 'Doanh thu online đầu tháng 2',
        amount: 156000000,
        reference: 'REV-2026-02-001',
        storeName: 'Online Store',
      },
    ],
    []
  )

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = typeFilter === 'all' || tx.type === typeFilter
      const matchesSearch =
        !searchQuery ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      const txDate = tx.date
      const matchesFrom = !dateFrom || txDate >= dateFrom
      const matchesTo = !dateTo || txDate <= dateTo
      return matchesType && matchesSearch && matchesFrom && matchesTo
    })
  }, [transactions, typeFilter, searchQuery, dateFrom, dateTo])

  // Calculate P&L Summary
  const summary: ProfitLossSummary = useMemo(() => {
    const revenue = filtered
      .filter((tx) => tx.type === 'REVENUE')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const cogs = Math.abs(
      filtered.filter((tx) => tx.type === 'COGS').reduce((sum, tx) => sum + tx.amount, 0)
    )

    const grossProfit = revenue - cogs
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

    const operatingExpenses = Math.abs(
      filtered
        .filter((tx) => tx.type === 'OPERATING_EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0)
    )

    const operatingIncome = grossProfit - operatingExpenses
    const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0

    const otherIncome = filtered
      .filter((tx) => tx.type === 'OTHER_INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const otherExpenses = Math.abs(
      filtered
        .filter((tx) => tx.type === 'OTHER_EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0)
    )

    const netIncome = operatingIncome + otherIncome - otherExpenses
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0

    return {
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      operatingIncome,
      operatingMargin,
      otherIncome,
      otherExpenses,
      netIncome,
      netMargin,
    }
  }, [filtered])

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Profit & Loss"
        subtitle="Báo cáo lãi/lỗ và phân tích tài chính"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Reports', href: '/admin/reports' },
          { label: 'Profit & Loss', href: '/admin/reports/finance' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => alert('Export PDF')}>
              📄 PDF
            </Button>
            <Button onClick={() => alert('Export Excel')}>📊 Excel</Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Input
              placeholder="Tìm kiếm mô tả, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | TransactionType)}
            >
              <option value="all">Tất cả loại</option>
              <option value="REVENUE">Doanh thu</option>
              <option value="COGS">Giá vốn</option>
              <option value="OPERATING_EXPENSE">Chi phí HĐ</option>
              <option value="OTHER_INCOME">Thu nhập khác</option>
              <option value="OTHER_EXPENSE">Chi phí khác</option>
            </select>
          </div>
          <div>
            <Input
              type="date"
              label="Từ ngày"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="date"
              label="Đến ngày"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income Statement */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo kết quả kinh doanh</h3>
          <div className="space-y-3">
            {/* Revenue */}
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="font-semibold text-gray-900">Doanh thu</span>
              <span className="font-semibold text-green-600">{formatCurrency(summary.revenue)}</span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center pl-4">
              <span className="text-gray-700">Giá vốn hàng bán</span>
              <span className="text-red-600">({formatCurrency(summary.cogs)})</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center pb-2 border-b bg-gray-50 px-2 py-1 rounded">
              <div>
                <span className="font-semibold text-gray-900">Lợi nhuận gộp</span>
                <span className="text-xs text-gray-600 ml-2">({formatPercent(summary.grossMargin)})</span>
              </div>
              <span className="font-semibold text-blue-600">{formatCurrency(summary.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center pl-4">
              <span className="text-gray-700">Chi phí hoạt động</span>
              <span className="text-red-600">({formatCurrency(summary.operatingExpenses)})</span>
            </div>

            {/* Operating Income */}
            <div className="flex justify-between items-center pb-2 border-b bg-gray-50 px-2 py-1 rounded">
              <div>
                <span className="font-semibold text-gray-900">Lợi nhuận hoạt động</span>
                <span className="text-xs text-gray-600 ml-2">({formatPercent(summary.operatingMargin)})</span>
              </div>
              <span className="font-semibold text-blue-600">{formatCurrency(summary.operatingIncome)}</span>
            </div>

            {/* Other Income/Expenses */}
            <div className="flex justify-between items-center pl-4">
              <span className="text-gray-700">Thu nhập khác</span>
              <span className="text-green-600">{formatCurrency(summary.otherIncome)}</span>
            </div>
            <div className="flex justify-between items-center pl-4">
              <span className="text-gray-700">Chi phí khác</span>
              <span className="text-red-600">({formatCurrency(summary.otherExpenses)})</span>
            </div>

            {/* Net Income */}
            <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 bg-blue-50 px-3 py-2 rounded">
              <div>
                <span className="text-lg font-bold text-gray-900">Lợi nhuận ròng</span>
                <span className="text-xs text-gray-600 ml-2">({formatPercent(summary.netMargin)})</span>
              </div>
              <span
                className={`text-lg font-bold ${
                  summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(summary.netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="card p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Tổng doanh thu</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.revenue)}</div>
            <div className="text-xs text-gray-500 mt-1">{filtered.filter(t => t.type === 'REVENUE').length} giao dịch</div>
          </div>

          <div className="card p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Lợi nhuận gộp</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.grossProfit)}</div>
            <div className="text-xs text-gray-500 mt-1">Biên lợi nhuận: {formatPercent(summary.grossMargin)}</div>
          </div>

          <div className="card p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Lợi nhuận hoạt động</div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summary.operatingIncome)}</div>
            <div className="text-xs text-gray-500 mt-1">Biên lợi nhuận: {formatPercent(summary.operatingMargin)}</div>
          </div>

          <div className={`card p-4 border-l-4 ${summary.netIncome >= 0 ? 'border-emerald-500' : 'border-red-500'}`}>
            <div className="text-sm text-gray-600 mb-1">Lợi nhuận ròng</div>
            <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netIncome)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Biên lợi nhuận: {formatPercent(summary.netMargin)}</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết giao dịch</h3>
          <p className="text-sm text-gray-600">Danh sách các khoản thu chi trong kỳ</p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Không có dữ liệu"
            description="Không tìm thấy giao dịch phù hợp với bộ lọc."
          />
        ) : (
          <DataTable
            data={filtered}
            columns={[
              {
                key: 'date',
                label: 'Ngày',
                render: (v) => new Date(v as string).toLocaleDateString('vi-VN'),
              },
              {
                key: 'type',
                label: 'Loại',
                render: (v) => {
                  const type = v as TransactionType
                  return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type]}`}>
                      {typeLabels[type]}
                    </span>
                  )
                },
              },
              {
                key: 'category',
                label: 'Danh mục',
                render: (v) => <span className="text-sm font-medium text-gray-900">{v as string}</span>,
              },
              {
                key: 'description',
                label: 'Mô tả',
                render: (v, item) => {
                  const tx = item as FinancialTransaction
                  return (
                    <div>
                      <div className="text-sm text-gray-900">{v as string}</div>
                      {tx.storeName && (
                        <div className="text-xs text-gray-500">{tx.storeName}</div>
                      )}
                    </div>
                  )
                },
              },
              {
                key: 'reference',
                label: 'Mã tham chiếu',
                render: (v) => (
                  <span className="text-xs font-mono text-gray-600">{(v as string) || '-'}</span>
                ),
              },
              {
                key: 'amount',
                label: 'Số tiền',
                render: (v) => {
                  const amount = v as number
                  return (
                    <span
                      className={`font-semibold ${
                        amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {amount >= 0 ? '+' : ''}
                      {formatCurrency(amount)}
                    </span>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi phí hoạt động</h3>
          <div className="space-y-3">
            {Array.from(new Set(filtered.filter(tx => tx.type === 'OPERATING_EXPENSE').map(tx => tx.category)))
              .map((category) => {
                const categoryExpenses = filtered.filter(
                  (tx) => tx.type === 'OPERATING_EXPENSE' && tx.category === category
                )
                const total = Math.abs(categoryExpenses.reduce((sum, tx) => sum + tx.amount, 0))
                const percentage = summary.operatingExpenses > 0 
                  ? (total / summary.operatingExpenses) * 100 
                  : 0
                
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                        <span className="text-sm text-gray-600">{formatPercent(percentage)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4 min-w-[120px] text-right">
                      {formatCurrency(total)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu theo kênh</h3>
          <div className="space-y-3">
            {Array.from(new Set(filtered.filter(tx => tx.type === 'REVENUE' && tx.storeName).map(tx => tx.storeName)))
              .map((store) => {
                const storeRevenue = filtered.filter(
                  (tx) => tx.type === 'REVENUE' && tx.storeName === store
                )
                const total = storeRevenue.reduce((sum, tx) => sum + tx.amount, 0)
                const percentage = summary.revenue > 0 ? (total / summary.revenue) * 100 : 0
                
                return (
                  <div key={store} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{store}</span>
                        <span className="text-sm text-gray-600">{formatPercent(percentage)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4 min-w-[120px] text-right">
                      {formatCurrency(total)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
