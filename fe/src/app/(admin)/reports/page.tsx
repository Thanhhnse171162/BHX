import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'

export default function AdminReportsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Báo cáo & phân tích"
        subtitle="Thông tin phân tích kinh doanh toàn hệ thống"
        actions={<Button>Xuất tất cả</Button>}
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Báo cáo', href: '/admin/reports' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Báo cáo doanh thu', description: 'Phân tích doanh thu và xu hướng' },
          { title: 'Báo cáo tồn kho', description: 'Biến động và mức tồn kho' },
          { title: 'Báo cáo đơn hàng', description: 'Số lượng và xu hướng đơn hàng' },
          { title: 'Báo cáo khách hàng', description: 'Nhân khẩu học và hoạt động khách hàng' },
          { title: 'Hiệu suất nhân sự', description: 'Chỉ số hiệu quả và KPI nhân viên' },
          { title: 'Báo cáo tài chính', description: 'Phân tích tài chính chi tiết' },
        ].map((report, idx) => (
          <div key={idx} className="card">
            <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{report.description}</p>
            <Button variant="outline" fullWidth className="mt-4">
              Tạo báo cáo
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
