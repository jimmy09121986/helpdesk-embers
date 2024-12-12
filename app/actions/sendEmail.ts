'use server'

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendTicketAssignmentEmail(userEmail: string, ticketId: number) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Email sending is disabled.')
    return { success: false, error: 'Email sending is not configured' }
  }

  try {
    await resend.emails.send({
      from: 'Helpdesk <noreply@yourdomain.com>',
      to: userEmail,
      subject: `Ticket #${ticketId} übernommen`,
      html: `<p>Sie haben das Ticket #${ticketId} übernommen. Bitte bearbeiten Sie es zeitnah.</p>`
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
