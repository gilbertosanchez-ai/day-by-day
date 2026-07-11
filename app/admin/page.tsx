'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const ADMIN_ID = '36da5a67-b0be-4714-ab6c-753f6ec9ec1e'

interface Redemption {
  id: string
  created_at: string
  coins_spent: number
  status: string
  profiles: { name: string }
  rewards: { title: string }
}

interface UserStat {
  id: string
  name: string
  plan: string
  coins: number
  created_at: string
}

export default function AdminPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [users, setUsers] = useState<UserStat[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'canjes' | 'usuarios'>('canjes')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== ADMIN_ID) {
        router.push('/dashboard')
        return
      }

      const { data: redemptionsData } = await supabase
        .from('redemptions')
        .select('*, profiles(name), rewards(title)')
        .order('created_at', { ascending: false })

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      setRedemptions(redemptionsData || [])
      setUsers(usersData || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase
      .from('redemptions')
      .update({ status })
      .eq('id', id)

    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  const pendientes = redemptions.filter(r => r.status === 'pending')
  const completados = redemptions.filter(r => r.status === 'completed')
  const usuariosPro = users.filter(u => u.plan === 'pro').length
  const usuariosLight = users.filter(u => u.plan === 'light').length

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">⚙️ Panel Admin</h1>
            <p className="text-xs text-gray-400">Day by Day</p>
          </div>
          <a href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← Volver
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-400 mt-1">Usuarios totales</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-3xl font-bold text-orange-500">{usuariosPro}</p>
            <p className="text-xs text-gray-400 mt-1">Plan Pro</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-3xl font-bold text-blue-500">{usuariosLight}</p>
            <p className="text-xs text-gray-400 mt-1">Plan Light</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center">
            <p className="text-3xl font-bold text-orange-600">{pendientes.length}</p>
            <p className="text-xs text-gray-400 mt-1">Canjes pendientes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('canjes')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'canjes' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            🏆 Canjes {pendientes.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">{pendientes.length}</span>}
          </button>
          <button
            onClick={() => setTab('usuarios')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'usuarios' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            👥 Usuarios
          </button>
        </div>

        {/* Canjes */}
        {tab === 'canjes' && (
          <div className="space-y-4">
            {redemptions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <div className="text-5xl mb-4">🏆</div>
                <p className="text-gray-400">No hay canjes aún</p>
              </div>
            ) : (
              redemptions.map(r => (
                <div key={r.id} className={`bg-white rounded-2xl p-5 border ${r.status === 'pending' ? 'border-orange-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{r.rewards?.title}</p>
                      <p className="text-sm text-gray-500">👤 {r.profiles?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        🪙 {r.coins_spent} monedas · {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'pending' ? 'bg-orange-100 text-orange-600' : r.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {r.status === 'pending' ? '⏳ Pendiente' : r.status === 'completed' ? '✅ Entregado' : '❌ Cancelado'}
                      </span>
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'completed')}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                          >
                            ✅ Entregar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                            className="text-xs bg-red-100 text-red-500 px-3 py-1 rounded-lg hover:bg-red-200"
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Usuarios */}
        {tab === 'usuarios' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">
                    Desde {new Date(u.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-600">🪙 {u.coins}</p>
                    <p className="text-xs text-gray-400">monedas</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${u.plan === 'pro' ? 'bg-orange-100 text-orange-600' : u.plan === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {u.plan.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}