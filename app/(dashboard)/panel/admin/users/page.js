import { AdminUserManager } from '@/components/admin/admin-user-manager'

export const metadata = {
  title: 'Kullanıcılar ve Kotalar | MOMENTIS',
  robots: { index: false },
}

export default function AdminUsersPage() {
  return <AdminUserManager />
}
