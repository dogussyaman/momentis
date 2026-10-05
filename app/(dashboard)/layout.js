import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const metadata = { title: 'Panel | MOMENTIS', robots: { index: false } }

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>
}
