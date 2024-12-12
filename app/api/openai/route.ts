import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Überprüfen Sie, ob der API-Schlüssel vorhanden ist
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY ist nicht in den Umgebungsvariablen konfiguriert');
  throw new Error('OpenAI API key is missing');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Ungültige Nachrichtenstruktur' }, { status: 400 });
    }

    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Du bist ein hilfreicher KI-Assistent für einen IT-Helpdesk. Antworte professionell und freundlich auf Deutsch." },
        ...messages
      ],
    });

    if (!openAIResponse.choices[0].message) {
      throw new Error('Unerwartete Antwortstruktur von OpenAI');
    }

    return NextResponse.json({ content: openAIResponse.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API error:', error);
    let errorMessage = 'Interner Serverfehler';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

