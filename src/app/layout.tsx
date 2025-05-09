import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

const KeyboardCheatSheet = dynamic(
  () => import('@/components/KeyboardCheatSheet').then(mod => mod.default),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Facebook Pages Manager',
  description: 'Manage your Facebook pages efficiently',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1877f2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <KeyboardCheatSheet />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
