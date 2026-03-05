'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Scan, Plus, Minus, Trash2, Tag, CreditCard,
  Banknote, QrCode, Wallet, X, ChevronRight, Package,
  ShoppingCart, RotateCcw, User, Receipt,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string
  sku: string
  name: string
  price: number
  category: string
  emoji: string
}

interface CartItem extends Product {
  qty: number
}

// ─── Mock product catalogue ───────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: '001', sku: '#001', name: 'Nước suối Lavie 500ml',   price: 6000,  category: 'Nước uống', emoji: '🍶' },
  { id: '002', sku: '#002', name: 'Coca-Cola 330ml',          price: 12000, category: 'Nước uống', emoji: '🥤' },
  { id: '003', sku: '#003', name: 'Trà Xanh 0 độ',            price: 10000, category: 'Nước uống', emoji: '🍵' },
  { id: '004', sku: '#004', name: 'Sữa Vinamilk 180ml',       price: 8000,  category: 'Sữa',       emoji: '🥛' },
  { id: '005', sku: '#005', name: 'Nước cam Vfresh',          price: 15000, category: 'Nước uống', emoji: '🍊' },
  { id: '006', sku: '#006', name: 'Mì Hảo Hảo tôm chua',     price: 5000,  category: 'Thực phẩm', emoji: '🍜' },
  { id: '007', sku: '#007', name: 'Bánh Kinh Đô',             price: 25000, category: 'Bánh kẹo',  emoji: '🍪' },
  { id: '008', sku: '#008', name: 'Kẹo dẻo Trolli',           price: 18000, category: 'Bánh kẹo',  emoji: '🍬' },
  { id: '009', sku: '#009', name: "Snack Lay's vị phô mai",   price: 22000, category: 'Snack',     emoji: '🍟' },
  { id: '010', sku: '#010', name: 'Bim bim Oishi',            price: 10000, category: 'Snack',     emoji: '🟡' },
  { id: '011', sku: '#011', name: 'Xúc xích Đức Việt',       price: 35000, category: 'Thực phẩm', emoji: '🌭' },
  { id: '012', sku: '#012', name: 'Trứng gà ta (vỉ 10)',     price: 48000, category: 'Thực phẩm', emoji: '🥚' },
  { id: '013', sku: '#013', name: 'Bánh mì sandwich',         price: 18000, category: 'Bánh kẹo',  emoji: '🍞' },
  { id: '014', sku: '#014', name: 'Sữa chua Vinamilk',        price: 8500,  category: 'Sữa',       emoji: '🥣' },
  { id: '015', sku: '#015', name: 'Phô mai Laughing Cow',     price: 42000, category: 'Sữa',       emoji: '🧀' },
  { id: '016', sku: '#016', name: 'Dầu ăn Tường An 1L',      price: 62000, category: 'Gia dụng',  emoji: '🫙' },
  { id: '017', sku: '#017', name: 'Nước mắm Phú Quốc',       price: 38000, category: 'Gia dụng',  emoji: '🍶' },
  { id: '018', sku: '#018', name: 'Bột ngọt Ajinomoto',      price: 15000, category: 'Gia dụng',  emoji: '🧂' },
  { id: '019', sku: '#019', name: 'Kem đánh răng P/S',        price: 32000, category: 'Vệ sinh',   emoji: '🪥' },
  { id: '020', sku: '#020', name: 'Dầu gội Sunsilk',          price: 55000, category: 'Vệ sinh',   emoji: '🧴' },
  { id: '021', sku: '#021', name: 'Xà phòng Lifebuoy',        price: 22000, category: 'Vệ sinh',   emoji: '🧼' },
  { id: '022', sku: '#022', name: 'Túi nylon đen 1kg',        price: 18000, category: 'Gia dụng',  emoji: '🛍️' },
  { id: '023', sku: '#023', name: 'Khăn giấy Kleenex',        price: 28000, category: 'Vệ sinh',   emoji: '🧻' },
  { id: '024', sku: '#024', name: 'Nước rửa chén Sunlight',   price: 35000, category: 'Gia dụng',  emoji: '🫧' },
  { id: '025', sku: '#025', name: 'Bột giặt OMO 450g',        price: 62000, category: 'Gia dụng',  emoji: '🧺' },
]

const CATEGORIES = ['Tất cả', 'Nước uống', 'Thực phẩm', 'Bánh kẹo', 'Snack', 'Sữa', 'Gia dụng', 'Vệ sinh']

const PAYMENT_METHODS = [
  { id: 'cash',    label: 'Tiền mặt',      icon: Banknote    },
  { id: 'card',    label: 'Thẻ ngân hàng', icon: CreditCard  },
  { id: 'qr',      label: 'QR Code',        icon: QrCode      },
  { id: 'ewallet', label: 'Ví điện tử',    icon: Wallet      },
]

