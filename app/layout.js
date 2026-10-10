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
    <html lang="tr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&amp;family=Allura&amp;family=Ballet&amp;family=Bebas+Neue&amp;family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600;6..96,700&amp;family=Cinzel:wght@400;500;600;700&amp;family=Cormorant+Garamond:wght@400;500;600;700&amp;family=Cormorant+SC:wght@400;500;600;700&amp;family=Dancing+Script:wght@400;500;600;700&amp;family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&amp;family=DM+Serif+Display&amp;family=EB+Garamond:wght@400;500;600;700&amp;family=Great+Vibes&amp;family=Italianno&amp;family=Josefin+Sans:wght@400;500;600;700&amp;family=Libre+Baskerville:wght@400;700&amp;family=Lora:wght@400;500;600;700&amp;family=Marck+Script&amp;family=Montserrat:wght@400;500;600;700&amp;family=Parisienne&amp;family=Pinyon+Script&amp;family=Poppins:wght@400;500;600;700&amp;family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&amp;family=Raleway:wght@400;500;600;700&amp;family=Sacramento&amp;family=Satisfy&amp;family=Tangerine:wght@400;700&amp;family=Oswald:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
        <Script id="perf-timing-error-guard" strategy="beforeInteractive">
          {'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}
        </Script>
      </head>
      <body className="font-sans bg-ivory text-midnight">
        <Providers>{children}</Providers>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#f8f5f1',
              color: '#111827',
              border: '1px solid #e2dcd0',
              borderRadius: '1rem',
              boxShadow: '0 10px 40px -10px rgba(17,24,39,0.15)',
              padding: '16px 20px',
            },
            className: 'font-sans text-sm font-medium tracking-wide',
          }}
        />
      </body>
    </html>
  )
}