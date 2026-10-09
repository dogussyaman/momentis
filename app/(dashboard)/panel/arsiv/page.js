import { ProjectsList } from '@/components/dashboard/projects-list'

export const metadata = {
  title: 'Arşiv | MOMENTIS',
}

export default function ArchivePage() {
  return <ProjectsList view="archive" />
}
