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
  password?: string // demo only, không hiển thị ở UI
  createdAt: string
}

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

export default function UsersPage() {
  const token = useAuthStore((state) => state.token)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [role, setRole] = useState('STAFF')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([])

  // Load users từ database
  const loadUsers = async () => {
    try {
      setLoading(true)
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      // Prefer IAM-proxied list endpoint for cloud deployments.
      let response = await fetch('/api/users/list', { headers })
      if (!response.ok) {
        // Fallback to local DB-backed route for local/dev compatibility.
        response = await fetch('/api/users', { headers })
      }

      if (response.ok) {
        const payload = await response.json()
        const data = Array.isArray(payload) ? payload : payload?.data
        if (Array.isArray(data)) {
          setUsers(data.map(mapApiUserToUi))
        } else {
          setUsers([])
        }
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Load roles từ database
  const loadRoles = async () => {
    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await fetch('/api/roles', { headers })
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
        if (data.length > 0) {
          setRole(data[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [token])

  // Validate password
  const validatePassword = (pwd: string): string => {
    if (!pwd) return 'Mật khẩu là bắt buộc'
    
    if (pwd.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    
    if (!/^[A-Z]/.test(pwd)) {
      return 'Mật khẩu phải bắt đầu bằng chữ cái viết hoa'
    }
    
    if (!/\d/.test(pwd)) {
      return 'Mật khẩu phải chứa ít nhất 1 chữ số'
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt'
    }
    
    return ''
  }

  const handleOpenCreate = () => {
    setMode('create')
    setEditingId(null)
    setName('')
    setEmail('')
    setPassword('')
    setPasswordError('')
    setRole(roles.length > 0 ? roles[0].name : 'STAFF')
    setIsModalOpen(true)
  }

  const handleCloseCreate = () => {
    setIsModalOpen(false)
    setName('')
    setEmail('')
    setPassword('')
    setPasswordError('')
    setRole('STAFF')
  }

  const handleEditClick = (user: User) => {
    setMode('edit')
    setEditingId(user.id)
    setName(user.name)
    setEmail(user.email)
    setPassword('')
    setPasswordError('')
    setRole(user.role)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      const user = users.find((u) => u.id === id)
      if (!user) return

      console.log('Changing status:', { id, status, user })

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await loadUsers()
        console.log('Status updated successfully')
      } else {
        const error = await response.json()
        console.error('Status update failed:', error)
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
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadUsers()
      } else {
        alert('Xóa user thất bại')
      }
    } catch (error) {
      console.error('Delete user error:', error)
      alert('Có lỗi xảy ra')
    }
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password
    if (mode === 'create') {
      const pwdError = validatePassword(password)
      if (pwdError) {
        setPasswordError(pwdError)
        return
      }
    } else if (mode === 'edit' && password) {
      // Chỉ validate nếu có nhập password mới
      const pwdError = validatePassword(password)
      if (pwdError) {
        setPasswordError(pwdError)
        return
      }
    }

    setPasswordError('')

    try {
      if (mode === 'create') {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })

        if (response.ok) {
          await loadUsers() // Reload users từ DB
        } else {
          const error = await response.json()
          alert(error.error || 'Tạo user thất bại')
          return
        }
      } else if (mode === 'edit' && editingId) {
        const payload: any = { name, email, role }
        if (password) payload.password = password

        const response = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          await loadUsers() // Reload users từ DB
        } else {
          const error = await response.json()
          alert(error.error || 'Cập nhật user thất bại')
          return
        }
      }

      handleCloseCreate()
    } catch (error) {
      console.error('Submit user error:', error)
      alert('Có lỗi xảy ra')
    }
  }

  const createUserButton = (
    <Button onClick={handleOpenCreate}>Create User</Button>
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Users & Roles"
        subtitle="Manage system users and their permissions"
        actions={createUserButton}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
        ]}
      />

      <div className="card">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users"
            description="Create your first user account"
            action={createUserButton}
          />
        ) : (
          <DataTable
            data={users}
            columns={[
              {
                key: 'name',
                label: 'Name',
              },
              {
                key: 'email',
                label: 'Email',
              },
              {
                key: 'role',
                label: 'Role',
                render: (value) => {
                  const roleLabels: Record<string, string> = {
                    ADMIN: 'Admin',
                    STORE_MANAGER: 'Store Manager',
                    WAREHOUSE_MANAGER: 'Warehouse Manager',
                    STAFF: 'Staff',
                    CUSTOMER: 'Customer',
                    // Backend role names
                    'Store Manager': 'Store Manager',
                    'Warehouse Manager': 'Warehouse Manager',
                  }
                  return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {roleLabels[value as string] || value}
                    </span>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (value, item) => (
                  <select
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={value as string}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleStatusChange(
                        (item as User).id,
                        e.target.value as UserStatus
                      )
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                ),
              },
              {
                key: 'createdAt',
                label: 'Created At',
                render: (value) => {
                  return new Date(value as string).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                },
              },
              {
                key: 'id',
                label: 'Actions',
                render: (_value, item) => {
                  const user = item as User
                  return (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClick(user)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(user.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseCreate}
        title={mode === 'create' ? 'Create User' : 'Edit User'}
        size="md"
        footer={(
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseCreate}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUser}>
              Save
            </Button>
          </div>
        )}
      >
        <form className="space-y-4" onSubmit={handleSubmitUser}>
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
          <div>
            <Input
              label={mode === 'create' ? 'Password' : 'New Password (optional)'}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) {
                  setPasswordError('')
                }
              }}
              placeholder={mode === 'create' ? '••••••••' : 'Leave blank to keep current password'}
              required={mode === 'create'}
              className={passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
