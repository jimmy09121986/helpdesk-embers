'use client'

import { useUser } from '@/contexts/UserContext'
import { HelpModal } from './HelpModal'

const Navigation = () => {
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

  // Für eingeloggte Benutzer wird nichts gerendert
  return null
}

export default Navigation

