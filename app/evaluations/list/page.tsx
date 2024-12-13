'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Evaluation {
  id: number
  agent_name: string
  agent_id: string
  evaluated_at: string
  evaluator: string
}

export default function EvaluationListPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchEvaluations()
  }, [])

  const fetchEvaluations = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching evaluations...')
      const { data, error, status } = await supabase
        .from('evaluations')
        .select(`
          id,
          evaluated_at,
          evaluator,
          agents (
            first_name,
            last_name,
            agent_id
          )
        `)
        .order('evaluated_at', { ascending: false })

      console.log('Supabase response:', { data, error, status })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        console.error('No data returned from the query')
        throw new Error('No data returned from the query')
      }

      const formattedData = data.map(item => {
        if (!item.agents) {
          console.warn(`No agent data for evaluation ${item.id}`)
        }
        return {
          id: item.id,
          agent_name: item.agents ? `${item.agents.first_name} ${item.agents.last_name}` : 'Unknown',
          agent_id: item.agents?.agent_id || 'Unknown',
          evaluated_at: item.evaluated_at,
          evaluator: item.evaluator
        }
      })

      console.log('Formatted data:', formattedData)
      setEvaluations(formattedData)
    } catch (error) {
      console.error('Error in fetchEvaluations:', error)
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      toast({
        title: 'Fehler',
        description: `Fehler beim Laden der Bewertungen: ${errorMessage}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bewertungsübersicht</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/evaluations')}
          >
            Neue Bewertung
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Lade Bewertungen...</p>
      ) : evaluations.length === 0 ? (
        <p>Keine Bewertungen gefunden.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader>
                <CardTitle>{evaluation.agent_name} ({evaluation.agent_id})</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Bewertet am:</strong> {format(new Date(evaluation.evaluated_at), 'dd.MM.yyyy HH:mm')}</p>
                <p><strong>Bewerter:</strong> {evaluation.evaluator}</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push(`/evaluations/${evaluation.id}`)}
                >
                  Details anzeigen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

