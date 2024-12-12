'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export function NotificationsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      if (data) {
        const emailList = data.users.map(user => user.email).filter(Boolean) as string[];
        setEmails(emailList);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mails:', error);
      toast({
        title: 'Fehler beim Laden der E-Mail-Adressen',
        description: 'Die E-Mail-Adressen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>Benachrichtigungen</CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Registrierte E-Mail-Adressen:</h2>
          <ul className="list-disc pl-5">
            {emails.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

