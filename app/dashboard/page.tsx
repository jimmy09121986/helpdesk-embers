import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { UserProvider } from '@/contexts/UserContext'
import Navigation from '@/components/Navigation'
import { Toaster } from "@/components/ui/toaster"
import DashboardContent from '@/components/DashboardContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fehlerverwaltungssystem',
  description: 'Ein System zur Verwaltung und Suche von Fehlermeldungen',
}

export default function DashboardPage() {
  return (
    <div className={inter.className}>
      <UserProvider>
        <div className="container mx-auto p-4">
          <Navigation />
          <DashboardContent />
        </div>
        <Toaster />
      </UserProvider>
    </div>
  )
}

