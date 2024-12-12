import { Benachrichtigungen } from './Benachrichtigungen';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Benachrichtigungen - Helpdesk Embers',
  description: 'Übersicht und Verwaltung von Support-Tickets',
};

export default function BenachrichtigungPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <Benachrichtigungen />
    </main>
  );
}

