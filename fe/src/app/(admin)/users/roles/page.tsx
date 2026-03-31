'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { DataTable } from '@/shared/ui/DataTable'
import Modal from '@/shared/ui/Modal'
import { RoleAPIService, RoleFromAPI } from '@/services/role-api.service'
import { rolePermissions, modulePermissions } from '@/shared/auth/permission-map'
import type { UserRole, Permission } from '@/shared/types'

// Sử dụng trực tiếp type từ API, khớp với database
interface Role extends RoleFromAPI {
  permissions?: Permission[]  // Optional, map từ permission-map
  userCount?: number  // Optional, TODO: Backend trả về
  [key: string]: unknown  // Index signature for DataTable compatibility
}

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load roles từ API backend
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await RoleAPIService.getAllRoles()
      
      // Giữ nguyên data từ API, chỉ thêm permissions từ permission-map
      const roleList: Role[] = data.map((r: RoleFromAPI) => {
        // Map role name to permissions từ permission-map (tạm thời)
        const roleName = r.name.toUpperCase().replace(/\s+/g, '_') as UserRole
        const perms = rolePermissions[roleName] || []
        
        return {
          ...r,  // Giữ nguyên tất cả fields từ database: id, name, description, is_system, created_at
          permissions: perms,
          userCount: 0,
        }
      })
      
      setRoles(roleList)
    } catch (err) {
      console.error('Error loading roles:', err)
      setError('Không thể tải danh sách roles. Vui lòng kiểm tra backend.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role.id)
    setSelectedPermissions([...(role.permissions || [])])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(null)
    setSelectedPermissions([])
  }

  const togglePermission = (permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSaveRole = async () => {
    if (!editingRole) return

    try {
      // TODO: Gọi API để update permissions cho role
      // await RoleAPIService.updateRole(editingRole.toString(), { permissions: selectedPermissions })
      
      // Update role permissions trong state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole
            ? { ...r, permissions: selectedPermissions }
            : r
        )
      )

      alert('Cập nhật permissions thành công!')
      handleCloseModal()
    } catch (err) {
      console.error('Error updating role:', err)
      alert('Không thể cập nhật permissions')
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          title="Vai trò & quyền hạn"
          subtitle="Quản lý vai trò hệ thống và quyền truy cập"
          breadcrumbs={[
            { label: 'Quản trị', href: '/admin' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Vai trò', href: '/admin/users/roles' },
          ]}
        />
        <div className="card">
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Vai trò & quyền hạn"
          subtitle="Quản lý vai trò hệ thống và quyền truy cập"
          breadcrumbs={[
            { label: 'Quản trị', href: '/admin' },
            { label: 'Người dùng', href: '/admin/users' },
            { label: 'Vai trò', href: '/admin/users/roles' },
          ]}
        />
        <div className="card">
          <div className="flex flex-col items-center py-12 text-red-600">
            <p className="text-lg mb-4">{error}</p>
            <Button onClick={fetchRoles}>Thử lại</Button>
          </div>
        </div>
      </div>
    )
  }

  const allPermissions = Object.values(modulePermissions).flat()
  const uniquePermissions = Array.from(new Set(allPermissions)).sort()

  // Group permissions by module
  const permissionsByModule = Object.entries(modulePermissions).map(([module, perms]) => ({
    module,
    permissions: perms,
  }))

  return (
    <div className="p-6">
      <PageHeader
        title="Vai trò & quyền hạn"
        subtitle="Quản lý vai trò hệ thống và quyền truy cập"
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Người dùng', href: '/admin/users' },
          { label: 'Vai trò', href: '/admin/users/roles' },
        ]}
      />

      <div className="card">
        <DataTable
          data={roles}
          columns={[
            {
              key: 'id',
              label: 'ID',
              render: (value) => (
                <span className="font-mono text-sm text-gray-600">{value as number}</span>
              ),
            },
            {
              key: 'name',
              label: 'Tên vai trò',
              render: (value, item) => {
                const role = item as Role
                return (
                  <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {value as string}
                      {role.is_system && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                          Hệ thống
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{role.description}</div>
                  </div>
                )
              },
            },
            {
              key: 'permissions',
              label: 'Quyền',
              render: (value) => {
                const perms = (value as Permission[]) || []
                return (
                  <div className="flex flex-wrap gap-1">
                    {perms.length > 0 ? (
                      perms.slice(0, 3).map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                        >
                          {perm.replace(/_/g, ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">Không có quyền</span>
                    )}
                    {perms.length > 3 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        +{perms.length - 3} more
                      </span>
                    )}
                  </div>
                )
              },
            },
            {
              key: 'createdAt',
              label: 'Ngày tạo',
              render: (value) => {
                const date = new Date(value as string)
                return (
                  <span className="text-sm text-gray-600">
                    {date.toLocaleDateString('vi-VN')}
                  </span>
                )
              },
            },
            {
              key: 'userCount',
              label: 'Người dùng',
              render: (value) => (
                <span className="text-sm font-medium text-gray-700">{(value as number) || 0}</span>
              ),
            },
            {
              key: 'id',
              label: 'Thao tác',
              render: (_value, item) => {
                const role = item as Role
                return (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                    disabled={role.is_system}
                    title={role.is_system ? 'Vai trò hệ thống không thể chỉnh sửa' : 'Sửa quyền'}
                  >
                    Sửa quyền
                  </Button>
                )
              },
            },
          ]}
        />
      </div>

      {/* Modal sửa quyền */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Sửa quyền: ${editingRole ? roles.find(r => r.id === editingRole)?.name || '' : ''}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button onClick={handleSaveRole}>Lưu thay đổi</Button>
          </div>
        }
      >
        {editingRole && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Chọn các quyền cho vai trò này. Thay đổi sẽ ảnh hưởng tới tất cả người dùng có vai trò tương ứng.
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {permissionsByModule.map(({ module, permissions }) => (
                <div key={module} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 capitalize">
                    {module.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="space-y-2">
                    {permissions.map((permission) => {
                      const isChecked = selectedPermissions.includes(permission)
                      return (
                        <label
                          key={permission}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(permission)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">
                            {permission.replace('_', ' ')}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Permissions:</span>
                <span className="font-semibold text-gray-900">
                  {selectedPermissions.length} / {uniquePermissions.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

