'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Friend {
  id: string
  status: string
  user_id: string
  friend_id: string
  profiles: {
    name: string
    username: string
  }
}

interface SearchResult {
  id: string
  name: string
  username: string
}

export default function AmigosPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [myUsername, setMyUsername] = useState<string>('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultado, setResultado] = useState<SearchResult | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Mi username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      setMyUsername(profile?.username || '')

      // Mis amigos (aceptados y pendientes)
      const { data: friendsData } = await supabase
        .from('friendships')
        .select('*, profiles!friendships_friend_id_fkey(name, username)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFriends(friendsData || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const buscarAmigo = async () => {
    if (!busqueda.trim() || !userId) return
    setBuscando(true)
    setResultado(null)
    setNoEncontrado(false)

    const { data } = await supabase
      .from('profiles')
      .select('id, name, username')
      .eq('username', busqueda.trim().toLowerCase())
      .single()

    if (!data || data.id === userId) {
      setNoEncontrado(true)
    } else {
      setResultado(data)
    }
    setBuscando(false)
  }

  const enviarSolicitud = async (friendId: string) => {
    if (!userId) return

    // Verificar si ya existe
    const { data: existe } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .single()

    if (existe) {
      alert('Ya enviaste una solicitud a este usuario')
      return
    }

    await supabase.from('friendships').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending'
    })

    setResultado(null)
    setBusqueda('')
    alert('¡Solicitud enviada! 🤝')
  }

  const aceptarSolicitud = async (friendshipId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    setFriends(prev => prev.map(f =>
      f.id === friendshipId ? { ...f, status: 'accepted' } : f
    ))
  }

  const pendientes = friends.filter(f => f.status === 'pending')
  const aceptados = friends.filter(f => f.status === 'accepted')

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
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/social" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-800">👥 Amigos</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">

        {/* Mi código */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <p className="text-sm text-orange-700 font-medium mb-1">Tu código de usuario</p>
          <p className="text-2xl font-bold text-orange-600">@{myUsername}</p>
          <p className="text-xs text-orange-500 mt-1">Comparte este código para que te agreguen</p>
        </div>

        {/* Buscar amigo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-3">Agregar amigo</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarAmigo()}
              placeholder="@username"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
            />
            <button
              onClick={buscarAmigo}
              disabled={buscando}
              className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>

          {noEncontrado && (
            <p className="text-sm text-red-400 mt-3">No encontramos ese usuario 😕</p>
          )}

          {resultado && (
            <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="font-bold text-gray-800">{resultado.name}</p>
                <p className="text-xs text-gray-400">@{resultado.username}</p>
              </div>
              <button
                onClick={() => enviarSolicitud(resultado.id)}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600"
              >
                Agregar 🤝
              </button>
            </div>
          )}
        </div>

        {/* Solicitudes pendientes */}
        {pendientes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-3">Solicitudes pendientes</h2>
            <div className="space-y-3">
              {pendientes.map(f => (
                <div key={f.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{f.profiles?.name}</p>
                    <p className="text-xs text-gray-400">@{f.profiles?.username}</p>
                  </div>
                  <button
                    onClick={() => aceptarSolicitud(f.id)}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-green-600"
                  >
                    Aceptar ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de amigos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-3">
            Mis amigos {aceptados.length > 0 && `(${aceptados.length})`}
          </h2>
          {aceptados.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aún no tienes amigos agregados</p>
          ) : (
            <div className="space-y-3">
              {aceptados.map(f => (
                <div key={f.id} className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                    🔥
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">{f.profiles?.name}</p>
                    <p className="text-xs text-gray-400">@{f.profiles?.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav active="social" />
    </main>
  )
}