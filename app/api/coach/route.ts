import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `Eres un coach de hábitos amigable y motivador para la app "Day by Day". Tu trabajo es ayudar al usuario a definir una meta clara y alcanzable mediante preguntas cortas y conversacionales.

Guía la conversación así:
1. Entiende qué quiere lograr
2. Evalúa si tiene lo necesario (recursos, tiempo, conocimiento)
3. Si le falta algo, sugiere una meta previa más pequeña (ej: si quiere tocar saxofón pero no tiene uno, primero sugiere ahorrar para comprarlo)
4. Define la frecuencia ideal (diario o semanal)
5. Cuando tengas suficiente info (máximo 4-5 preguntas), termina con este formato EXACTO sin texto después:

META_LISTA:{"title":"nombre corto de la meta","reason":"motivación del usuario","category":"salud|espiritualidad|estudio|negocio|ahorro|habito|general","frequency":"daily|weekly"}

Sé breve, motivador y en español. Máximo 2-3 oraciones por respuesta.`,
      messages
    })
  })

  const data = await response.json()
  return NextResponse.json(data)
}