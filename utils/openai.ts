import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getOpenAIResponse(conversation: { role: string; content: string }[]) {
  try {
    const openAIResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Du bist ein hilfreicher KI-Assistent für einen IT-Helpdesk. Antworte professionell und freundlich auf Deutsch." },
        ...conversation.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content }))
      ],
    })

    return openAIResponse.choices[0].message.content || "Entschuldigung, ich konnte keine passende Antwort generieren. Können Sie Ihre Frage bitte umformulieren?"
  } catch (error) {
    console.error('Fehler bei der OpenAI API-Anfrage:', error)
    return "Es tut mir leid, aber ich konnte keine Antwort von unserem KI-System erhalten. Bitte versuchen Sie es später erneut."
  }
}

