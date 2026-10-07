import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { InvitationSite } from '@/components/invitation/invitation-site'
import { SiteViewer } from '@/components/site-builder/SiteViewer'

export const dynamic = 'force-dynamic'

async function loadInvitation(slug) {
  const db = await getDb()
  const project = await db.collection('event_projects').findOne({ slug, published: true }, { projection: { _id: 0, user_id: 0 } })
  if (!project) return null
  const template = await db.collection('templates').findOne({ slug: project.template_slug }, { projection: { _id: 0 } })
  return { project: JSON.parse(JSON.stringify(project)), template: template ? JSON.parse(JSON.stringify(template)) : null }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await loadInvitation(slug)
  if (!data) return { title: 'Davetiye bulunamadı | MOMENTIS' }
  const names = [data.project.host_a, data.project.host_b].filter(Boolean).join(' & ')
  return { title: `${names} | Davetiye`, description: data.project.title, openGraph: { title: `${names} | Davetiye`, images: data.template?.cover ? [data.template.cover] : [] } }
}

export default async function InvitationPage({ params }) {
  const { slug } = await params
  const data = await loadInvitation(slug)
  if (!data) notFound()
  
  if (data.project.site_data) {
    return <SiteViewer site={data.project.site_data} />
  }

  return <InvitationSite project={data.project} template={data.template} />
}
