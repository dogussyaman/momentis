import { AdminTemplateManager } from '@/components/admin/admin-template-manager'

export const metadata = {
  title: 'Şablon Yönetimi | MOMENTIS',
  robots: { index: false },
}

export default function AdminTemplatesPage() {
  return <AdminTemplateManager />
}
