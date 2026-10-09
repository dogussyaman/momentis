import { ProjectsList } from '@/components/dashboard/projects-list'

export const metadata = {
  title: 'Taslaklar | MOMENTIS',
}

export default function DraftsPage() {
  return <ProjectsList view="drafts" />
}
