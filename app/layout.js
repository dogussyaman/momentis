import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'MOMENTIS | Premium Dijital Davetiye Stüdyosu',
  description: 'Düğün, nişan, kına ve özel günler için editoryal zarafette dijital davetiyeler. RSVP, konuk yönetimi ve QR anı albümü tek bir yerde.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        <Script id="perf-timing-error-guard" strategy="beforeInteractive">
          {'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}
        </Script>
      </head>
      <body className="font-sans bg-ivory text-midnight">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}