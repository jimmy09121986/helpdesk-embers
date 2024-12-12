'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Etwas ist schiefgelaufen!</h2>
      <p className="text-gray-600 mb-4">
        Es tut uns leid, aber es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.
      </p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </div>
  )
}

