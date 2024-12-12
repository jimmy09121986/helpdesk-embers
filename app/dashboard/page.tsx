'use client'

import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { UserProvider } from '@/contexts/UserContext'
import Navigation from '@/components/Navigation'
import { Toaster } from "@/components/ui/toaster"
import DashboardContent from '@/components/DashboardContent'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null // oder eine Lade-Animation
  }

  return (
    <div className={inter.className}>
      <div className="container mx-auto p-4">
        <Navigation />
        <DashboardContent />
      </div>
      <Toaster />
    </div>
  )
}

