import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PLANES: Record<string, { priceId: string; nombre: string }> = {
  light: { priceId: 'price_1Ts6gB0PwVndiXSQ0pna2UVZ', nombre: 'Light' },
  pro: { priceId: 'price_1Ts6gV0PwVndiXSQfxagyaDQ', nombre: 'Pro' },
}

export async function POST(request: Request) {
  try {
    const { plan, userId } = await request.json()
    const planData = PLANES[plan]
    if (!planData) throw new Error('Plan no válido')

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: planData.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pago-exitoso?plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precios`,
      metadata: { userId, plan }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}