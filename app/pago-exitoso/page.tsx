'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

function PagoExitosoContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const actualizarPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !plan) return

      const expires = new Date()
      expires.setMonth(expires.getMonth() + 1)

      await supabase
        .from('profiles')
        .update({
          plan: plan,
          plan_expires_at: expires.toISOString()
        })
        .eq('id', user.id)
    }
    actualizarPlan()
  }, [plan])

  const planNombre = plan === 'pro' ? 'Pro 🔥' : 'Light ⚡'

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido al plan {planNombre}!</h1>
        <p className="text-gray-500 mb-6">
          Ya puedes disfrutar de todos los beneficios de tu suscripción
        </p>
        <Link
          href="/dashboard"
          className="w-full block bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 text-center"
        >
          Ir al Dashboard →
        </Link>
      </div>
    </main>
  )
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <PagoExitosoContent />
    </Suspense>
  )
}