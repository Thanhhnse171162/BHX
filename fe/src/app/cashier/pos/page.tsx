'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Search, Scan, Plus, Minus, Trash2, CreditCard,
  Banknote, Wallet, X, ChevronRight, Package,
  ShoppingCart, RotateCcw, Receipt,
} from 'lucide-react'
import { ProductAPIService, ProductFromAPI } from '@/services/product-api.service'
import { InventoryAPIService, InventoryItem } from '@/services/inventory-api.service'
import { useAuthStore } from '@/store/auth.store'

interface Product {
  id: string
  sku: string
  name: string
  price: number
  category: string
  emoji: string
  imageUrl?: string | null
}

interface CartItem extends Product {
  qty: number
}

interface SimpleSaleResponse {
  saleId: string
  saleNumber: string
  subtotal: number
  totalAmount: number
  paymentMethod: 'CASH' | 'MOMO' | string
  status: string
  paymentStatus: string
  saleDate: string
  momoPayUrl?: string
  momoQrUrl?: string
  paymentId?: string
}

interface InvoicePrintItem {
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface InvoicePrintData {
  saleId: string
  saleNumber: string
  saleDate: string
  storeId: string
  cashierId: string
  paymentStatus: string
  paymentMethod: string
  items: InvoicePrintItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
}

const DEFAULT_POS_STORE_ID = 'B0000001-0001-0001-0001-000000000001'
const DEFAULT_POS_CASHIER_ID = '33333333-3333-3333-3333-333333333331'
const DEFAULT_IMAGE = '/default-product.png'

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isGuid = (value: unknown): value is string =>
  typeof value === 'string' && GUID_REGEX.test(value.trim())

const extractApiErrorMessage = (result: unknown): string => {
  if (!result) return 'Không thể tạo đơn thanh toán POS'
  const r = result as Record<string, unknown>
  const directMessage =
    (r?.error as Record<string, unknown>)?.message ?? r?.error ?? r?.message ?? r?.title
  if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  const errors = r?.errors
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors as object)[0]
    const firstVal = firstKey ? (errors as Record<string, unknown>)[firstKey] : null
    if (Array.isArray(firstVal) && firstVal.length > 0) return String(firstVal[0])
    if (typeof firstVal === 'string' && firstVal.trim()) return firstVal
  }
  return 'Không thể tạo đơn thanh toán POS'
}

const normalizeSalePayload = (payload: unknown): Record<string, unknown> | null => {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  if (p.data && typeof p.data === 'object') return p.data as Record<string, unknown>
  return p
}

const isPaymentCompleted = (payload: unknown): boolean => {
  const sale = normalizeSalePayload(payload)
  const status = String(sale?.paymentStatus ?? sale?.status ?? '').trim().toUpperCase()
  return ['PAID', 'COMPLETED', 'COMPLETE', 'SUCCESS', 'SUCCEEDED', 'SUCCESSFUL'].includes(status)
}

const EMOJI_BY_CATEGORY: Record<string, string> = {
  'Nước uống': '🥤', 'Thực phẩm': '🍜', 'Bánh kẹo': '🍪',
  Snack: '🍟', Sữa: '🥛', 'Gia dụng': '🧴', 'Vệ sinh': '🧼',
}

const emojiFromText = (name: string, category: string): string => {
  const text = `${name} ${category}`.toLowerCase()
  if (text.includes('nước') || text.includes('soda') || text.includes('coca')) return '🥤'
  if (text.includes('sữa') || text.includes('yogurt')) return '🥛'
  if (text.includes('bánh') || text.includes('kẹo')) return '🍪'
  if (text.includes('snack') || text.includes('chips')) return '🍟'
  if (text.includes('mì')) return '🍜'
  if (text.includes('trứng')) return '🥚'
  if (text.includes('xúc xích')) return '🌭'
  if (text.includes('xà phòng') || text.includes('rửa')) return '🧼'
  return EMOJI_BY_CATEGORY[category] ?? '📦'
}

