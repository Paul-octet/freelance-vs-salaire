import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Freelance vs Salarie — Simulateur fiscal FR/LU 2026',
  description: 'Le seul simulateur qui compare votre salaire ESN Luxembourg avec tous les statuts freelance en France. Gratuit, precis, mis a jour 2026.',
  keywords: 'freelance, salarie, luxembourg, france, simulateur, fiscal, EURL, SASU, micro-entrepreneur, portage, ESN, frontalier',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-white text-apple-text font-sans">
        {children}
      </body>
    </html>
  )
}
