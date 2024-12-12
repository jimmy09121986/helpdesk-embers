'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useUser } from '../contexts/UserContext'
import { useToast } from "@/components/ui/use-toast"
import { SupportTicketDialog } from '../components/SupportTicketDialog'
import { Label } from "@/components/ui/label"
import { Loader2, Lock, Mail, Search, TicketIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpModal } from '../components/HelpModal'

export default function Home() {
  const { user, login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginExpanded, setIsLoginExpanded] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!email || !password) {
        throw new Error('Email und Passwort sind erforderlich');
      }
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      let errorMessage = "E-Mail oder Passwort ist falsch.";
      if (error instanceof Error) {
        if (error.message === 'Email und Passwort sind erforderlich') {
          errorMessage = "Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.";
        } else if (error.name === 'AuthApiError') {
          errorMessage = "Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.";
        }
      }
      toast({
        title: "Anmeldefehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Embers - Helpdesk
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Support - Seite 
            </p>
          </motion.div>

          <div className="w-full max-w-2xl">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-xl border-0">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <Button
                    onClick={() => setIsLoginExpanded(!isLoginExpanded)}
                    className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-200 flex justify-between items-center py-6 text-lg"
                  >
                    Admin Login
                    {isLoginExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </Button>

                  <AnimatePresence>
                    {isLoginExpanded && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleLogin}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            E-Mail
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                              id="email"
                              placeholder="name@beispiel.de"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Passwort
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary"
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-200 py-6 text-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Wird angemeldet...
                            </>
                          ) : (
                            'Anmelden'
                          )}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="pt-4 space-y-4">
                    <Button
                      asChild
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200 shadow-md py-6 text-lg"
                    >
                      <Link href="/search" className="flex items-center justify-center">
                        <Search className="mr-2 h-6 w-6" />
                        Fehlermeldung suchen
                      </Link>
                    </Button>
                    <SupportTicketDialog>
                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 shadow-md flex items-center justify-center py-6 text-lg">
                        <TicketIcon className="mr-2 h-6 w-6" />
                        Support-Ticket erstellen
                      </Button>
                    </SupportTicketDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Jimmy Wilhelmer. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  )
}

