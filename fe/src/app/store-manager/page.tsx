'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Package,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Check,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint { day: string; value: number }
interface Product { name: string; units: number; revenue: string; pct: number }
interface Store { id: string; name: string }
interface Staff { id: string; name: string; email?: string }

type TimeRange = 'today' | 'yesterday' | '7days' | 'month' | 'custom'

// ─── Helper: Check if data is mock/placeholder
function isMockData(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0) return false
  
  // Check if products have placeholder names like "Sản phẩm A", "Sản phẩm B", etc.
  const mockPattern = /Sản phẩm\s+[A-Z]|Product\s+[A-Z]|Item\s+[A-Z]/i
  return data.some((p: any) => {
    const name = p.productName || p.name || ''
    return mockPattern.test(name)
  })
}

// ─── Custom SVG Revenue Chart ─────────────────────────────────────────────────
function RevenueChart({ chartData }: { chartData: ChartPoint[] }) {
  const width = 500
  const height = 240
  const padding = { top: 20, right: 30, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (!chartData.length) {
    // Show empty chart structure
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="mx-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartHeight * (1 - ratio)
          return (
            <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e4edd9" strokeWidth="1" />
          )
        })}

        {/* Y Axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const maxValue = 1000000
          const minValue = 0
          const value = minValue + (maxValue - minValue) * ratio
          const y = padding.top + chartHeight * (1 - ratio)
          const label = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(0)}M` : 
                        value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : 
                        value.toFixed(0)
          return (
            <text
              key={`y-${i}`}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#9aaa8e"
            >
              {label}
            </text>
          )
        })}
      </svg>
    )
  }

  const values = chartData.map(d => d.value)
  const maxValue = Math.max(...values, 1)
  const minValue = 0

  const xStep = chartWidth / Math.max(chartData.length - 1, 1)
  const yScale = chartHeight / (maxValue - minValue)

  const points = chartData.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - (d.value - minValue) * yScale,
  }))

  // Create smooth bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p1.x - (p1.x - p0.x) / 3
    const cp2y = p1.y
    pathD += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`
  }

  // Fill area
  let areaD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="mx-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const y = padding.top + chartHeight * (1 - ratio)
        return (
          <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e4edd9" strokeWidth="1" />
        )
      })}

      {/* Fill area */}
      <path d={areaD} fill="rgba(59,140,42,0.08)" />

      {/* Line */}
      <path d={pathD} stroke="#3b8c2a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#3b8c2a" strokeWidth="2" />
      ))}

      {/* X Axis labels */}
      {chartData.map((d, i) => (
        i % Math.ceil(chartData.length / 5) === 0 ? (
          <text
            key={`x-${i}`}
            x={points[i].x}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#9aaa8e"
          >
            {d.day}
          </text>
        ) : null
      ))}

      {/* Y Axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const value = minValue + (maxValue - minValue) * ratio
        const y = padding.top + chartHeight * (1 - ratio)
        const label = value >= 1_000_000 ? `${(value / 1_000_000).toFixed(0)}M` : 
                      value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : 
                      value.toFixed(0)
        return (
          <text
            key={`y-${i}`}
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            fontSize="11"
            fill="#9aaa8e"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StoreManagerDashboard() {
  const { token, user } = useAuthStore(s => ({ token: s.token, user: s.user }))
  
  // Store selection
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [showStoreMenu, setShowStoreMenu] = useState(false)
  const selectedStore = stores.find(s => s.id === selectedStoreId)

  // Time filters
  const [activeRange, setActiveRange] = useState<TimeRange>('7days')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // KPI
  const [revenue, setRevenue] = useState('—')
  const [stockCount, setStockCount] = useState(0)
  const [lowCount, setLowCount] = useState(0)
  const [outCount, setOutCount] = useState(0)

  // Chart & Products
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Staff selection
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [showStaffMenu, setShowStaffMenu] = useState(false)

  // ── Initialize stores from API ─────────────────────────────────────────────
  useEffect(() => {
    const initStores = async () => {
      try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        // Try warehouses endpoint first
        let res = await fetch('/api/warehouses', { headers })
        
        // If that fails, try warehouse/list
        if (!res.ok) {
          res = await fetch('/api/warehouse/list', { headers })
        }
        
        if (res.ok) {
          const data = await res.json()
          let storeList = Array.isArray(data) ? data : data.data || []
          
          // Only keep user's current workplace/store
          if (user?.workplaceId) {
            storeList = storeList.filter((s: Store) => s.id === user.workplaceId)
          }
          
          console.log('Stores loaded:', storeList)
          setStores(storeList)
          
          // Set the store automatically (should be only 1)
          if (storeList.length > 0) {
            setSelectedStoreId(storeList[0].id)
          }
        } else {
          console.error('Failed to load stores:', res.status)
        }
      } catch (err) {
        console.error('Failed to load stores:', err)
      }
    }
    
    if (token) initStores()
  }, [token, user?.workplaceId])

  // ── Fetch staff list when store changes ─────────────────────────────────────
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (!selectedStoreId || !token) return
        const headers: HeadersInit = { Authorization: `Bearer ${token}` }
        const storeQuery = `?storeId=${encodeURIComponent(selectedStoreId)}`
        const res = await fetch(`/api/users/by-store${storeQuery}`, { headers })
        if (res.ok) {
          const data = await res.json()
          const employees = Array.isArray(data) ? data : (data.data || [])
          setStaffList(employees)
          setSelectedStaffId('') // Reset staff selection when store changes
        }
      } catch (err) {
        console.error('Failed to load staff:', err)
        setStaffList([])
      }
    }
    
    fetchStaff()
  }, [selectedStoreId, token])

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true)
      console.log('>>> fetchAll called, activeRange:', activeRange, 'storeId:', selectedStoreId)
      
      // Reset KPI values
      setRevenue('—')
      setChartData([])
      setProducts([])
      setStockCount(0)
      setLowCount(0)
      setOutCount(0)

      if (!token || !selectedStoreId) {
        console.warn('Missing token or selectedStoreId')
        setLoading(false)
        return
      }

      const headers: HeadersInit = { Authorization: `Bearer ${token}` }

      // Build query parameters
      const baseParams = new URLSearchParams()
      baseParams.set('storeId', selectedStoreId)
      baseParams.set('warehouseId', selectedStoreId)  // Also set warehouseId as backup
      baseParams.set('locationId', selectedStoreId)   // Also set locationId as backup
      if (selectedStaffId) {
        baseParams.set('staffId', selectedStaffId)
      }
      if (activeRange !== 'custom') {
        baseParams.set('period', activeRange)
        baseParams.set('range', activeRange)
      } else {
        if (dateFrom) {
          baseParams.set('from', dateFrom)
          baseParams.set('fromDate', dateFrom)
        }
        if (dateTo) {
          baseParams.set('to', dateTo)
          baseParams.set('toDate', dateTo)
        }
      }
      console.log('>>> baseParams:', baseParams.toString())

      // Fetch revenue trend data (for chart)
      const fetchRevenueTrend = fetch(
        `/api/reports/revenue-trend?${baseParams.toString()}`,
        { headers, signal: AbortSignal.timeout(10000) }
      )
        .then(res => {
          console.log('[Frontend] Revenue Trend Response:', res.status)
          if (!res.ok) {
            console.error('[Frontend] Revenue Trend API error:', res.status)
            return null
          }
          return res.json()
        })
        .catch(err => {
          console.error('[Frontend] Revenue Trend fetch error:', err)
          return null
        })

      // Fetch top products data
      const fetchTopProducts = fetch(
        `/api/reports/top-products?topN=5&${baseParams.toString()}`,
        { headers, signal: AbortSignal.timeout(10000) }
      )
        .then(res => {
          console.log('Top Products Response:', res.status)
          if (!res.ok) {
            console.error('Top Products API error:', res.status)
            return null
          }
          return res.json()
        })
        .catch(err => {
          console.error('Top Products fetch error:', err)
          return null
        })

      // Fetch inventory summary
      const fetchInventory = fetch(
        `/api/inventory?${baseParams.toString()}`,
        { headers, signal: AbortSignal.timeout(10000) }
      )
        .then(res => {
          console.log('Inventory Response:', res.status)
          if (!res.ok) {
            console.error('Inventory API error:', res.status)
            return null
          }
          return res.json()
        })
        .catch(err => {
          console.error('Inventory fetch error:', err)
          return null
        })

      // Execute all 3 API calls in parallel
      const [trendData, topData, invData] = await Promise.all([
        fetchRevenueTrend,
        fetchTopProducts,
        fetchInventory,
      ])

      // Process revenue trend
      if (trendData) {
        let dataArray: any[] = []
        
        // Handle different response formats
        if (Array.isArray(trendData)) {
          dataArray = trendData
        } else if (trendData.data && Array.isArray(trendData.data)) {
          dataArray = trendData.data
        } else if (trendData.result && Array.isArray(trendData.result)) {
          dataArray = trendData.result
        } else if (trendData.items && Array.isArray(trendData.items)) {
          dataArray = trendData.items
        }
        
        console.log('[Frontend] Processing trend data:', dataArray.length, 'items')
        console.log('[Frontend] FULL Trend data:', JSON.stringify(dataArray, null, 2))
        
        if (dataArray && dataArray.length > 0) {
          const transformedData = dataArray.map((item: any) => {
            // Try multiple field names for value
            let value = 0
            if (typeof item.revenue === 'number') {
              value = item.revenue
            } else if (typeof item.revenue === 'string') {
              value = parseFloat(item.revenue) || 0
            } else if (typeof item.amount === 'number') {
              value = item.amount
            } else if (typeof item.amount === 'string') {
              value = parseFloat(item.amount) || 0
            } else if (typeof item.total === 'number') {
              value = item.total
            } else if (typeof item.total === 'string') {
              value = parseFloat(item.total) || 0
            } else if (typeof item.sales === 'number') {
              value = item.sales
            } else if (typeof item.sales === 'string') {
              value = parseFloat(item.sales) || 0
            }
            
            return {
              day: item.time || item.date || item.day || item.hour || '',
              value: value,
            }
          })
          setChartData(transformedData)
          
          // Calculate total revenue from trend data
          const totalRevenue = transformedData.reduce((sum, item) => sum + item.value, 0)
          setRevenue(totalRevenue.toLocaleString('vi-VN'))
          console.log('[Frontend] Total revenue calculated:', totalRevenue)
        } else {
          console.warn('[Frontend] Trend data array is empty after processing')
          setRevenue('0')
          setChartData([])
        }
      } else {
        console.warn('[Frontend] No trend data received')
        setRevenue('0')
        setChartData([])
      }

      // Process top products
      console.log('🔍 Top Products API Response:', JSON.stringify(topData, null, 2))
      if (Array.isArray(topData) && topData.length > 0) {
        // Check if returned data is mock data
        if (isMockData(topData)) {
          console.warn('⚠️ Detected mock/placeholder product data! Real data may not be available for current filters.')
        }
        
        console.log('✅ Processing top products:', topData.length, 'items')
        console.log('📝 First product:', topData[0])
        const maxRev = topData[0]?.revenue || 1
        const transformedProducts = topData.slice(0, 5).map((p: any) => ({
          name: p.productName || p.name || 'N/A',
          units: parseInt(p.quantitySold || p.unitsSold || p.units || 0),
          revenue: (p.revenue || 0).toLocaleString('vi-VN'),
          pct: Math.round(((p.revenue || 0) / maxRev) * 100),
        }))
        console.log('✅ Transformed products:', transformedProducts)
        setProducts(transformedProducts)
      } else {
        console.warn('⚠️ No top products data received. Response was:', topData)
      }

      // Process inventory
      let inventoryItems: any[] = []
      
      // Handle response format: could be array or { data: [...] }
      if (Array.isArray(invData)) {
        inventoryItems = invData
      } else if (invData && Array.isArray(invData.data)) {
        inventoryItems = invData.data
      }
      
      if (inventoryItems.length > 0) {
        console.log('Processing inventory data:', inventoryItems.length, 'items (before store filtering)')
        
        // Filter inventory items to only include items for the selected store
        // Items should have locationId matching the selected store
        const storeInventoryItems = inventoryItems.filter((i: any) => {
          // If items have locationId field, filter by it
          if (i.locationId !== undefined) {
            return i.locationId === selectedStoreId
          }
          // If no locationId field, include the item (assume it's for this store)
          return true
        })
        
        console.log(`🏪 Filtered to ${storeInventoryItems.length} items for store ${selectedStoreId}`)
        
        const lowStockItems = storeInventoryItems.filter((i: any) => {
          const qty = i.quantity || i.currentStock || i.stock || 0
          const minStock = i.minimumStock || i.reorderLevel || 10
          return qty > 0 && qty < minStock
        })
        
        const outStockItems = storeInventoryItems.filter((i: any) => {
          const qty = i.quantity || i.currentStock || i.stock || 0
          return qty === 0
        })
        
        const totalStock = storeInventoryItems.reduce((sum: number, i: any) => {
          return sum + (i.quantity || i.currentStock || i.stock || i.totalQuantity || 0)
        }, 0)
        
        console.log(`Inventory Summary: Total=${totalStock}, LowStock=${lowStockItems.length}, OutOfStock=${outStockItems.length}`)
        
        setStockCount(totalStock)
        setLowCount(lowStockItems.length)
        setOutCount(outStockItems.length)
      } else {
        console.warn('No inventory data received or empty array')
        setStockCount(0)
        setLowCount(0)
        setOutCount(0)
      }
    } catch (err) {
      console.error('Fatal error in fetchAll:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch when store, time range, or dates change
  useEffect(() => { 
    if (selectedStoreId && token) {
      fetchAll() 
    }
  }, [token, activeRange, selectedStoreId, selectedStaffId, dateFrom, dateTo])

  const handleApply = () => {
    if (activeRange === 'custom' && (!dateFrom || !dateTo)) {
      alert('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc')
      return
    }
    fetchAll()
  }

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setActiveRange('7days')
  }

  // ── Filtered products ──────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const timeOptions: { label: string; value: TimeRange }[] = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Hôm qua', value: 'yesterday' },
    { label: '7 ngày qua', value: '7days' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Tuỳ chỉnh', value: 'custom' },
  ]

  // ── KPI cards config ───────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Tổng doanh thu',
      value: revenue,
      sub: '',
      color: 'green',
      icon: DollarSign,
    },
    {
      label: 'Còn hàng',
      value: stockCount.toLocaleString('vi-VN'),
      sub: 'Sản phẩm khả dụng',
      color: 'blue',
      icon: Package,
    },
    {
      label: 'Sắp hết',
      value: String(lowCount),
      sub: 'Cần nhập thêm ngay',
      color: 'amber',
      icon: AlertTriangle,
    },
    {
      label: 'Hết hàng',
      value: String(outCount),
      sub: 'Đang tạm ngừng bán',
      color: 'red',
      icon: XCircle,
    },
  ]

  const colorMap: Record<string, { border: string; iconBg: string; iconColor: string }> = {
    green: { border: 'border-l-[#3b8c2a]', iconBg: 'bg-[#e8f5e2]', iconColor: 'text-[#3b8c2a]' },
    blue:  { border: 'border-l-[#2a6eb0]', iconBg: 'bg-[#e2edf8]', iconColor: 'text-[#2a6eb0]' },
    amber: { border: 'border-l-[#e09a1a]', iconBg: 'bg-[#fdf3de]', iconColor: 'text-[#e09a1a]' },
    red:   { border: 'border-l-[#c03030]', iconBg: 'bg-[#fce8e8]', iconColor: 'text-[#c03030]' },
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f7f2] p-5 font-['Be_Vietnam_Pro',sans-serif]">

      {/* Top bar */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1a2e10]">Doanh thu cửa hàng</h1>
          <p className="mt-0.5 text-xs text-[#7a8a6e]">
            Theo dõi doanh thu theo ngày và theo khoảng thời gian
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-[#e4edd9] bg-white px-5 py-4">
        {/* Store selection */}
        <div className="flex flex-col gap-1 relative">
          {stores.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowStoreMenu(!showStoreMenu)}
                className="min-w-[200px] rounded-lg border border-[#d4e0c8] bg-white px-4 py-2 text-sm font-semibold text-[#2d4a1a] outline-none hover:border-[#3b8c2a] focus:border-[#3b8c2a] transition flex items-center justify-between"
              >
                <span className="truncate">{selectedStore?.name || 'Chọn cửa hàng'}</span>
                <svg className={`w-4 h-4 transition-transform ${showStoreMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showStoreMenu && stores.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d4e0c8] rounded-lg shadow-lg z-10 overflow-hidden">
                  {stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id)
                        setShowStoreMenu(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                        selectedStoreId === store.id
                          ? 'bg-[#f5fdf1] text-[#3b8c2a] border-l-4 border-[#3b8c2a]'
                          : 'text-[#2d4a1a] hover:bg-[#f9fbf7]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {selectedStoreId === store.id && (
                          <span className="text-[#3b8c2a] font-bold">✓</span>
                        )}
                        {store.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {stores.length === 1 && selectedStore && (
            <div className="text-sm font-semibold text-[#2d4a1a] px-4 py-2">
              {selectedStore.name}
            </div>
          )}
        </div>

        {/* Staff selection */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
            Nhân viên
          </label>
          <button
            onClick={() => setShowStaffMenu(!showStaffMenu)}
            className="rounded-lg border border-[#d4e0c8] bg-white px-4 py-2 text-sm font-semibold text-[#2d4a1a] outline-none hover:border-[#3b8c2a] focus:border-[#3b8c2a] transition flex items-center justify-between"
          >
            <span className="truncate">
              {selectedStaffId 
                ? staffList.find(s => s.id === selectedStaffId)?.name || 'Chọn nhân viên'
                : 'Tất cả nhân viên'}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showStaffMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          
          {/* Staff Dropdown menu */}
          {showStaffMenu && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d4e0c8] rounded-lg shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedStaffId('')
                  setShowStaffMenu(false)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                  !selectedStaffId
                    ? 'bg-[#f5fdf1] text-[#3b8c2a] border-l-4 border-[#3b8c2a]'
                    : 'text-[#2d4a1a] hover:bg-[#f9fbf7]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {!selectedStaffId && <span className="text-[#3b8c2a] font-bold">✓</span>}
                  Tất cả nhân viên
                </span>
              </button>
              {staffList.map(staff => (
                <button
                  key={staff.id}
                  onClick={() => {
                    setSelectedStaffId(staff.id)
                    setShowStaffMenu(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition ${
                    selectedStaffId === staff.id
                      ? 'bg-[#f5fdf1] text-[#3b8c2a] border-l-4 border-[#3b8c2a]'
                      : 'text-[#2d4a1a] hover:bg-[#f9fbf7]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {selectedStaffId === staff.id && (
                      <span className="text-[#3b8c2a] font-bold">✓</span>
                    )}
                    {staff.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time tabs */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
            Khoảng thời gian
          </label>
          <div className="flex gap-1.5">
            {timeOptions.map(t => (
              <button
                key={t.value}
                onClick={() => setActiveRange(t.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeRange === t.value
                    ? 'bg-[#3b8c2a] text-white'
                    : 'bg-[#f0f4eb] text-[#6a7c5a] hover:bg-[#e4edda]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date pickers */}
        {activeRange === 'custom' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-xs text-[#4a6040] outline-none focus:border-[#3b8c2a]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="rounded-lg border border-[#d4e0c8] px-3 py-1.5 text-xs text-[#4a6040] outline-none focus:border-[#3b8c2a]"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#d4e0c8] bg-[#f0f4eb] px-4 py-1.5 text-xs font-semibold text-[#6a7c5a] transition hover:bg-[#e4edda]"
          >
            <RefreshCw size={12} />
            Đặt lại
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-[#3b8c2a] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2f7020]"
          >
            <Check size={12} />
            Áp dụng
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(card => {
          const c = colorMap[card.color]
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl border border-[#e4edd9] bg-white p-4 border-l-4 ${c.border}`}
            >
              <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${c.iconBg}`}>
                <Icon size={17} className={c.iconColor} />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7a8a6e]">
                {card.label}
              </p>
              <p className="mb-1.5 text-xl font-bold leading-none text-[#1a2e10]">{card.value}</p>
              <p className="text-[11px] text-[#9aaa8e]">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Chart + Products grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Revenue Chart */}
        <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a2e10]">Biểu đồ xu hướng doanh thu</h2>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-[#7a8a6e]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#3b8c2a]" />
              Doanh thu thực tế
            </span>
          </div>
          <div className="h-56">
            <RevenueChart chartData={chartData} />
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-xl border border-[#e4edd9] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1a2e10]">Top 5 sản phẩm bán chạy nhất</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-[#d4e0c8] px-2.5 py-1.5">
              <Search size={12} className="text-[#9aaa8e]" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-32 border-none bg-transparent text-xs text-[#4a6040] outline-none placeholder:text-[#b8c8aa]"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eef2e9]">
                <th className="pb-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Tên sản phẩm
                </th>
                <th className="pb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Số lượng đã bán
                </th>
                <th className="pb-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[#9aaa8e]">
                  Tổng doanh thu
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4f7f0]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-[#9aaa8e]">
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-[#9aaa8e]">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, i) => (
                  <tr key={i} className="transition hover:bg-[#fafcf8]">
                    <td className="py-2.5 text-[13px] text-[#2d4a1a]">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-[#eef5e9] text-[11px] font-bold text-[#5a8a40]">
                        {i + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef2e9]">
                          <div
                            className="h-full rounded-full bg-[#3b8c2a]"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                        <span className="min-w-[36px] text-right text-xs font-semibold text-[#3b8c2a]">
                          {p.units.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-[13px] font-semibold text-[#1a2e10]">
                      {p.revenue}₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-center text-[10px] text-[#b8c8aa]">
        © 2025 Hệ thống quản lý bán lẻ. Bảng điều khiển quản trị viên.
      </p>
    </div>
  )
}