function mapApiProductToPOS(p: ProductFromAPI & Record<string, unknown>): Product {
  const sku = (p.barcode ?? p.sku ?? p.id) as string
  const category = (p.categoryName ?? 'Khác') as string
  let imageUrl: string | null =
    (p.imageUrl as string | null) ?? null
  if (!imageUrl && typeof p.images === 'string') {
    try {
      const arr = JSON.parse(p.images)
      if (Array.isArray(arr) && arr.length > 0) imageUrl = arr[0] as string
    } catch {}
  }
  if (!imageUrl) {
    imageUrl =
      (p.image_url as string | null) ??
      (p.mainImage as string | null) ??
      (p.thumbnail as string | null) ??
      null
  }
  return {
    id: p.id,
    sku,
    name: p.name,
    price: (p.price as number) ?? 0,
    category,
    emoji: emojiFromText(p.name, category),
    imageUrl,
  }
}

function mapInventoryToPOS(item: InventoryItem): Product {
  const product = item.product as Record<string, unknown> | undefined
  const id = item.productId || item.id
  const name =
    (product?.name as string) ||
    item.productName || item.name || item.sku || item.barcode ||
    `Product ${id.substring(0, 8)}`
  const sku = (product?.barcode as string) || (product?.sku as string) || item.barcode || item.sku || id
  const category = (product?.categoryName as string) || item.categoryName || 'Khác'
  const price = (product?.price as number) || item.price || 0
  const imageUrl =
    (product?.imageUrl as string | null) ??
    (product?.image_url as string | null) ??
    null
  return {
    id, sku, name, price, category,
    emoji: emojiFromText(name, category),
    imageUrl,
  }
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tiền mặt', icon: Banknote },
  { id: 'momo', label: 'MoMo',     icon: Wallet   },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const openInvoicePrintView = (invoice: InvoicePrintData, storeName: string, cashierName: string) => {
  if (typeof window === 'undefined') return

  const paid = String(invoice.paymentStatus || '').toUpperCase() === 'PAID'
  const saleDate = new Date(invoice.saleDate)
  const dateText = Number.isNaN(saleDate.getTime()) ? invoice.saleDate : saleDate.toLocaleDateString('vi-VN')
  const timeText = Number.isNaN(saleDate.getTime()) ? '' : saleDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  const rows = invoice.items.map((p) => `
    <tr>
      <td>
        <div class="product-name">${escapeHtml(p.productName)}</div>
        <div class="sku">SKU: ${escapeHtml(p.sku)}</div>
      </td>
      <td class="center">${p.quantity}</td>
      <td class="right">${fmt(p.unitPrice)}</td>
      <td class="right">${fmt(p.lineTotal)}</td>
    </tr>
  `).join('')

  const qrValue = encodeURIComponent(invoice.saleNumber)
  const qrUrl = `https://quickchart.io/qr?text=${qrValue}&size=170`

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hoa don ${escapeHtml(invoice.saleNumber)}</title>
  <style>
    :root { --green:#006a4e; --green2:#0a7d57; --gray:#f3f4f6; --text:#1f2937; --muted:#6b7280; --yellow:#f7be00; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; background:#efefef; color:var(--text); }
    .topbar { background:var(--green); color:#ffd44d; font-weight:900; font-style:italic; padding:10px 14px; font-size:20px; letter-spacing:.3px; }
    .sheet-wrap { padding:18px; display:flex; justify-content:center; }
    .sheet { width:420px; background:#fff; border-radius:6px; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.12); }
    .header { padding:18px 18px 10px; border-bottom:1px solid #ececec; }
    .title-row { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .brand { color:var(--green2); font-weight:900; font-size:34px; line-height:1; letter-spacing:.2px; }
    .meta-small { color:var(--muted); font-size:11px; margin-top:5px; }
    .badge { background:#dff7ea; color:#1f9d63; border:1px solid #bce9d1; border-radius:999px; font-size:11px; padding:3px 8px; font-weight:700; display:inline-block; }
    .code { font-size:20px; font-weight:700; margin-top:8px; }
    .grid2 { margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:8px 20px; font-size:11px; color:var(--muted); }
    .grid2 b { color:#111827; font-weight:700; }
    .content { padding:14px 18px 0; }
    .section-title { font-size:13px; font-weight:800; margin-bottom:8px; color:#374151; }
    .table { width:100%; border-collapse:collapse; font-size:12px; }
    .table th { text-align:left; background:#f7f7f7; color:#6b7280; font-weight:700; font-size:10px; padding:8px; border:1px solid #ebebeb; text-transform:uppercase; }
    .table td { padding:9px 8px; border:1px solid #efefef; vertical-align:top; }
    .table .center { text-align:center; }
    .table .right { text-align:right; }
    .product-name { font-weight:700; color:#1f2937; }
    .sku { font-size:10px; color:#9ca3af; margin-top:2px; }
    .totals { margin-top:0; background:var(--yellow); padding:14px 18px; }
    .totals .line { display:flex; justify-content:space-between; color:#3b3b3b; font-size:14px; margin:4px 0; }
    .totals .sum { display:flex; justify-content:space-between; margin-top:8px; font-size:30px; font-weight:900; color:#1e1e1e; }
    .qr-wrap { text-align:center; padding:20px 16px 12px; }
    .qr-box { display:inline-flex; border:1px solid #ddd; padding:8px; background:#fff; }
    .qr-box img { width:120px; height:120px; display:block; }
    .footer-note { font-size:11px; color:#6b7280; margin-top:8px; }
    @media print {
      body { background:#fff; }
      .topbar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { box-shadow:none; width:100%; }
      .totals { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet-wrap { padding:0; }
    }
  </style>
</head>
<body>
  <div class="topbar">BACH HOA XANH</div>
  <div class="sheet-wrap">
    <div class="sheet">
      <div class="header">
        <div class="title-row">
          <div>
            <div class="brand">BACH HOA XANH</div>
            <div class="meta-small">CUA HANG<br>${escapeHtml(storeName)}</div>
          </div>
          <div style="text-align:right">
            <div class="badge">${paid ? 'DA THANH TOAN' : 'CHUA THANH TOAN'}</div>
            <div class="meta-small" style="margin-top:8px">SO HOA DON</div>
            <div class="code">${escapeHtml(invoice.saleNumber)}</div>
          </div>
        </div>
        <div class="grid2">
          <div><span>THOI GIAN GIAO DICH</span><br><b>${escapeHtml(`${dateText} ${timeText}`.trim())}</b></div>
          <div><span>SALE ID</span><br><b>${escapeHtml(invoice.saleId)}</b></div>
          <div><span>NHAN VIEN (CASHIER)</span><br><b>${escapeHtml(cashierName)}</b></div>
          <div><span>PHUONG THUC THANH TOAN</span><br><b>${escapeHtml(String(invoice.paymentMethod || '').toUpperCase())}</b></div>
        </div>
      </div>
      <div class="content">
        <div class="section-title">Chi tiet gio hang</div>
        <table class="table">
          <thead>
            <tr>
              <th>SAN PHAM / SKU</th>
              <th class="center">SL</th>
              <th class="right">DON GIA</th>
              <th class="right">THANH TIEN</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <div class="totals">
        <div class="line"><span>Tam tinh:</span><b>${fmt(invoice.subtotal || 0)}</b></div>
        <div class="line"><span>Giam gia:</span><b>${fmt(invoice.discount || 0)}</b></div>
        <div class="line"><span>Thue (VAT):</span><b>${fmt(invoice.tax || 0)}</b></div>
        <div class="sum"><span>TONG THANH TOAN</span><span>${fmt(invoice.total || 0)}</span></div>
      </div>
      <div class="qr-wrap">
        <div class="qr-box"><img src="${qrUrl}" alt="QR" /></div>
        <div class="footer-note">Cam on quy khach da mua sam tai Bach Hoa Xanh.</div>
      </div>
    </div>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=520,height=900')
  if (!printWindow) return
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
  }, 350)
}

// ✅ ProductImage — tự fallback, tránh onError loop
function ProductImage({
  src,
  alt,
  className,
  size = 56,
}: {
  src?: string | null
  alt: string
  className?: string
  size?: number
}) {
  const [errored, setErrored] = useState(false)
  const imgSrc = !src || errored ? DEFAULT_IMAGE : src
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      unoptimized
      onError={() => setErrored(true)}
    />
  )
}

export default function POSPage() {
  const { user, hydrated } = useAuthStore()

  const [products, setProducts]               = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productError, setProductError]       = useState<string | null>(null)
  const [query, setQuery]                     = useState('')
  const [category, setCategory]               = useState('Tất cả')
  const [cart, setCart]                       = useState<CartItem[]>([])
  const [payMethod, setPayMethod]             = useState('cash')
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError]       = useState<string | null>(null)
  const [paymentResult, setPaymentResult]     = useState<SimpleSaleResponse | null>(null)
  const [paymentDisplayStatus, setPaymentDisplayStatus] = useState<'PENDING' | 'COMPLETE' | 'PAID' | null>(null)
  const [isPollingPayment, setIsPollingPayment] = useState(false)
  const [scanning, setScanning]               = useState(false)
  const [scanValue, setScanValue]             = useState('')
  const scanRef                               = useRef<HTMLInputElement>(null)
  const orderNumber                           = useRef(`#${Math.floor(10000 + Math.random() * 90000)}`)

  // ✅ Initialize state from sessionStorage (persist payment state across navigation)
  useEffect(() => {
    if (!hydrated) return
    try {
      const savedState = sessionStorage.getItem('pos_payment_state')
      if (savedState) {
        const state = JSON.parse(savedState)
        if (state.paymentResult) setPaymentResult(state.paymentResult)
        if (state.paymentDisplayStatus) setPaymentDisplayStatus(state.paymentDisplayStatus)
        if (state.cart && Array.isArray(state.cart) && state.cart.length > 0) setCart(state.cart)
      }
    } catch (e) {
      console.error('Failed to restore payment state:', e)
    }
  }, [hydrated])

  // ✅ Persist payment state to sessionStorage whenever it changes
  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem('pos_payment_state', JSON.stringify({
        paymentResult,
        paymentDisplayStatus,
        cart,
      }))
    } catch (e) {
      console.error('Failed to persist payment state:', e)
    }
  }, [paymentResult, paymentDisplayStatus, cart, hydrated])

  // Fetch products
  useEffect(() => {
    if (!hydrated) return
    let cancelled = false
    setLoadingProducts(true)
    setProductError(null)

    const fetchProducts = async (): Promise<Product[]> => {
      if (!user?.workplaceType || !user?.workplaceId) {
        throw new Error('Tài khoản chưa có thông tin cửa hàng (workplace). Vui lòng đăng xuất và đăng nhập lại.')
      }
      if (user.workplaceType !== 'STORE') {
        throw new Error('Tài khoản này không thuộc cửa hàng (STORE), không thể xem danh sách sản phẩm POS.')
      }
      const inventoryData = await InventoryAPIService.getInventoryByLocation('STORE', user.workplaceId)
      let productsData: ProductFromAPI[] = []
      try { productsData = await ProductAPIService.getAllProducts() } catch { productsData = [] }
      const productMap = new Map<string, ProductFromAPI>()
      productsData.forEach((p) => productMap.set(p.id, p))
      return inventoryData.map((item) => {
        const product = productMap.get(item.productId)
        return product
          ? mapApiProductToPOS(product as ProductFromAPI & Record<string, unknown>)
          : mapInventoryToPOS(item)
      })
    }

    fetchProducts()
      .then((data) => { if (!cancelled) setProducts(data) })
      .catch((err: Error) => {
        if (!cancelled) {
          setProducts([])
          const e = err as unknown as Record<string, unknown>
          setProductError(
            ((e?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.error as string
            || err?.message
            || 'Không thể tải danh sách sản phẩm'
          )
        }
      })
      .finally(() => { if (!cancelled) setLoadingProducts(false) })

    return () => { cancelled = true }
  }, [hydrated, user?.workplaceId, user?.workplaceType])

  useEffect(() => { if (scanning) scanRef.current?.focus() }, [scanning])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); setScanning(true) }
      if (e.key === 'Escape') setScanning(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const addToCart = useCallback((p: Product) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === p.id)
      if (ex) return prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...prev, { ...p, qty: 1 }]
    })
  }, [])

  const changeQty  = (id: string, delta: number) =>
    setCart(prev => prev.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0))
  const removeItem = (id: string) => setCart(prev => prev.filter(x => x.id !== id))
  const clearOrder = () => {
    setCart([])
    setPaymentError(null)
    setPaymentResult(null)
    setPaymentDisplayStatus(null)
    // ✅ Also clear sessionStorage when clearing order
    try {
      sessionStorage.removeItem('pos_payment_state')
    } catch (e) {
      console.error('Failed to clear payment state from sessionStorage:', e)
    }
  }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = scanValue.trim().replace(/^#/, '')
    const found = products.find(p => {
      const skuNorm = p.sku.replace(/^#/, '')
      return p.sku === scanValue || p.id === scanValue || skuNorm === normalized
    })
    if (found) addToCart(found)
    setScanValue('')
    setScanning(false)
  }

  const subTotal  = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const total     = subTotal
  const cartCount = cart.reduce((s, x) => s + x.qty, 0)
  const categories = ['Tất cả', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const filtered = products.filter(p => {
    const matchCat = category === 'Tất cả' || p.category === category
    const matchQ   = p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.includes(query)
    return matchCat && matchQ
  })

  // MoMo polling
  useEffect(() => {
    if (!paymentResult?.saleId || paymentResult.paymentMethod !== 'MOMO' || paymentDisplayStatus !== 'PENDING') return
    let cancelled = false
    setIsPollingPayment(true)

    const poll = async () => {
      try {
        const token = useAuthStore.getState().token
        const res = await fetch(`/api/sales/${paymentResult.saleId}?_ts=${Date.now()}`, {
          method: 'GET', cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return
        const latest = await res.json().catch(() => null) as unknown
        if (!latest || cancelled) return
        const latestSale = normalizeSalePayload(latest)
        setPaymentResult(prev => prev ? {
          ...prev,
          status: (latestSale?.status as string) ?? prev.status,
          paymentStatus: (latestSale?.paymentStatus as string) ?? prev.paymentStatus,
        } : prev)
        if (isPaymentCompleted(latest)) {
          setPaymentDisplayStatus('COMPLETE')
          // ✅ Clear cart when payment is confirmed completed
          setCart([])
          setIsPollingPayment(false)
        }
      } catch { /* keep polling silently */ }
    }

    poll()
    const timer = window.setInterval(poll, 3000)
    return () => { cancelled = true; setIsPollingPayment(false); window.clearInterval(timer) }
  }, [paymentDisplayStatus, paymentResult?.paymentMethod, paymentResult?.saleId])

  const getCashierId = (): string => {
    const candidates = [
      user?.id,
      process.env.NEXT_PUBLIC_POS_CASHIER_ID,
      DEFAULT_POS_CASHIER_ID,
    ]
    return (candidates.find(v => isGuid(v)) as string) || ''
  }

  const getStoreId = (): string => {
    const candidates = [
      user?.workplaceType === 'STORE' ? user?.workplaceId : null,
      user?.storeId,
      user?.storeLocationId,
      process.env.NEXT_PUBLIC_POS_STORE_ID,
      DEFAULT_POS_STORE_ID,
    ]
    return (candidates.find(v => isGuid(v)) as string) || ''
  }

  const buildPrintData = (): InvoicePrintData | null => {
    if (paymentResult) {
      // Print from completed sale
      return {
        saleId: paymentResult.saleId,
        saleNumber: paymentResult.saleNumber,
        saleDate: paymentResult.saleDate,
        storeId: getStoreId(),
        cashierId: getCashierId(),
        paymentStatus: paymentResult.paymentStatus || '',
        paymentMethod: paymentResult.paymentMethod || 'CASH',
        items: cart.map(item => ({
          productName: item.name,
          sku: item.sku,
          quantity: item.qty,
          unitPrice: item.price,
          lineTotal: item.price * item.qty,
        })),
        subtotal: paymentResult.subtotal,
        discount: 0,
        tax: 0,
        total: paymentResult.totalAmount,
      }
    }

    if (cart.length === 0) return null

    // Print from current cart
    const subTotal = cart.reduce((s, x) => s + x.price * x.qty, 0)
    return {
      saleId: '',
      saleNumber: orderNumber.current,
      saleDate: new Date().toISOString(),
      storeId: getStoreId(),
      cashierId: getCashierId(),
      paymentStatus: 'PENDING',
      paymentMethod: payMethod === 'momo' ? 'MOMO' : 'CASH',
      items: cart.map(item => ({
        productName: item.name,
        sku: item.sku,
        quantity: item.qty,
        unitPrice: item.price,
        lineTotal: item.price * item.qty,
      })),
      subtotal: subTotal,
      discount: 0,
      tax: 0,
      total: subTotal,
    }
  }

  const handlePrintInvoice = () => {
    const printData = buildPrintData()
    if (!printData) return
    
    const storeId = getStoreId()
    const storeName = storeId || 'Cửa hàng'
    const cashierName = user?.name || 'Thu ngân'
    
    openInvoicePrintView(printData, storeName, cashierName)
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || submittingPayment) return
    const storeId   = getStoreId()
    const cashierId = getCashierId()
    if (!storeId || !cashierId) {
      setPaymentError('Thiếu thông tin cửa hàng hoặc thu ngân. Vui lòng đăng nhập lại.')
      return
    }
    setSubmittingPayment(true)
    setPaymentError(null)
    setPaymentResult(null)
    setPaymentDisplayStatus(null)
    try {
      const paymentMethod = payMethod === 'momo' ? 'MOMO' : 'CASH'
      const token = useAuthStore.getState().token
      const response = await fetch('/api/sales/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          storeId, cashierId, paymentMethod,
          items: cart.map(item => ({ productId: item.id, quantity: item.qty })),
          notes: `POS payment via ${paymentMethod}`,
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(extractApiErrorMessage(result))
      const sale = result as SimpleSaleResponse
      setPaymentResult(sale)
      const displayStatus = paymentMethod === 'MOMO'
        ? (isPaymentCompleted(sale) ? 'COMPLETE' : 'PENDING')
        : 'PAID'
      setPaymentDisplayStatus(displayStatus)
      // ✅ Only clear cart if payment is immediately complete (CASH) or already paid
      if (displayStatus !== 'PENDING') {
        setCart([])
      }
    } catch (err: unknown) {
      setPaymentError((err as Error)?.message || 'Không thể thanh toán. Vui lòng thử lại.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">

      {/* ════ LEFT — Product catalogue ════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
          <div className="flex-shrink-0">
            <p className="text-base font-bold text-gray-900 leading-tight">Bách Hóa Xanh</p>
            <p className="text-xs text-green-600 font-semibold">POS Bán hàng</p>
          </div>
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Scan className="w-4 h-4" />
            Quét mã
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-green-500 rounded font-mono tracking-wide">F2</kbd>
          </button>
          <div className="relative flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-gray-500" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-0 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                category === cat
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">

            {/* Barcode scan tile */}
            <button
              onClick={() => setScanning(true)}
              className="bg-white border-2 border-dashed border-green-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-500 transition-all group cursor-pointer min-h-[130px]"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Scan className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-700 text-center leading-tight">Quét mã barcode</span>
              <span className="text-[10px] text-green-500 font-mono">F2</span>
            </button>

            {loadingProducts && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
                <p className="text-base">Đang tải sản phẩm...</p>
              </div>
            )}

            {!loadingProducts && productError && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-red-500">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-base font-semibold">Không thể tải sản phẩm</p>
                <p className="text-xs mt-1 text-red-400">{productError}</p>
              </div>
            )}

            {!loadingProducts && !productError && filtered.map(p => {
              const inCart = cart.find(x => x.id === p.id)
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white rounded-2xl p-3 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-green-400 transition-all group relative border border-gray-100 select-none"
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="h-14 flex items-center justify-center mb-2">
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-14 h-14 object-contain rounded-xl border border-gray-100 bg-gray-50"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mt-0.5 line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-green-600 mt-1.5">{fmt(p.price)}</p>
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )
            })}

            {!loadingProducts && !productError && filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-base">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ RIGHT — Cart + Payment ════ */}
      <div className="w-[360px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col shadow-xl">

        {/* Order header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <p className="text-xs text-gray-400 font-medium">Số đơn hàng</p>
            <p className="text-lg font-bold text-gray-900 tracking-wide">{orderNumber.current}</p>
          </div>
          <button
            onClick={clearOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors text-xs font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Xóa đơn
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 py-10">
              <ShoppingCart className="w-14 h-14 mb-3 opacity-30" />
              <p className="text-base font-medium text-gray-400">Giỏ hàng trống</p>
              <p className="text-xs mt-1 text-gray-300">Chọn hoặc quét sản phẩm để thêm</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 group transition-colors">
                  {/* ✅ Ảnh thay vì emoji */}
                  <div className="flex-shrink-0 w-10 h-10">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      size={40}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 bg-gray-50"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-green-600 font-bold mt-0.5">{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                    <button
                      onClick={() => changeQty(item.id, +1)}
                      className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <p className="text-xs font-bold text-gray-800 w-[52px] text-right flex-shrink-0">
                    {fmt(item.price * item.qty)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment panel */}
        <div className="border-t border-gray-100 px-5 pt-3 pb-5 space-y-3 bg-gray-50/50">

          {/* Summary */}
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs border border-gray-100 shadow-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span className="font-medium">{fmt(subTotal)}</span>
            </div>
            <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-green-700 text-base">{fmt(total)}</span>
            </div>

            {paymentDisplayStatus !== null && (
              <div className="pt-1.5 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Trạng thái thanh toán</span>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                  paymentDisplayStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {paymentDisplayStatus}
                </span>
              </div>
            )}

            {paymentDisplayStatus === 'PENDING' && isPollingPayment && (
              <p className="text-[11px] text-yellow-700 font-medium">Đang kiểm tra thanh toán MoMo...</p>
            )}

            {paymentResult?.saleNumber && (
              <div className="text-[11px] text-gray-500">Mã đơn: {paymentResult.saleNumber}</div>
            )}

            {/* ✅ FIX: thêm <a> tag đầy đủ — đây là lỗi chính ts(1128) */}
            {paymentResult?.paymentMethod === 'MOMO'
              && paymentResult?.momoPayUrl
              && paymentDisplayStatus === 'PENDING'
              && (
                <a
                  href={paymentResult.momoPayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full mt-1 px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Mở MoMo để thanh toán
                </a>
              )
            }

            {paymentError && (
              <p className="text-[11px] text-red-600 font-medium">{paymentError}</p>
            )}
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phương thức thanh toán</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPayMethod(pm.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-medium transition-all ${
                      payMethod === pm.id
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${payMethod === pm.id ? 'text-green-600' : ''}`} />
                    <span className="leading-tight text-center">{pm.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Print */}
          <div>
            <button
              disabled={cart.length === 0 && !paymentResult}
              onClick={handlePrintInvoice}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-xl text-xs text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              In hóa đơn
            </button>
          </div>

          {/* Checkout button */}
          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            {submittingPayment
              ? 'Đang xử lý...'
              : cart.length === 0
                ? 'Thanh toán ngay'
                : `Thanh toán — ${fmt(total)}`
            }
          </button>
        </div>
      </div>

      {/* ════ BARCODE SCANNER MODAL ════ */}
      {scanning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Scan className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Quét mã barcode</h3>
                  <p className="text-xs text-gray-500">Hướng camera vào mã vạch sản phẩm</p>
                </div>
              </div>
              <button
                onClick={() => { setScanning(false); setScanValue('') }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="w-full h-48 bg-gray-900 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/20" />
              <div className="w-52 h-36 border-2 border-green-400 rounded-xl relative">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-green-400 rounded-br-lg" />
                <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
              </div>
              <p className="absolute bottom-3 text-green-400 text-xs font-medium tracking-wide">Đang quét...</p>
            </div>
            <form onSubmit={handleBarcodeScan} className="space-y-3">
              <div className="relative">
                <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={scanRef}
                  value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  placeholder="Nhập hoặc quét mã... (vd: 001 hoặc #001)"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50 border-2 border-gray-200 focus:border-green-500 rounded-xl focus:outline-none transition-colors"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                Xác nhận & thêm vào giỏ
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-[10px] text-gray-600">Esc</kbd> để đóng
            </p>
          </div>
        </div>
      )}
    </div>
  )
}