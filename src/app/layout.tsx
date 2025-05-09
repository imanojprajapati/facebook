import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { KeyboardCheatSheet } from '@/components/KeyboardCheatSheet'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Facebook Pages Manager',
  description: 'Manage your Facebook pages efficiently',
  manifest: '/manifest.json',
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
