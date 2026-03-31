import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'

export default function PromotionsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Khuyến mãi"
        subtitle="Tạo và quản lý chiến dịch khuyến mãi"
        actions={<Button>Tạo khuyến mãi</Button>}
        breadcrumbs={[
          { label: 'Quản trị', href: '/admin' },
          { label: 'Khuyến mãi', href: '/admin/promotions' },
        ]}
      />

      <div className="card">
        <EmptyState
          title="Không có khuyến mãi"
          description="Tạo chiến dịch khuyến mãi đầu tiên"
          action={<Button>Tạo khuyến mãi</Button>}
        />
      </div>
    </div>
  )
}
