'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bot, ThumbsUp, ThumbsDown, ArrowRight, Sparkles, User, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { fuzzySearch, findPartialMatches, prioritizeSolutions } from '../utils/search'
import { motion, AnimatePresence } from 'framer-motion'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function AIAssistant() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [conversation, setConversation] = useState<{role: string, content: string}[]>([])
  const [currentCategory, setCurrentCategory] = useState('')
  const [currentError, setCurrentError] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentSolution, setCurrentSolution] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [conversation])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('name')
    if (error) {
      console.error('Fehler beim Abrufen der Kategorien:', error)
    } else {
      setCategories(data.map(category => category.name))
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setFeedbackGiven(false)

    const updatedConversation = [...conversation, { role: 'user', content: query }]
    setConversation(updatedConversation)
    setQuery('')

    try {
      let aiResponse = ''

      if (conversation.length === 0) {
        aiResponse = `Guten Tag! Ich bin Ihr KI-Assistent und stehe Ihnen gerne zur Verfügung. Wie kann ich Ihnen heute helfen?`
      } else if (awaitingConfirmation) {
        if (query.toLowerCase().includes('ja')) {
          aiResponse = `Hier ist eine mögliche Lösung für Ihr Problem mit "${currentError}":

${currentSolution}

Ich hoffe, das hilft Ihnen weiter. Lassen Sie mich wissen, ob Sie weitere Fragen haben oder zusätzliche Hilfe benötigen.`
          setAwaitingConfirmation(false)
        } else {
          aiResponse = `Ich verstehe. Lassen Sie uns Ihr Problem mit "${currentError}" genauer betrachten. Können Sie mir mehr Details dazu geben? Welche spezifischen Schwierigkeiten erleben Sie?`
          setAwaitingConfirmation(false)
        }
      } else {
        const { data: categoriesData } = await supabase.from('categories').select('id, name')
        const { data: errorsData } = await supabase.from('errors').select('id, description, solution')

        const matchedCategories = fuzzySearch(categoriesData, ['name'], query, 0.3)
        const matchedErrors = fuzzySearch(errorsData, ['description'], query, 0.3)
        const partialMatchErrors = findPartialMatches(errorsData, 'description', query)
        const prioritizedSolutions = prioritizeSolutions([...matchedErrors, ...partialMatchErrors], query)

        if (matchedCategories.length > 0 || prioritizedSolutions.length > 0) {
          if (matchedCategories.length > 0) {
            setCurrentCategory(matchedCategories[0].name)
            aiResponse = `Ich sehe, dass Sie Hilfe im Bereich "${matchedCategories[0].name}" benötigen. Können Sie mir mehr Details zu Ihrem spezifischen Problem oder Ihrer Frage in dieser Kategorie geben?`
          } else {
            setCurrentError(prioritizedSolutions[0].description)
            setCurrentSolution(prioritizedSolutions[0].solution)
            aiResponse = `Ich sehe, dass Sie Probleme mit "${prioritizedSolutions[0].description}" haben. Ich habe eine mögliche Lösung gefunden. Möchten Sie, dass ich Ihnen diese Lösung zeige?`
            setAwaitingConfirmation(true)
          }
        } else {
          // Fallback-Logik, wenn keine passende Lösung gefunden wurde
          aiResponse = generateFallbackResponse(query)
        }
      }

      setConversation([...updatedConversation, { role: 'assistant', content: aiResponse }])
    } catch (error) {
      console.error('Fehler bei der Verarbeitung der Anfrage:', error)
      let errorMessage = 'Es tut mir leid, aber es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie unseren Support für weitere Unterstützung.';
      if (error instanceof Error) {
        errorMessage += ` Fehlermeldung: ${error.message}`;
      }
      setConversation([...updatedConversation, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  const generateFallbackResponse = (query: string): string => {
    const lowercaseQuery = query.toLowerCase()
    
    if (lowercaseQuery.includes('passwort')) {
      return "Für Passwortprobleme empfehle ich Ihnen, das Passwort zurückzusetzen. Gehen Sie dazu auf die Login-Seite und klicken Sie auf 'Passwort vergessen'. Folgen Sie dann den Anweisungen in der E-Mail, die Sie erhalten."
    } else if (lowercaseQuery.includes('anmelden') || lowercaseQuery.includes('login')) {
      return "Bei Problemen mit der Anmeldung überprüfen Sie bitte zunächst, ob Ihre Zugangsdaten korrekt sind. Wenn Sie sich immer noch nicht anmelden können, versuchen Sie, Ihren Browser-Cache zu leeren oder ein anderes Gerät zu verwenden."
    } else if (lowercaseQuery.includes('konto') || lowercaseQuery.includes('account')) {
      return "Für Fragen zu Ihrem Konto wenden Sie sich bitte an unseren Support."
    } else {
      return "Entschuldigung, ich konnte keine spezifische Antwort auf Ihre Frage finden. Können Sie Ihr Anliegen bitte genauer beschreiben oder umformulieren? Alternativ können Sie auch unseren Support kontaktieren für persönliche Unterstützung."
    }
  }

  const handleFeedback = async (isPositive: boolean) => {
    if (feedbackGiven) return

    try {
      await supabase.from('feedback').insert({ query: currentError, response: conversation[conversation.length - 1].content, is_positive: isPositive })
      setFeedbackGiven(true)
      setConversation([...conversation, { role: 'system', content: 'Vielen Dank für Ihr Feedback! Es hilft uns, unseren Service kontinuierlich zu verbessern.' }])
    } catch (error) {
      console.error('Fehler beim Speichern des Feedbacks:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader 
        className="space-y-1 pb-3 border-b cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">KI-Assistent</CardTitle>
              <CardDescription className="text-xs">Chat Bot</CardDescription>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-4">
              <div ref={chatContainerRef} className="space-y-2 mb-2 h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <AnimatePresence initial={false}>
                  {conversation.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`p-2 rounded-lg max-w-[85%] ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : message.role === 'assistant'
                          ? 'bg-gray-200 dark:bg-gray-700'
                          : 'bg-green-100 dark:bg-green-900 text-center'
                      }`}>
                        <div className="flex items-center space-x-1 mb-0.5">
                          {message.role === 'user' ? (
                            <User className="w-3 h-3" />
                          ) : message.role === 'assistant' ? (
                            <Bot className="w-3 h-3" />
                          ) : null}
                          <p className="text-[10px] font-semibold">
                            {message.role === 'user' ? 'Sie' : message.role === 'assistant' ? 'KI-Assistent' : 'System'}
                          </p>
                        </div>
                        <p className="text-xs">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    className="pl-3 pr-10 py-2 text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50"
                    placeholder="Stellen Sie Ihre Frage..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>

              <AnimatePresence>
                {!feedbackGiven && conversation.length > 0 && conversation[conversation.length - 1].role === 'assistant' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-end space-x-2 pt-2 mt-4"
                  >
                    <Button
                      onClick={() => handleFeedback(true)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-green-50 dark:hover:bg-green-900/20 text-xs"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
                      Hilfreich
                    </Button>
                    <Button
                      onClick={() => handleFeedback(false)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                    >
                      <ThumbsDown className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" />
                      Nicht hilfreich
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

