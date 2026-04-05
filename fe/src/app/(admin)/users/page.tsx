'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { useAuthStore } from '@/store/auth.store'

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: UserStatus
  password?: string
  createdAt: string
}

interface Location {
  id: number
  name: string
  location: string
  status: string
  isDeleted: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Include all variations of role names (English & Vietnamese)
const STORE_ROLES  = [
  'Store Manager', 'Store Staff', 'Nhân viên', 'Quản lý cửa hàng',
  'STORE_MANAGER', 'STORE_STAFF', 'STAFF'
]
const WAREHOUSE_ROLES = [
  'Warehouse Manager', 'Warehouse Staff', 'Warehouse Admin',
  'Quản lý kho', 'Nhân viên kho', 'Admin kho',
  'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'WAREHOUSE_ADMIN'
]
const ROLES_NEEDING_LOCATION = [...STORE_ROLES, ...WAREHOUSE_ROLES]
const HIDDEN_ROLES = ['CUSTOMER', 'Customer']

// Nới lỏng filter: chấp nhận cả tên không bắt đầu đúng chuẩn
// Chỉ dựa vào status ACTIVE và isDeleted === false, sau đó phân loại bằng keyword linh hoạt hơn
function classifyLocations(raw: Location[]) {
  const active = raw.filter((l) => l.status?.toUpperCase() === 'ACTIVE' && !l.isDeleted)
  
  // Classify by explicit warehouse keywords first
  const warehouses = active.filter((l) =>
    l.name.startsWith('Kho') ||
    l.name.toLowerCase().includes('kho') ||
    l.name.toLowerCase().includes('warehouse') ||
    l.name.toLowerCase().includes('kho')
  )
  
  // Everything else that's not a warehouse is considered a store
  // This is more flexible and ensures store staff can always find stores
  const stores = active.filter((l) => !warehouses.includes(l))
  
  return { stores, warehouses }
}

function getLocationsForRole(
  roleName: string,
  stores: Location[],
  warehouses: Location[]
): Location[] {
  // Normalize role name for comparison (lowercase, remove extra spaces)
  const normalized = String(roleName || '').toLowerCase().trim().replace(/\s+/g, ' ')
  
  const isStoreRole = STORE_ROLES.some(r => 
    normalized === r.toLowerCase().replace(/\s+/g, ' ') ||
    normalized.includes(r.toLowerCase().replace(/\s+/g, ' '))
  )
  if (isStoreRole) return stores

  const isWarehouseRole = WAREHOUSE_ROLES.some(r =>
    normalized === r.toLowerCase().replace(/\s+/g, ' ') ||
    normalized.includes(r.toLowerCase().replace(/\s+/g, ' '))
  )
  if (isWarehouseRole) return warehouses
  
  return []
}

function needsLocation(roleName: string): boolean {
  // Normalize role name for comparison
  const normalized = String(roleName || '').toLowerCase().trim().replace(/\s+/g, ' ')
  
  return ROLES_NEEDING_LOCATION.some(r =>
    normalized === r.toLowerCase().replace(/\s+/g, ' ') ||
    normalized.includes(r.toLowerCase().replace(/\s+/g, ' '))
  )
}

// ── Mapper ───────────────────────────────────────────────────────────────────

function mapApiUserToUi(raw: any): User {
  const roleName =
    (typeof raw?.role === 'object' && raw?.role?.name) ||
    raw?.roleName ||
    raw?.role ||
    'STAFF'

  return {
    id: String(raw?.id ?? raw?.userId ?? ''),
    name: String(raw?.name ?? raw?.full_name ?? raw?.fullName ?? ''),
    email: String(raw?.email ?? ''),
    role: String(roleName),
    status: String(raw?.status ?? 'ACTIVE').toUpperCase() as UserStatus,
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const ITEMS_PER_PAGE = 10
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  // ── Modal / form state ────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]   = useState(false)
  const [mode, setMode]                 = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [name, setName]                 = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [role, setRole]                 = useState('')
  const [locationId, setLocationId]     = useState<string>('')
  const [locationError, setLocationError] = useState('')

  // ── Data state ────────────────────────────────────────────────────────────
  const [users, setUsers]               = useState<User[]>([])
  const [allUsers, setAllUsers]         = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage]   = useState(1)
  const [loading, setLoading]           = useState(true)
  const [roles, setRoles]               = useState<Array<{ id: number; name: string }>>([])
  const [stores, setStores]             = useState<Location[]>([])
  const [warehouses, setWarehouses]     = useState<Location[]>([])
  
  // Search and filter states
  const [searchName, setSearchName]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredRoles     = roles.filter((r) => !HIDDEN_ROLES.includes(r.name))
  const locationOptions   = getLocationsForRole(role, stores, warehouses)
  const showLocation      = needsLocation(role)

  const totalPages        = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
  const safeCurrentPage   = Math.min(currentPage, totalPages)
  const startIndex        = (safeCurrentPage - 1) * ITEMS_PER_PAGE
  const paginatedUsers    = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadUsers = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      // Try local database first (will show newly created users)
      // If it fails, fallback to IAM service
      let response = await fetch('/api/users', { headers })

      console.log('📋 loadUsers response:', response.status, response.statusText, response.url)

      if (response.ok) {
        const payload = await response.json()
        console.log('📥 Payload received:', payload)
        const data = Array.isArray(payload) ? payload : payload?.data
        console.log('📊 Processed data:', data ? `Array of ${data.length} items` : 'Empty')
        const mappedUsers = Array.isArray(data) ? data.map(mapApiUserToUi) : []
        setAllUsers(mappedUsers)
        setUsers(mappedUsers)
        setFilteredUsers(mappedUsers)
        console.log('✅ Users set in state')
      } else {
        console.error('❌ Response not ok:', response.status)
        setUsers([])
        setAllUsers([])
        setFilteredUsers([])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
      setAllUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch('/api/roles', { headers })
      if (response.ok) {
        const data: Array<{ id: number; name: string }> = await response.json()
        setRoles(data)
        const firstVisible = data.find((r) => !HIDDEN_ROLES.includes(r.name))
        if (firstVisible) setRole(firstVisible.name)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const loadLocations = async () => {
    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch('/api/Warehouse', { headers })
      if (response.ok) {
        const payload = await response.json()
        const raw: Location[] = Array.isArray(payload) ? payload : payload?.data ?? []
        const { stores: s, warehouses: w } = classifyLocations(raw)
        setStores(s)
        setWarehouses(w)
      }
    } catch (error) {
      console.error('Failed to load locations:', error)
    }
  }

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadLocations()
  }, [token])

