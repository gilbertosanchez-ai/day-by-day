'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import BottomNav from '@/components/BottomNav'

interface Profile {
  coins: number
  name: string
}

export default function RecompensasPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalVistas, setTotalVistas] = useState(0)

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

      const { data: postsData } = await supabase
        .from('posts')
        .select('views_count')
        .eq('user_id', user.id)

      const vistas = (postsData || []).reduce((acc, p) => acc + (p.views_count || 0), 0)

      setProfile(profileData)
      setTotalVistas(vistas)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const pesos = profile ? Math.floor(profile.coins / 20) : 0
  const puederetirar = pesos >= 25

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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🏆 Premios</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1 flex items-center gap-1">
            <span>🪙</span>
            <span className="font-bold text-yellow-700">{profile?.coins}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">

        {/* Bloque 1 — Monedas a dinero */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4">
            <h2 className="text-white font-black text-lg">💰 Tus monedas valen dinero</h2>
            <p className="text-white/80 text-sm">20 monedas = $1 peso mexicano</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-black text-gray-800">🪙 {profile?.coins}</p>
                <p className="text-gray-400 text-sm">monedas acumuladas</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-green-600">${pesos}</p>
                <p className="text-gray-400 text-sm">pesos disponibles</p>
              </div>
            </div>

            {/* Barra de progreso hacia $25 */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>$0</span>
                <span>Mínimo de retiro: $25</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min((pesos / 25) * 100, 100)}%` }}
                />
              </div>
              {!puederetirar && (
                <p className="text-xs text-gray-400 mt-1">
                  Te faltan ${25 - pesos} pesos — sigue cumpliendo tus metas 🔥
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                disabled
                className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                🏦 Retirar a cuenta bancaria
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Próximamente</span>
              </button>
              <button
                disabled
                className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                🛍️ Canjear por productos DbD
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Próximamente</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bloque 2 — Vistas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
            <h2 className="text-white font-black text-lg">👁️ Tus vistas también valen</h2>
            <p className="text-white/80 text-sm">Comparte tu progreso y gana por cada vista</p>
          </div>
          <div className="p-6">
            <div className="text-center mb-4">
              <p className="text-5xl font-black text-gray-800">{totalVistas.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-1">vistas totales en tus posts</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center mb-4">
              <p className="text-purple-700 font-bold text-sm">🚀 Monetización por vistas</p>
              <p className="text-purple-500 text-xs mt-1">
                Pronto podrás ganar dinero por cada vista en tus videos — como TikTok pero enfocado en perseverancia
              </p>
            </div>

            <button
              disabled
              className="w-full bg-purple-500 text-white rounded-xl py-3 font-semibold opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
            >
              💸 Cobrar por vistas
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">Próximamente</span>
            </button>
          </div>
        </div>

        {/* Bloque 3 — Cómo ganar más monedas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">⚡ ¿Cómo ganar más monedas?</h3>
          <div className="space-y-3">
            {[
              { emoji: '✅', texto: 'Cumple tu meta diaria', monedas: '+5 🪙' },
              { emoji: '🔥', texto: 'Racha de 7 días', monedas: '+35 🪙' },
              { emoji: '🏆', texto: 'Racha de 30 días', monedas: '+150 🪙' },
              { emoji: '👥', texto: 'Invita un amigo', monedas: '+550 🪙' },
              { emoji: '📸', texto: 'Comparte tu logro en el feed', monedas: '+10 🪙' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-sm text-gray-700">{item.texto}</p>
                </div>
                <span className="text-sm font-bold text-yellow-600">{item.monedas}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <BottomNav active="recompensas" />
    </main>
  )
}