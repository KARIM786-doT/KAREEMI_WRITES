import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'kareemi_writes — Learn, Explore and Grow',
  description:
    'A thoughtful digital library for curious minds. Explore free learning resources, educational books, and study support with kareemi_writes.',
  icons: {
    icon: '/assets/images/kareemi-globe-icon.png',
    apple: '/assets/images/kareemi-globe-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f6ef',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
