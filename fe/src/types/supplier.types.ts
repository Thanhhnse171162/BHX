export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | string

export interface SupplierListItem {
  id: string
  name: string
  phone: string
  email: string
  contactPerson: string
  status: SupplierStatus
  isDeleted: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateSupplierPayload {
  name: string
  phone: string
  email: string
  contactPerson: string
}

export interface UpdateSupplierPayload {
  name: string
  phone: string
  email: string
  contactPerson: string
}
