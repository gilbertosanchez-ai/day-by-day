'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Profile {
  name: string
  coins: number
  created_at: string
  plan: string
}

interface Goal {
  id: string
  title: string
  current_streak: number
  total_days: number
  status: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [totalDias, setTotalDias] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const total = goalsData?.reduce((acc, g) => acc + g.total_days, 0) || 0

      setProfile(profileData)
      setGoals(goalsData || [])
      setTotalDias(total)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/landing'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-800">👤 Mi Perfil</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* Avatar y nombre */}
<div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
    🔥
  </div>
  <h2 className="text-2xl font-bold text-gray-800">{profile?.name}</h2>
  <p className="text-gray-400 text-sm mt-1">
    Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
  </p>

  {/* Plan actual */}
  <div className="mt-4">
    {profile?.plan === 'free' && (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-500 mb-2">Estás en el plan <strong>Free</strong></p>
        <a href="/precios" className="block w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-600">
          ⚡ Mejora a Light o Pro →
        </a>
      </div>
    )}
    {profile?.plan === 'light' && (
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-600 mb-2">Plan <strong>Light ⚡</strong> activo</p>
        <a href="/precios" className="block w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-600">
          🔥 Mejora a Pro →
        </a>
      </div>
    )}
    {profile?.plan === 'pro' && (
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
        <p className="text-sm text-orange-600 font-bold">🔥 Plan Pro activo</p>
        <p className="text-xs text-gray-400 mt-1">Tienes acceso a todo</p>
      </div>
    )}
  </div>
</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-orange-500">{goals.filter(g => g.status === 'active').length}</p>
            <p className="text-xs text-gray-400 mt-1">Metas activas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-orange-500">{totalDias}</p>
            <p className="text-xs text-gray-400 mt-1">Días cumplidos</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl shadow-sm p-4 text-center border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">🪙{profile?.coins}</p>
            <p className="text-xs text-gray-400 mt-1">Monedas</p>
          </div>
        </div>

        {/* Mis metas */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Mis metas</h3>
          <div className="space-y-3">
            {goals.map(goal => (
              <Link key={goal.id} href={`/metas/${goal.id}`}>
                <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2">
                  <div>
                    <p className="font-medium text-gray-700">{goal.title}</p>
                    <p className="text-xs text-gray-400">{goal.total_days} días cumplidos</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔥</span>
                    <span className="font-bold text-orange-500">{goal.current_streak}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full border border-red-200 text-red-500 rounded-xl py-3 font-medium hover:bg-red-50"
        >
          Cerrar sesión
        </button>

      </div>

      <BottomNav active="perfil" />

    </main>
  )
}