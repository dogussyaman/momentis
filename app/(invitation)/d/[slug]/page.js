import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { InvitationSite } from '@/components/invitation/invitation-site'
import { SiteViewer } from '@/components/site-builder/SiteViewer'

export const dynamic = 'force-dynamic'

async function loadInvitation(slug) {
  const db = await getDb()
  const project = await db.collection('event_projects').findOne({ slug, published: true, archived: { $ne: true } }, { projection: { _id: 0, user_id: 0 } })
  if (!project) return null
  const template = await db.collection('templates').findOne({ slug: project.template_slug }, { projection: { _id: 0 } })
  return { project: JSON.parse(JSON.stringify(project)), template: template ? JSON.parse(JSON.stringify(template)) : null }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const data = await loadInvitation(slug)
  if (!data) return { title: 'Davetiye bulunamadı | MOMENTIS' }
  const names = [data.project.host_a, data.project.host_b].filter(Boolean).join(' & ') || 'Davetiyemiz'
  const siteSettings = data.project.site_data?.settings || {}
  const configuredTitle = String(siteSettings.seoTitle || '').trim()
  const configuredDescription = String(siteSettings.seoDescription || '').trim()
  const title = (configuredTitle && configuredTitle !== 'Ayşe & Mehmet · 12 Haziran 2027' ? configuredTitle : `${names} | Davetiye`).slice(0, 120)
  const fallbackDescription = String(data.project.title || '').trim() || `${names} etkinliğine davetlisiniz.`
  const description = (configuredDescription && configuredDescription !== 'Düğünümüze davetlisiniz.' ? configuredDescription : fallbackDescription).slice(0, 320)
  const heroSection = Array.isArray(data.project.site_data?.sections)
    ? data.project.site_data.sections.find((section) => section.type === 'hero' && section.visible !== false)
    : null
  const image = [data.project.hero_image, heroSection?.props?.sideImage, heroSection?.props?.image, heroSection?.style?.bgImage, data.template?.cover]
    .find((candidate) => typeof candidate === 'string' && candidate && !candidate.startsWith('data:'))
  const images = image ? [image] : []
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images },
    twitter: { card: images.length ? 'summary_large_image' : 'summary', title, description, images },
  }
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
