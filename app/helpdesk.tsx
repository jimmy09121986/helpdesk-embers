import { SupportTickets } from '@/components/SupportTickets'
import { EmailTest } from '@/components/EmailTest'

export default function Helpdesk() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Helpdesk Embers</h1>
      <div className="space-y-6">
        <EmailTest />
        <SupportTickets />
      </div>
    </main>
  )
}