const PROMOS = [
  { id: 'p1', label: 'Giảm 5% đơn hàng',     discount: 0.05,  type: 'percent' as const },
  { id: 'p2', label: 'Tặng 1 chai nước',      discount: 0,     type: 'gift'    as const },
  { id: 'p3', label: 'Giảm 10.000đ',          discount: 10000, type: 'fixed'   as const },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)

export default function POSPage() {
  const [query, setQuery]                   = useState('')
  const [category, setCategory]             = useState('Tất cả')
  const [cart, setCart]                     = useState<CartItem[]>([])
  const [voucher, setVoucher]               = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [payMethod, setPayMethod]           = useState('cash')
  const [selectedPromo, setSelectedPromo]   = useState<string | null>(null)
  const [scanning, setScanning]             = useState(false)
  const [scanValue, setScanValue]           = useState('')
  const scanRef                             = useRef<HTMLInputElement>(null)
  const orderNumber                         = useRef(`#${Math.floor(10000 + Math.random() * 90000)}`)

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

  const changeQty = (id: string, delta: number) =>
    setCart(prev => prev.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0))

  const removeItem  = (id: string) => setCart(prev => prev.filter(x => x.id !== id))
  const clearOrder  = () => { setCart([]); setVoucher(''); setVoucherApplied(false); setSelectedPromo(null) }

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault()
    const found = PRODUCTS.find(p => p.sku === scanValue || p.id === scanValue || p.sku === `#${scanValue}`)
    if (found) addToCart(found)
    setScanValue('')
    setScanning(false)
  }

  const subTotal      = cart.reduce((s, x) => s + x.price * x.qty, 0)
  const promoDiscount = (() => {
    const promo = PROMOS.find(p => p.id === selectedPromo)
    if (!promo) return 0
    if (promo.type === 'percent') return subTotal * (promo.discount as number)
    if (promo.type === 'fixed')   return promo.discount as number
    return 0
  })()
  const voucherDiscount = voucherApplied ? 20000 : 0
  const totalDiscount   = promoDiscount + voucherDiscount
  const tax             = Math.round((subTotal - totalDiscount) * 0.08)
  const total           = subTotal - totalDiscount + tax
  const cartCount       = cart.reduce((s, x) => s + x.qty, 0)

  const filtered = PRODUCTS.filter(p => {
    const matchCat = category === 'Tất cả' || p.category === category
    const matchQ   = p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.includes(query)
    return matchCat && matchQ
  })

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">

      {/* ════════════════════════════════════════
          LEFT — Product catalogue
      ════════════════════════════════════════ */}
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
          {CATEGORIES.map(cat => (
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

            {filtered.map(p => {
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
                  <div className="h-14 flex items-center justify-center text-4xl mb-2">{p.emoji}</div>
                  <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mt-0.5 line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-green-600 mt-1.5">{fmt(p.price)}</p>
                  <div className="absolute bottom-2.5 right-2.5 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-base">Không tìm thấy sản phẩm</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Cart + Payment
      ════════════════════════════════════════ */}
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
                  <div className="text-2xl flex-shrink-0 w-8 text-center">{item.emoji}</div>
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

          {/* Voucher */}
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={voucher}
                  onChange={e => { setVoucher(e.target.value); setVoucherApplied(false) }}
                  placeholder="Nhập mã giảm giá..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={() => { if (voucher.trim()) setVoucherApplied(true) }}
                className="px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Áp dụng
              </button>
            </div>
            {voucherApplied && (
              <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center gap-1">
                <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                Mã hợp lệ — giảm {fmt(20000)}
              </p>
            )}
          </div>

          {/* Promos */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Chọn khuyến mãi</p>
            <div className="flex gap-1.5 flex-wrap">
              {PROMOS.map(promo => (
                <button
                  key={promo.id}
                  onClick={() => setSelectedPromo(prev => prev === promo.id ? null : promo.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    selectedPromo === promo.id
                      ? 'bg-green-600 border-green-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {promo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl p-3 space-y-1.5 text-xs border border-gray-100 shadow-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính</span>
              <span className="font-medium">{fmt(subTotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span className="font-semibold">− {fmt(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Thuế VAT (8%)</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-green-700 text-base">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phương thức thanh toán</p>
            <div className="grid grid-cols-4 gap-1.5">
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

          {/* Customer + Print row */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-xl text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              Thêm khách hàng
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white rounded-xl text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
              <Receipt className="w-3.5 h-3.5" />
              In hóa đơn
            </button>
          </div>

          {/* Pay button */}
          <button
            disabled={cart.length === 0}
            className="w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            {cart.length === 0 ? 'Thanh toán ngay' : `Thanh toán — ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BARCODE SCANNER MODAL
      ════════════════════════════════════════ */}
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

            {/* Scanner viewfinder */}
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
