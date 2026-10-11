'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '@/components/marketing/footer'
import { Navbar } from '@/components/marketing/navbar'

const VIP_DEMO_PATH = /^\/tasarimlar\/vip\/ozel-[1-5]\/?$/

export function MarketingChrome({ children }) {
  const pathname = usePathname()
  const isVipDemo = VIP_DEMO_PATH.test(pathname || '')

  if (isVipDemo) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
