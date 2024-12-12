import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle, Search, TicketIcon, Bot, User } from 'lucide-react'

export function HelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <HelpCircle className="mr-2 h-4 w-4" />
          Hilfe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Willkommen bei Embers - Helpdesk</DialogTitle>
          <DialogDescription>
            Hier finden Sie Unterstützung für all Ihre technischen Fragen und Probleme.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Search className="h-6 w-6 text-blue-500" />
            <div>
              <h4 className="font-medium">Fehlermeldung suchen</h4>
              <p className="text-sm text-gray-500">Durchsuchen Sie unsere Wissensdatenbank nach Lösungen.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TicketIcon className="h-6 w-6 text-purple-500" />
            <div>
              <h4 className="font-medium">Support-Ticket erstellen</h4>
              <p className="text-sm text-gray-500">Reichen Sie ein Ticket ein, wenn Sie weitere Hilfe benötigen.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bot className="h-6 w-6 text-green-500" />
            <div>
              <h4 className="font-medium">AI-Assistent</h4>
              <p className="text-sm text-gray-500">Nutzen Sie unseren KI-gestützten Chatbot für sofortige Hilfe.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <User className="h-6 w-6 text-orange-500" />
            <div>
              <h4 className="font-medium">Admin-Bereich</h4>
              <p className="text-sm text-gray-500">Für autorisierte Benutzer.</p>
            </div>
          </div>
        </div>
        <DialogTrigger asChild>
          <Button className="w-full">Verstanden</Button>
        </DialogTrigger>
      </DialogContent>
    </Dialog>
  )
}
