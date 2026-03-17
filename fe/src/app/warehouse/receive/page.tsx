
"use client";
import React, { useRef, useState } from "react";
import { PlusIcon, QrCodeIcon, DocumentArrowUpIcon, TrashIcon } from "@heroicons/react/24/outline";

const initialProducts = [
  {
    id: 1,
    name: "Sữa tươi tiệt trùng Vinamilk 1L",
    sku: "VNM-MILK-1000",
    request: 120,
    delivered: 120,
    received: 120,
    batch: "LOT-001",
    exp: "",
  },
  {
    id: 2,
    name: "Bột giặt Omo Matic 4kg",
    sku: "OMO-MATIC-4KG",
    request: 50,
    delivered: 50,
    received: 50,
    batch: "BATCH-201",
    exp: "",
  },
];

export default function ReceiveWarehousePage() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Summary
  const totalSKU = products.length;
  const totalQty = products.reduce((sum, p) => sum + p.request, 0);
  const totalReceived = products.reduce((sum, p) => sum + p.received, 0);

  // Handlers
  const handleReceivedChange = (id: number, value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, received: value } : p))
    );
  };
  const handleDelete = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-[#F6F7FB] min-h-screen p-0">
      {/* HEADER */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#fff"/><path d="M4.5 8.5h7m-3.5-3.5v7" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </span>
            <span className="text-lg font-semibold text-slate-700">Hệ thống Kho vận</span>
          </div>
          <div className="mt-4 mb-1 text-2xl font-bold text-slate-800">Tạo phiếu nhập hàng mới</div>
          <div className="text-sm text-slate-500">Điền đầy đủ thông tin để khởi tạo quy trình nhập kho sản phẩm.</div>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2 rounded-lg border bg-white text-slate-500 font-medium hover:bg-slate-100">Hủy</button>
          <button className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700">Gửi yêu cầu tiếp nhận</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 mt-8">
        {/* LEFT PANEL */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
          {/* Card: Thông tin chung */}
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4">
            <div className="font-medium text-base text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-600 rounded-full inline-block"></span>
              Thông tin chung
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-slate-500">Ngày nhận thực tế</label>
              <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <option>Chọn đơn vị cung cấp</option>
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-slate-500">Ngày nhận thực tế</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-slate-500">Ngày nhận thực tế</label>
              <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Nhập ghi chú hoặc hướng dẫn dỡ hàng..." />
            </div>
          </div>
          {/* Mẹo nhập liệu */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex gap-2">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#34D399"/><path d="M10 5v5l3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div>
              <div className="font-medium">Mẹo nhập liệu</div>
              Sử dụng phím Tab để di chuyển nhanh giữa các ô nhập liệu trong bảng sản phẩm.
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
          {/* Card: Danh sách sản phẩm nhập */}
          <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-base text-slate-700 flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-600 rounded-full inline-block"></span>
                Danh sách sản phẩm nhập
              </div>
              <div className="text-xs text-slate-500">Đã chọn: <span className="text-emerald-600 font-semibold">0{products.length} mặt hàng</span></div>
            </div>
            <div className="mb-2">
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Tìm kiếm sản phẩm theo tên, mã SKU hoặc quét mã vạch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-3 py-2 text-left font-medium">SẢN PHẨM / SKU</th>
                    <th className="px-3 py-2 text-center font-medium">SỐ LƯỢNG</th>
                    <th className="px-3 py-2 text-center font-medium">BATCH / SỐ LÔ</th>
                    <th className="px-3 py-2 text-center font-medium">HẠN SỬ DỤNG</th>
                    <th className="px-3 py-2 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2 min-w-[180px]">
                          <div className="font-medium text-slate-700">{p.name}</div>
                          <div className="text-xs text-slate-400">SKU: {p.sku}</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            className="w-20 border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={p.request}
                            readOnly
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="text"
                            className="w-24 border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={p.batch}
                            readOnly
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="date"
                            className="w-32 border rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={p.exp}
                            onChange={e => setProducts(prev => prev.map(x => x.id === p.id ? { ...x, exp: e.target.value } : x))}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                            onClick={() => handleDelete(p.id)}
                            title="Xóa"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-medium text-slate-700">
                    <td className="px-3 py-2">Tổng SKU: <span className="font-semibold">{totalSKU}</span></td>
                    <td className="px-3 py-2 text-center">Tổng số lượng: <span className="font-semibold">{totalQty}</span></td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button className="flex items-center gap-1 text-emerald-600 font-medium text-sm hover:underline">
                <PlusIcon className="w-4 h-4" /> Thêm sản phẩm nhanh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Đính kèm chứng từ */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="font-medium text-slate-700 mb-1">Đính kèm chứng từ</div>
            <div className="text-xs text-slate-400">Hóa đơn, biên bản bàn giao (PDF, JPG, PNG)</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="bg-white border border-emerald-600 text-emerald-600 font-medium px-4 py-2 rounded-lg text-sm hover:bg-emerald-50"
            onClick={() => fileInputRef.current?.click()}
          >
            Tải tệp lên
          </button>
          {file && (
            <span className="text-sm text-slate-500">{file.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}
