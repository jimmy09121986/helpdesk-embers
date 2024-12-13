'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Check, X, List, UserPlus, Edit, Trash } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUser } from '@/contexts/UserContext'

interface Agent {
  id: number
  first_name: string
  last_name: string
  email: string
  agent_id: string
}

interface EvaluationCriteria {
  id: number
  category: string
  name: string
  description: string
  background_color: string
  sort_order: number
}

interface EvaluationResult {
  criteria_id: number
  is_ok: boolean
  rating?: number
  notes?: string
}

export default function EvaluationsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [evaluationDate, setEvaluationDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [results, setResults] = useState<Record<number, EvaluationResult>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    fetchAgents()
    fetchCriteria()
  }, [])

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('last_name, first_name')

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Agenten',
        variant: 'destructive',
      })
    }
  }

  const fetchCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .order('sort_order')

      if (error) throw error
      setCriteria(data || [])
    } catch (error) {
      console.error('Error fetching criteria:', error)
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Bewertungskriterien',
        variant: 'destructive',
      })
    }
  }

  const handleResultChange = (criteriaId: number, field: keyof EvaluationResult, value: any) => {
    setResults(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!selectedAgent || !evaluationDate) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie einen Agenten und ein Datum aus',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: evaluationData, error: evaluationError } = await supabase
        .from('evaluations')
        .insert({
          agent_id: parseInt(selectedAgent),
          evaluated_at: evaluationDate,
          evaluator: user?.email || 'Unknown User',
        })
        .select()
        .single()

      if (evaluationError) throw evaluationError

      const resultsToInsert = Object.entries(results).map(([criteriaId, result]) => ({
        evaluation_id: evaluationData.id,
        criteria_id: parseInt(criteriaId),
        ...result,
      }))

      const { error: resultsError } = await supabase
        .from('evaluation_results')
        .insert(resultsToInsert)

      if (resultsError) throw resultsError

      toast({
        title: 'Erfolg',
        description: 'Bewertung wurde erfolgreich gespeichert',
      })

      setSelectedAgent('')
      setEvaluationDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
      setResults({})
    } catch (error) {
      console.error('Error submitting evaluation:', error)
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      toast({
        title: 'Fehler',
        description: `Fehler beim Speichern der Bewertung: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAgentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const agentData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      agent_id: formData.get('agent_id') as string,
    }

    try {
      if (currentAgent) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update(agentData)
          .eq('id', currentAgent.id)
        if (error) throw error
        toast({ title: 'Agent aktualisiert', description: 'Der Agent wurde erfolgreich aktualisiert.' })
      } else {
        // Create new agent
        const { error } = await supabase
          .from('agents')
          .insert([agentData])
        if (error) throw error
        toast({ title: 'Agent erstellt', description: 'Der neue Agent wurde erfolgreich erstellt.' })
      }
      setIsAgentDialogOpen(false)
      setCurrentAgent(null)
      fetchAgents()
    } catch (error) {
      console.error('Error saving agent:', error)
      toast({
        title: 'Fehler',
        description: 'Fehler beim Speichern des Agenten',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAgent = async (agentId: number) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Agenten löschen möchten?')) {
      try {
        const { error } = await supabase
          .from('agents')
          .delete()
          .eq('id', agentId)
        if (error) throw error
        toast({ title: 'Agent gelöscht', description: 'Der Agent wurde erfolgreich gelöscht.' })
        fetchAgents()
      } catch (error) {
        console.error('Error deleting agent:', error)
        toast({
          title: 'Fehler',
          description: 'Fehler beim Löschen des Agenten',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gesprächsbewertung</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/evaluations/list')}
          >
            <List className="w-4 h-4 mr-2" />
            Bewertungsübersicht
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Neue Bewertung</span>
            <Button onClick={() => { setCurrentAgent(null); setIsAgentDialogOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Neuen Agenten anlegen
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Agent auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.first_name} {agent.last_name} ({agent.agent_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Datum & Uhrzeit</Label>
                <Input
                  type="datetime-local"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {criteria.map((criterion, index) => (
                <div
                  key={criterion.id}
                  className={`p-4 ${criterion.background_color} ${
                    index !== criteria.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-4 items-center">
                    <div>
                      <h3 className="font-medium">{criterion.name}</h3>
                      {criterion.description && (
                        <p className="text-sm text-gray-600">{criterion.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          results[criterion.id]?.is_ok === true
                            ? 'bg-green-100 hover:bg-green-200'
                            : ''
                        }`}
                        onClick={() =>
                          handleResultChange(criterion.id, 'is_ok', true)
                        }
                      >
                        <Check className="w-4 h-4 mr-1" /> OK
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          results[criterion.id]?.is_ok === false
                            ? 'bg-red-100 hover:bg-red-200'
                            : ''
                        }`}
                        onClick={() =>
                          handleResultChange(criterion.id, 'is_ok', false)
                        }
                      >
                        <X className="w-4 h-4 mr-1" /> Nicht OK
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Bewertung</Label>
                      <RadioGroup
                        value={results[criterion.id]?.rating?.toString()}
                        onValueChange={(value) =>
                          handleResultChange(criterion.id, 'rating', parseInt(value))
                        }
                        className="flex items-center space-x-2"
                      >
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center space-x-1">
                            <RadioGroupItem value={rating.toString()} id={`rating-${criterion.id}-${rating}`} />
                            <Label htmlFor={`rating-${criterion.id}-${rating}`}>{rating}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          Abbrechen
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Wird gespeichert...' : 'Bewertung speichern'}
        </Button>
      </div>

      <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAgent ? 'Agent bearbeiten' : 'Neuen Agenten anlegen'}</DialogTitle>
            <DialogDescription>
              Füllen Sie das Formular aus, um einen neuen Agenten anzulegen oder einen bestehenden zu bearbeiten.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAgentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  Vorname
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={currentAgent?.first_name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Nachname
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={currentAgent?.last_name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={currentAgent?.email}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="agent_id" className="text-right">
                  Kennung
                </Label>
                <Input
                  id="agent_id"
                  name="agent_id"
                  defaultValue={currentAgent?.agent_id}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{currentAgent ? 'Aktualisieren' : 'Anlegen'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agenten verwalten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{agent.first_name} {agent.last_name}</p>
                  <p className="text-sm text-gray-500">{agent.email} - {agent.agent_id}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => { setCurrentAgent(agent); setIsAgentDialogOpen(true); }}>
                    <Edit className="w-4 h-4 mr-1" /> Bearbeiten
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAgent(agent.id)}>
                    <Trash className="w-4 h-4 mr-1" /> Löschen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

