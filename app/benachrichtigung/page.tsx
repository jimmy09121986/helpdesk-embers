import { Benachrichtigungen } from './Benachrichtigungen';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Benachrichtigungen - Helpdesk Embers',
  description: 'Übersicht und Verwaltung von Support-Tickets',
};

export default function BenachrichtigungPage() {
  return (
    <main className="container mx-auto p-4">
      <Benachrichtigungen />
    </main>
  );
}

