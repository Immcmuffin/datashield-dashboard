import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DataShield — Personal Data Removal',
  description: 'Automatically remove your personal data from data brokers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
