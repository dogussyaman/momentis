import { Suspense } from 'react'
import { NewProjectWizard } from '@/components/dashboard/new-project-wizard'

export default function NewProjectPage() {
  return (
    <Suspense fallback={null}>
      <NewProjectWizard />
    </Suspense>
  )
}
