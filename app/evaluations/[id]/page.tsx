'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Check, X } from 'lucide-react'

interface EvaluationDetail {
  id: number
  agent_name: string
  agent_id: string
  evaluated_at: string
  evaluator: string
  results: {
    criteria_name: string
    category: string
    is_ok: boolean
    rating: number
    background_color: string
  }[]
}

export default function EvaluationDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const fetchEvaluationDetail = useCallback(async (evaluationId: string) => {
    console.log('Fetching evaluation detail for ID:', evaluationId);
    try {
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
          ),
          evaluation_results (
            is_ok,
            rating,
            evaluation_criteria (
              name,
              category,
              background_color
            )
          )
        `)
        .eq('id', evaluationId)
        .single()

      console.log('Supabase response:', { data, error, status });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from the query');
        throw new Error('No data returned from the query');
      }

      const formattedEvaluation: EvaluationDetail = {
        id: data.id,
        agent_name: data.agents ? `${data.agents.first_name} ${data.agents.last_name}` : 'Unknown',
        agent_id: data.agents?.agent_id || 'Unknown',
        evaluated_at: data.evaluated_at,
        evaluator: data.evaluator || 'Unknown User',
        results: data.evaluation_results.map((result: any) => ({
          criteria_name: result.evaluation_criteria.name,
          category: result.evaluation_criteria.category,
          is_ok: result.is_ok,
          rating: result.rating,
          background_color: result.evaluation_criteria.background_color,
        }))
      };

      console.log('Formatted evaluation:', formattedEvaluation);
      setEvaluation(formattedEvaluation);
    } catch (error) {
      console.error('Error in fetchEvaluationDetail:', error);
      let errorMessage = 'Ein unbekannter Fehler ist aufgetreten.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      toast({
        title: 'Fehler',
        description: `Fehler beim Laden der Bewertungsdetails: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (id) {
      fetchEvaluationDetail(id)
    }
  }, [id, fetchEvaluationDetail])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center min-h-[200px]">
          Lade Bewertungsdetails...
        </div>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <p>Bewertung nicht gefunden.</p>
          <Button variant="outline" onClick={() => router.push('/evaluations/list')}>
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bewertungsdetails</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/evaluations/list')}
        >
          Zurück zur Übersicht
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{evaluation.agent_name} ({evaluation.agent_id})</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Bewertet am:</strong> {format(new Date(evaluation.evaluated_at), 'dd.MM.yyyy HH:mm')}</p>
          <p><strong>Bewerter:</strong> {evaluation.evaluator}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {evaluation.results.map((result, index) => (
          <Card key={index} className={result.background_color}>
            <CardHeader>
              <CardTitle>{result.criteria_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Kategorie:</strong> {result.category}</p>
              <div className="flex items-center mt-2">
                <strong className="mr-2">Status:</strong>
                {result.is_ok ? (
                  <span className="flex items-center text-green-600">
                    <Check className="w-4 h-4 mr-1" /> OK
                  </span>
                ) : (
                  <span className="flex items-center text-red-600">
                    <X className="w-4 h-4 mr-1" /> Nicht OK
                  </span>
                )}
              </div>
              <p><strong>Bewertung:</strong> {result.rating}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