  useEffect(() => {
    setCurrentPage(1)
  }, [users.length])

  // Apply client-side filters
  useEffect(() => {
    const filtered = allUsers.filter(user => {
      const matchesName = user.name.toLowerCase().includes(searchName.toLowerCase())
      const matchesStatus = statusFilter === '' || user.status === statusFilter
      return matchesName && matchesStatus
    })
    
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchName, statusFilter, allUsers])

  useEffect(() => {
    setLocationId('')
    setLocationError('')
  }, [role])

  // ── Validation ────────────────────────────────────────────────────────────

  const validatePassword = (pwd: string): string => {
    if (!pwd)                                                          return 'Mật khẩu là bắt buộc'
    if (pwd.length < 6)                                               return 'Mật khẩu phải có ít nhất 6 ký tự'
    if (!/^[A-Z]/.test(pwd))                                          return 'Mật khẩu phải bắt đầu bằng chữ cái viết hoa'
    if (!/\d/.test(pwd))                                              return 'Mật khẩu phải chứa ít nhất 1 chữ số'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd))          return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'
    return ''
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setPasswordError('')
    setLocationId('')
    setLocationError('')
    const firstVisible = roles.find((r) => !HIDDEN_ROLES.includes(r.name))
    setRole(firstVisible?.name ?? '')
  }

  // Reload locations trước khi mở modal để luôn có dữ liệu mới nhất
  const handleOpenCreate = async () => {
    setMode('create')
    setEditingId(null)
    resetForm()
    await loadLocations() // <-- reload để lấy kho/cửa hàng mới nhất
    setIsModalOpen(true)
  }

  const handleCloseCreate = () => {
    setIsModalOpen(false)
    resetForm()
  }

  // Reload locations trước khi mở modal edit để luôn có dữ liệu mới nhất
  const handleEditClick = async (user: User) => {
    setMode('edit')
    setEditingId(user.id)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
    setPasswordError('')
    setRole(user.role)
    setLocationId('')
    setLocationError('')
    await loadLocations() // <-- reload để lấy kho/cửa hàng mới nhất
    setIsModalOpen(true)
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        await loadUsers()
      } else {
        const error = await response.json()
        alert('Không thể cập nhật status: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Update status error:', error)
      alert('Có lỗi xảy ra khi cập nhật status')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      console.log('📤 DELETE /api/users/delete/' + id)
      console.log('📤 Authorization:', token ? `Bearer ${token.substring(0, 20)}...` : 'none')

      const response = await fetch(`/api/users/delete/${id}`, {
        method: 'DELETE',
        headers,
      })

      console.log('📥 API Response Status:', response.status, response.statusText)

      if (response.ok) {
        console.log('✅ User deleted successfully')
        await loadUsers()
      } else {
        const error = await response.json()
        alert('Xóa user thất bại: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete user error:', error)
      alert('Có lỗi xảy ra khi xóa user')
    }
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('📝 Submit User:', { mode, name, email, role, locationId })

    if (mode === 'create') {
      const pwdError = validatePassword(password)
      if (pwdError) { 
        console.error('❌ Password error:', pwdError)
        setPasswordError(pwdError)
        return 
      }
    } else if (mode === 'edit' && password) {
      const pwdError = validatePassword(password)
      if (pwdError) { 
        console.error('❌ Password error:', pwdError)
        setPasswordError(pwdError)
        return 
      }
    }
    setPasswordError('')

    if (showLocation && !locationId) {
      console.error('❌ Location error: Location is required')
      setLocationError('Vui lòng chọn địa chỉ / chi nhánh cho vai trò này')
      return
    }
    setLocationError('')

    try {
      // Prepare headers with Authorization token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      if (mode === 'create') {
        // Map FE fields to backend API fields
        const payload: any = {
          fullName: name,
          email,
          password,
          roleName: role,
        }
        if (showLocation && locationId) {
          payload.workplaceId = locationId
          payload.workplaceType = user?.workplaceType || 'WAREHOUSE'
        }

        console.log('📤 POST /api/users/create with payload:', payload)
        console.log('📤 Authorization:', token ? `Bearer ${token.substring(0, 20)}...` : 'none')

        const response = await fetch('/api/users/create', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })

        console.log('📥 API Response Status:', response.status, response.statusText)

        if (response.ok) {
          console.log('✅ User created successfully')
          await loadUsers()
          handleCloseCreate()
        } else {
          const error = await response.json()
          console.error('❌ API Error:', error)
          alert('Lỗi: ' + (error.error || 'Tạo user thất bại'))
          return
        }
      } else if (mode === 'edit' && editingId) {
        // Map FE fields to backend API fields
        const payload: any = {
          email,
          fullName: name,
        }
        
        // Lookup roleId from role name if role is provided
        if (role) {
          const selectedRole = roles.find((r) => r.name === role)
          if (selectedRole) {
            payload.roleId = selectedRole.id
          }
        }
        
        if (showLocation && locationId) {
          payload.workplaceId = locationId
          payload.workplaceType = user?.workplaceType || 'WAREHOUSE'
        }

        console.log('📤 PUT /api/users/update/' + editingId + ' with payload:', payload)
        console.log('📤 Authorization:', token ? `Bearer ${token.substring(0, 20)}...` : 'none')

        const response = await fetch(`/api/users/update/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        })

        console.log('📥 API Response Status:', response.status, response.statusText)

        if (response.ok) {
          console.log('✅ User updated successfully')
          await loadUsers()
          handleCloseCreate()
        } else {
          const error = await response.json()
          console.error('❌ API Error:', error)
          alert('Lỗi: ' + (error.error || 'Cập nhật user thất bại'))
          return
        }
      }
    } catch (error) {
      console.error('❌ Submit user error:', error)
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const createUserButton = <Button onClick={handleOpenCreate}>Tạo người dùng</Button>

  return (
    <div className="p-6">
      <PageHeader
        title="Người dùng & vai trò"
        subtitle="Quản lý người dùng hệ thống và quyền truy cập"
        actions={createUserButton}
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Người dùng', href: '/admin/users' },
        ]}
      />

      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Không có người dùng"
            description="Tạo tài khoản người dùng đầu tiên"
            action={createUserButton}
          />
        ) : (
          <>
            {/* Search and Filter Section */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-sm font-medium text-gray-700">Tìm kiếm theo tên</label>
                <input
                  type="text"
                  placeholder="Nhập tên người dùng..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Lọc trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 md:w-48"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="SUSPENDED">Tạm khóa</option>
                </select>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchName('')
                  setStatusFilter('')
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>

            {/* Data Table */}
            <DataTable
              data={paginatedUsers as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'name',  label: 'Tên'   },
                { key: 'email', label: 'Email' },
                {
                  key: 'role',
                  label: 'Vai trò',
                  render: (value) => {
                    const roleLabels: Record<string, string> = {
                      ADMIN: 'Quản trị viên',
                      STORE_MANAGER: 'Quản lý cửa hàng',
                      WAREHOUSE_MANAGER: 'Quản lý kho',
                      STAFF: 'Nhân viên',
                      CUSTOMER: 'Khách hàng',
                      'Store Manager': 'Quản lý cửa hàng',
                      'Warehouse Manager': 'Quản lý kho',
                    }
                    const roleValue = String(value ?? '')
                    return (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {roleLabels[roleValue] || roleValue}
                      </span>
                    )
                  },
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (value, item) => (
                    <select
                      className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={value as string}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleStatusChange((item as unknown as User).id, e.target.value as UserStatus)
                      }}
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                      <option value="SUSPENDED">Tạm khóa</option>
                    </select>
                  ),
                },
                {
                  key: 'createdAt',
                  label: 'Ngày tạo',
                  render: (value) =>
                    new Date(value as string).toLocaleDateString('vi-VN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    }),
                },
                {
                  key: 'id',
                  label: 'Thao tác',
                  render: (_value, item) => {
                    const user = item as unknown as User
                    return (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditClick(user) }}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id) }}>
                          Xóa
                        </Button>
                      </div>
                    )
                  },
                },
              ]}
            />

            {filteredUsers.length > ITEMS_PER_PAGE && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} / {filteredUsers.length} người dùng
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={safeCurrentPage === 1}>
                    Trước
                  </Button>
                  <span className="text-sm text-gray-700">Trang {safeCurrentPage}/{totalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={safeCurrentPage === totalPages}>
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseCreate}
        title={mode === 'create' ? 'Tạo người dùng' : 'Sửa người dùng'}
        size="md"
        footer={(
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseCreate}>Hủy</Button>
            <button 
              form="userFormModal" 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Lưu
            </button>
          </div>
        )}
      >
        <form id="userFormModal" className="space-y-4" onSubmit={handleSubmitUser}>
          {/* Họ và tên */}
          <Input
            label="Họ và tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />

          {/* Email */}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />

          {/* Mật khẩu */}
          <div>
            <Input
              label={mode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới (không bắt buộc)'}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError('')
              }}
              placeholder={mode === 'create' ? '••••••••' : 'Để trống để giữ mật khẩu hiện tại'}
              required={mode === 'create'}
              className={passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
            {!passwordError && password && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p className="font-medium">Yêu cầu mật khẩu:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                    Độ dài từ 6 ký tự trở lên {password.length >= 6 ? '✓' : ''}
                  </li>
                  <li className={/^[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                    Bắt đầu bằng chữ cái viết hoa {/^[A-Z]/.test(password) ? '✓' : ''}
                  </li>
                  <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                    Có ít nhất 1 chữ số {/\d/.test(password) ? '✓' : ''}
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                    Có ít nhất 1 ký tự đặc biệt {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : ''}
                  </li>
                </ul>
              </div>
            )}
            {!password && mode === 'create' && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p className="font-medium">Yêu cầu mật khẩu:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Độ dài từ 6 ký tự trở lên</li>
                  <li>Bắt đầu bằng chữ cái viết hoa</li>
                  <li>Có ít nhất 1 chữ số</li>
                  <li>Có ít nhất 1 ký tự đặc biệt</li>
                </ul>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {filteredRoles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Địa chỉ / Chi nhánh / Kho — chỉ hiện khi role cần */}
          {showLocation && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {STORE_ROLES.includes(role) ? 'Cửa hàng' : 'Kho'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                className={`mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1
                  ${locationError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value)
                  if (locationError) setLocationError('')
                }}
              >
                <option value="">
                  -- Chọn {STORE_ROLES.includes(role) ? 'cửa hàng' : 'kho'} --
                </option>
                {locationOptions.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.name}{loc.location ? ` - ${loc.location}` : ''}
                  </option>
                ))}
              </select>
              {locationError && <p className="mt-1 text-sm text-red-600">{locationError}</p>}
              {locationOptions.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600">
                  Không tìm thấy {STORE_ROLES.includes(role) ? 'cửa hàng' : 'kho'} nào đang hoạt động.
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}