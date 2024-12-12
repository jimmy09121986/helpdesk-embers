'use client'

import { SupportTickets } from '@/components/SupportTickets'
import Head from 'next/head'

export default function SupportTicketsPage() {
  return (
    <>
      <Head>
        <title>Support Tickets</title>
      </Head>
      <SupportTickets />
    </>
  )
}

