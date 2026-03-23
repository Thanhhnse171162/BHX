'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supplierService } from '@/services/supplier.service';
import type { CreateSupplierPayload, SupplierListItem, SupplierStatus, UpdateSupplierPayload } from '@/types/supplier.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

const avatarColors: Record<string, string> = {};
const palette = ['#4f7cff', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
let colorIdx = 0;
function getAvatarColor(id: string) {
  if (!avatarColors[id]) avatarColors[id] = palette[colorIdx++ % palette.length];
  return avatarColors[id];
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; message: string; type: 'success' | 'error' }
let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const add = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: t.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: t.type === 'success' ? '#166534' : '#991b1b',
          borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          animation: 'slideIn .25s ease',
          minWidth: 280,
        }}>
          <span style={{ fontSize: 18 }}>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── SupplierFilter ───────────────────────────────────────────────────────────
interface FilterState { keyword: string; status: string }

interface SupplierFilterProps {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
}

function SupplierFilter({ filter, onChange, onApply }: SupplierFilterProps) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: '20px 24px', display: 'flex', alignItems: 'flex-end', gap: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
          TÌM KIẾM CHI TIẾT
        </label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 16 }}>🔍</span>
          <input
            type="text"
            value={filter.keyword}
            onChange={(e) => onChange({ ...filter, keyword: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
            placeholder="Tìm theo tên, mã, số điện thoại, email..."
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px 10px 38px',
              border: '1.5px solid #e5e7eb', borderRadius: 8,
              fontSize: 14, color: '#111', outline: 'none',
              background: '#f9fafb', transition: 'border .2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#4f7cff')}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>

      <div style={{ minWidth: 180 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
          TRẠNG THÁI
        </label>
        <select
          value={filter.status}
          onChange={(e) => onChange({ ...filter, status: e.target.value })}
          style={{
            width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
            borderRadius: 8, fontSize: 14, color: '#111', background: '#f9fafb',
            outline: 'none', cursor: 'pointer', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
          }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <button
        onClick={onApply}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 8,
          border: '1.5px solid #4f7cff', background: '#fff',
          color: '#4f7cff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#eff4ff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
      >
        <span>⚙</span> Lọc kết quả
      </button>
    </div>
  );
}

// ─── SupplierTable ────────────────────────────────────────────────────────────
interface SupplierTableProps {
  suppliers: SupplierListItem[];
  loading: boolean;
  onView: (s: SupplierListItem) => void;
  onEdit: (s: SupplierListItem) => void;
  onDelete: (s: SupplierListItem) => void;
}

function StatusBadge({ status }: { status: SupplierStatus }) {
  const active = status === 'ACTIVE';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: active ? '#dcfce7' : '#fee2e2',
      color: active ? '#15803d' : '#b91c1c',
      letterSpacing: '.04em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
      {status}
    </span>
  );
}

function SupplierTable({ suppliers, loading, onView, onEdit, onDelete }: SupplierTableProps) {
  const cols = ['TÊN NHÀ CUNG CẤP', 'LIÊN HỆ', 'NGƯỜI LIÊN HỆ', 'TRẠNG THÁI', 'NGÀY TẠO', 'THAO TÁC'];

  if (loading) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {cols.map((c) => (
                <th key={c} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '.06em', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {cols.map((c) => (
                  <td key={c} style={{ padding: '18px' }}>
                    <div style={{ height: 14, background: '#f3f4f6', borderRadius: 4, width: c === 'THAO TÁC' ? 80 : '70%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!suppliers.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <p style={{ fontSize: 16, color: '#6b7280', fontWeight: 500 }}>Không tìm thấy nhà cung cấp nào</p>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>Thử điều chỉnh bộ lọc hoặc thêm nhà cung cấp mới</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {cols.map((c) => (
              <th key={c} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '.06em', borderBottom: '1px solid #e5e7eb' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s, idx) => (
            <tr
              key={s.id}
              style={{ borderBottom: idx < suppliers.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background .12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: getAvatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {getInitial(s.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.email.includes('@') ? s.email.split('@')[1] : ''}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{s.phone}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{s.email}</div>
              </td>
              <td style={{ padding: '16px 18px', fontSize: 14, color: '#374151' }}>{s.contactPerson}</td>
              <td style={{ padding: '16px 18px' }}><StatusBadge status={s.status} /></td>
              <td style={{ padding: '16px 18px', fontSize: 14, color: '#6b7280' }}>{formatDate(s.createdAt)}</td>
              <td style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionBtn title="Xem chi tiết" icon="👁" onClick={() => onView(s)} color="#6b7280" />
                  <ActionBtn title="Chỉnh sửa" icon="✏️" onClick={() => onEdit(s)} color="#4f7cff" />
                  <ActionBtn
                    title="Xóa nhà cung cấp"
                    icon="🗑️"
                    onClick={() => onDelete(s)}
                    color="#ef4444"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({ icon, onClick, title, color }: { icon: string; onClick: () => void; title: string; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${hovered ? color : '#e5e7eb'}`,
        background: hovered ? `${color}12` : '#fff', cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
      }}
    >
      {icon}
    </button>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps { page: number; total: number; pageSize: number; onChange: (p: number) => void }

function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3);
    if (page > 4) pages.push('...');
    if (page > 3 && page < totalPages - 2) pages.push(page);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
  }

  const btnStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 8, border: active ? 'none' : '1.5px solid #e5e7eb',
    background: active ? '#4f7cff' : '#fff', color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
    fontWeight: active ? 700 : 500, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>
        Hiển thị <b>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)}</b> trong tổng số <b>{total}</b> nhà cung cấp
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => onChange(1)}>«</button>
        <button style={btnStyle(false, page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} style={{ width: 36, textAlign: 'center', color: '#9ca3af' }}>…</span>
          ) : (
            <button key={p} style={btnStyle(p === page)} onClick={() => onChange(p as number)}>{p}</button>
          )
        )}
        <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
        <button style={btnStyle(false, page === totalPages)} disabled={page === totalPages} onClick={() => onChange(totalPages)}>»</button>
      </div>
    </div>
  );
}

// ─── SupplierFormModal ────────────────────────────────────────────────────────
interface FormData { name: string; phone: string; email: string; contactPerson: string }
interface FormErrors { name?: string; phone?: string; email?: string; contactPerson?: string }

interface SupplierFormModalProps {
  open: boolean;
  editTarget?: SupplierListItem | null;
  onClose: () => void;
  onSuccess: () => void;
  toast: (msg: string, type?: 'success' | 'error') => void;
}

function SupplierFormModal({ open, editTarget, onClose, onSuccess, toast }: SupplierFormModalProps) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', contactPerson: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (isEdit && editTarget) {
        setForm({ name: editTarget.name, phone: editTarget.phone, email: editTarget.email, contactPerson: editTarget.contactPerson });
      } else {
        setForm({ name: '', phone: '', email: '', contactPerson: '' });
      }
      setErrors({});
    }
  }, [open, editTarget, isEdit]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên nhà cung cấp';
    if (!form.contactPerson.trim()) e.contactPerson = 'Vui lòng nhập người liên hệ';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[\d\s\-\+]{8,15}$/.test(form.phone.trim())) e.phone = 'Số điện thoại không hợp lệ';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Email không đúng định dạng';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const payload: CreateSupplierPayload | UpdateSupplierPayload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      contactPerson: form.contactPerson.trim(),
    };
    try {
      if (isEdit && editTarget) {
        await supplierService.updateSupplier(editTarget.id, payload);
        toast('Cập nhật nhà cung cấp thành công!', 'success');
      } else {
        await supplierService.createSupplier(payload);
        toast('Thêm nhà cung cấp thành công!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.';
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const field = (label: string, key: keyof FormData, placeholder: string, icon: string, type = 'text') => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 15 }}>{icon}</span>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); }}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 38px',
            border: `1.5px solid ${errors[key] ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: 9, fontSize: 14, color: '#111', background: '#f9fafb', outline: 'none',
            transition: 'border .15s',
          }}
          onFocus={(e) => { if (!errors[key]) e.target.style.borderColor = '#4f7cff'; }}
          onBlur={(e) => { if (!errors[key]) e.target.style.borderColor = '#e5e7eb'; }}
        />
      </div>
      {errors[key] && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520,
        boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
        animation: 'modalIn .22s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
              {isEdit ? 'Chỉnh Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
              Vui lòng cập nhật thông tin chi tiết của đối tác cung ứng.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', padding: 0, marginLeft: 12 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {field('TÊN NHÀ CUNG CẤP', 'name', 'Vinamilk Co.', '🏢')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('NGƯỜI LIÊN HỆ', 'contactPerson', 'Nguyễn Văn A', '👤')}
            {field('SỐ ĐIỆN THOẠI', 'phone', '02838293939', '📞')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('EMAIL', 'email', 'order@vinamilk.com.vn', '✉️', 'email')}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>NGÀY TẠO</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>📅</span>
                <input
                  type="text" readOnly
                  value={new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 16)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 38px', border: '1.5px solid #e5e7eb', borderRadius: 9, fontSize: 14, color: '#9ca3af', background: '#f9fafb', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f3f4f6', paddingTop: 18 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '10px 22px', borderRadius: 9, border: 'none',
              background: submitting ? '#93c5fd' : '#4f7cff',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'background .15s',
            }}
          >
            {submitting
              ? <><span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Đang lưu...</>
              : <><span>💾</span> Lưu thông tin</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSuppliersPage() {
  const PAGE_SIZE = 5;
  const [allSuppliers, setAllSuppliers] = useState<SupplierListItem[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ keyword: '', status: 'ALL' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SupplierListItem | null>(null);
  const { toasts, add: addToast } = useToast();

  const applyFilters = useCallback((source: SupplierListItem[], currentFilter: FilterState) => {
    const keyword = currentFilter.keyword.trim().toLowerCase();
    const next = source.filter((item) => {
      if (item.isDeleted) return false;
      const statusMatch = currentFilter.status === 'ALL' || item.status === currentFilter.status;
      if (!statusMatch) return false;
      if (!keyword) return true;
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.contactPerson.toLowerCase().includes(keyword)
      );
    });
    setFilteredSuppliers(next);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers();
      setAllSuppliers(data);
      applyFilters(data, filter);
    } catch (err) {
      setAllSuppliers([]);
      setFilteredSuppliers([]);
      addToast(err instanceof Error ? err.message : 'Không thể tải danh sách nhà cung cấp.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, applyFilters, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const paginatedSuppliers = useMemo(
    () => filteredSuppliers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredSuppliers, page]
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filteredSuppliers.length, page]);

  const handleApplyFilter = () => {
    applyFilters(allSuppliers, filter);
    setPage(1);
  };

  const handleDelete = async (s: SupplierListItem) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa nhà cung cấp "${s.name}"?`);
    if (!confirmed) return;

    try {
      await supplierService.deleteSupplier(s.id);
      addToast('Xóa nhà cung cấp thành công!', 'success');
      await fetchData();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Có lỗi xảy ra!', 'error');
    }
  };

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (s: SupplierListItem) => { setEditTarget(s); setModalOpen(true); };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { font-family: -apple-system, 'Segoe UI', sans-serif; }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 40px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          <span>HỆ THỐNG</span>
          <span style={{ color: '#d1d5db' }}>›</span>
          <span style={{ color: '#4f7cff', fontWeight: 600 }}>NHÀ CUNG CẤP</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-.02em' }}>Quản lý Nhà Cung Cấp</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '6px 0 0' }}>
              Hệ thống quản lý thông tin đối tác, theo dõi trạng thái hoạt động và hiệu suất cung ứng toàn cầu.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <HeaderBtn icon="⬆️" label="Import" variant="outline" onClick={() => addToast('Tính năng Import sẽ sớm ra mắt!', 'success')} />
            <HeaderBtn icon="⬇️" label="Export" variant="outline" onClick={() => addToast('Tính năng Export sẽ sớm ra mắt!', 'success')} />
            <HeaderBtn icon="👤" label="Thêm nhà cung cấp" variant="primary" onClick={openCreate} />
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 20 }}>
          <SupplierFilter filter={filter} onChange={setFilter} onApply={handleApplyFilter} />
        </div>

        {/* Table */}
        <div style={{ marginBottom: 20 }}>
          <SupplierTable
            suppliers={paginatedSuppliers}
            loading={loading}
            onView={async (s) => {
              try {
                const detail = await supplierService.getSupplierById(s.id);
                addToast(`Chi tiết: ${detail.name} (${detail.email})`, 'success');
              } catch (err) {
                addToast(err instanceof Error ? err.message : 'Không lấy được chi tiết nhà cung cấp.', 'error');
              }
            }}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Pagination — only renders when total > 0 */}
        <Pagination page={page} total={filteredSuppliers.length} pageSize={PAGE_SIZE} onChange={(p) => setPage(p)} />
      </div>

      <SupplierFormModal
        open={modalOpen}
        editTarget={editTarget}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        toast={addToast}
      />
    </>
  );
}

function HeaderBtn({ icon, label, variant, onClick }: { icon: string; label: string; variant: 'primary' | 'outline'; onClick: () => void }) {
  const [h, setH] = useState(false);
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderRadius: 10,
        border: isPrimary ? 'none' : '1.5px solid #e5e7eb',
        background: isPrimary ? (h ? '#3a6ae8' : '#4f7cff') : (h ? '#f3f4f6' : '#fff'),
        color: isPrimary ? '#fff' : '#374151',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'all .15s', boxShadow: isPrimary ? '0 2px 12px rgba(79,124,255,.35)' : 'none',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}