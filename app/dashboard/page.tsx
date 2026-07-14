'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import NotificationSetup from '@/components/NotificationSetup'

interface Profile {
  name: string
  coins: number
}

interface Goal {
  id: string
  title: string
  category: string
  current_streak: number
  longest_streak: number
  total_days: number
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
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
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      setProfile(profileData)
      setGoals(goalsData || [])
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
       <NotificationSetup />
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-gray-800">¡Hola, {profile?.name}!</p>
              <p className="text-xs text-gray-500">Sigue así, no te rindas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1 flex items-center gap-1">
              <span>🪙</span>
              <span className="font-bold text-yellow-700">{profile?.coins}</span>
            </div>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Botón nueva meta */}
        <Link href="/metas/nueva" className="block w-full bg-orange-500 text-white rounded-2xl py-4 text-center font-semibold text-lg hover:bg-orange-600 transition-colors mb-8">
          + Nueva meta
        </Link>

        {/* Mis metas */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Aún no tienes metas</h2>
            <p className="text-gray-400 mb-6">Crea tu primera meta y empieza tu racha hoy</p>
            <Link href="/metas/nueva" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600">
              Crear primera meta →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Mis metas activas</h2>
            {goals.map(goal => (
              <Link key={goal.id} href={`/metas/${goal.id}`}>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{goal.title}</h3>
                      <p className="text-gray-400 text-sm capitalize">{goal.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-2xl">🔥</span>
                        <span className="text-2xl font-bold text-orange-500">{goal.current_streak}</span>
                      </div>
                      <p className="text-xs text-gray-400">días seguidos</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">{goal.total_days}</p>
                      <p className="text-xs text-gray-400">días totales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">{goal.longest_streak}</p>
                      <p className="text-xs text-gray-400">mejor racha</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Nav inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
          <div className="max-w-2xl mx-auto flex justify-around">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-orange-500">
              <span className="text-xl">🏠</span>
              <span className="text-xs font-medium">Inicio</span>
            </Link>
            <Link href="/metas" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500">
              <span className="text-xl">🎯</span>
              <span className="text-xs">Metas</span>
            </Link>
            <Link href="/recompensas" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500">
              <span className="text-xl">🏆</span>
              <span className="text-xs">Premios</span>
            </Link>
            <Link href="/perfil" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500">
              <span className="text-xl">👤</span>
              <span className="text-xs">Perfil</span>
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}