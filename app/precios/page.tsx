'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const planes = [
  {
    id: 'free',
    nombre: 'Free',
    precio: 0,
    metas: 1,
    monedas: 0,
    recompensas: false,
    descripcion: 'Para empezar',
    features: ['1 meta activa', 'Racha diaria', 'Sin monedas', 'Sin recompensas'],
    color: 'gray'
  },
 {
    id: 'light',
    nombre: 'Light',
    precio: 49,
    metas: 3,
    monedas: 6,
    recompensas: true,
    descripcion: 'Para comprometidos',
    features: ['3 metas activas', 'Racha diaria', 'Hasta 6 monedas/día', 'Acceso a recompensas'],
    color: 'blue',
    popular: false,
    promo: true
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 99,
    metas: -1,
    monedas: 10,
    recompensas: true,
    descripcion: 'Para los que van en serio',
    features: ['Metas ilimitadas', 'Racha diaria', 'Hasta 10 monedas/día', 'Acceso a recompensas', 'Prioridad en soporte'],
    color: 'orange',
    popular: true
  }
]

export default function PreciosPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [planActual, setPlanActual] = useState<string>('free')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()
        setPlanActual(profile?.plan || 'free')
      }
    }
    cargarUsuario()
  }, [])

  const handleComprar = async (planId: string) => {
    if (planId === 'free') return
    setLoading(planId)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, userId })
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Error: ' + data.error)
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-600 text-2xl">←</a>
          <h1 className="text-xl font-bold text-gray-800">💎 Planes</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Elige tu plan</h2>
          <p className="text-gray-500">Cancela cuando quieras</p>
        </div>

        <div className="space-y-4">
          {planes.map(plan => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 border-2 relative ${
                plan.popular ? 'border-orange-400 shadow-lg' : 'border-gray-100'
              } ${planActual === plan.id ? 'ring-2 ring-green-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              {planActual === plan.id && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  TU PLAN ACTUAL
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{plan.nombre}</h3>
                  <p className="text-gray-400 text-sm">{plan.descripcion}</p>
                </div>
                 <div className="text-right">
                  {plan.precio === 0 ? (
                    <p className="text-2xl font-bold text-gray-800">Gratis</p>
                  ) : (plan as any).promo ? (
                    <div>
                      <span className="text-sm line-through text-gray-400">${plan.precio} MXN/mes</span>
                      <p className="text-2xl font-bold text-green-600">¡Gratis!</p>
                      <p className="text-xs text-green-500 font-medium">primeros 12 meses 🎁</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-800">${plan.precio}</span>
                      <span className="text-gray-400 text-sm"> MXN/mes</span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <div className="w-full py-3 rounded-xl text-center text-sm font-medium bg-gray-100 text-gray-500">
                  {planActual === 'free' ? 'Plan actual' : 'Plan gratuito'}
                </div>
              ) : (
                <button
                  onClick={() => handleComprar(plan.id)}
                  disabled={loading === plan.id || planActual === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    planActual === plan.id
                      ? 'bg-green-100 text-green-600 cursor-default'
                      : plan.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? 'Redirigiendo...' : planActual === plan.id ? '✓ Plan activo' : (plan as any).promo ? 'Activar gratis por 12 meses' : `Suscribirse a ${plan.nombre}`}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Pago seguro con Stripe · Cancela cuando quieras · Sin contratos
        </p>
      </div>
    </main>
  )
}