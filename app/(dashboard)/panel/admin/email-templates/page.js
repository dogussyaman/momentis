import { AdminEmailTemplateManager } from '@/components/admin/admin-email-template-manager'

export const metadata = {
  title: 'E-posta Şablonları | MOMENTIS',
  robots: { index: false },
}

export default function AdminEmailTemplatesPage() {
  return <AdminEmailTemplateManager />
}
