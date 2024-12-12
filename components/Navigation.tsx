'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { useUser } from '@/contexts/UserContext'
import { Button } from "@/components/ui/button"
import { HelpModal } from './HelpModal'

const Navigation = () => {
  const pathname = usePathname()
  const { user } = useUser()

  if (!user) {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end h-16">
            <div className="flex items-center space-x-4">
              <HelpModal />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="flex space-x-4 mb-4">
      <Link href="/dashboard" className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
      )}>
        Dashboard
      </Link>
      {/* Fügen Sie hier weitere Links für eingeloggte Benutzer hinzu */}
    </nav>
  )
}

export default Navigation

