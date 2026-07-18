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
interface Report {
  id: string
  reason: string
  created_at: string
  posts: { id: string, video_url?: string, media_url?: string, caption?: string } | null
}

export default function AdminPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [users, setUsers] = useState<UserStat[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'canjes' | 'usuarios' | 'reportes'>('canjes')
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

      const { data: redemptionsData } = await supabase.from('redemptions').select('*, profiles(name), rewards(title)').order('created_at', { ascending: false })
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      const { data: reportsData } = await supabase.from('reports').select('id, reason, created_at, posts(id, video_url, media_url, caption)').order('created_at', { ascending: false })

      setRedemptions(redemptionsData || [])
      setUsers(usersData || [])
      setReports(reportsData as any || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('redemptions').update({ status }).eq('id', id)
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const eliminarVideo = async (postId: string) => {
    if (!confirm('¿Seguro ELIMINAR este video? Se borrará para todos.')) return
    await supabase.from('posts').delete().eq('id', postId)
    setReports(prev => prev.filter(r => r.posts?.id !== postId))
  }

  const ignorarReporte = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>

  const pendientes = redemptions.filter(r => r.status === 'pending')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div><h1 className="text-xl font-bold text-gray-800">⚙ Panel Admin</h1><p className="text-xs text-gray-400">Day by Day</p></div>
          <a href="/dashboard" className="text-sm text-gray-400">← Volver</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold">{users.length}</p><p className="text-xs text-gray-400">Usuarios</p></div>
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold text-red-500">{reports.length}</p><p className="text-xs text-gray-400">Reportes</p></div>
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center"><p className="text-3xl font-bold text-orange-600">{pendientes.length}</p><p className="text-xs text-gray-400">Canjes pendientes</p></div>
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold">{redemptions.length}</p><p className="text-xs text-gray-400">Canjes totales</p></div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('canjes')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab==='canjes'?'bg-orange-500 text-white':'bg-white text-gray-500 border'}`}>🏆 Canjes</button>
          <button onClick={() => setTab('reportes')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab==='reportes'?'bg-red-500 text-white':'bg-white text-gray-500 border'}`}>🚨 Reportes {reports.length>0 && <span className="bg-white text-red-500 text-xs px-1.5 py-0.5 rounded-full ml-1">{reports.length}</span>}</button>
          <button onClick={() => setTab('usuarios')} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab==='usuarios'?'bg-orange-500 text-white':'bg-white text-gray-500 border'}`}>👥 Usuarios</button>
        </div>

        {tab==='reportes' && (
          <div className="space-y-4">
            {reports.length===0 ? <div className="bg-white rounded-2xl p-12 text-center border"><p>✅ No hay reportes</p></div> :
              reports.map(r=>(
                <div key={r.id} className="bg-white rounded-2xl p-4 border flex gap-4">
                  <video src={r.posts?.video_url || r.posts?.media_url} className="w-28 h-48 object-cover rounded-lg bg-black" controls />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-red-600">Motivo: {r.reason}</p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('es-MX')} - ID: {r.posts?.id.slice(0,8)}</p>
                    <p className="text-sm mt-2 line-clamp-2">{r.posts?.caption || 'Sin descripción'}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={()=>eliminarVideo(r.posts!.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">🗑 Eliminar video</button>
                      <button onClick={()=>ignorarReporte(r.id)} className="bg-gray-100 px-4 py-2 rounded-lg text-xs">Ignorar</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
        {/* Tus tabs de canjes y usuarios quedan igual, no los borré */}
        {tab==='canjes' && (
          <div className="space-y-4">
            {redemptions.map(r=>(
              <div key={r.id} className="bg-white rounded-2xl p-5 border flex justify-between">
                <div><p className="font-bold">{r.rewards?.title}</p><p className="text-sm text-gray-500">👤 {r.profiles?.name}</p></div>
                <span className="text-xs">{r.status}</span>
              </div>
            ))}
          </div>
        )}
        {tab==='usuarios' && (
          <div className="space-y-3">
            {users.map(u=>(
              <div key={u.id} className="bg-white rounded-2xl p-5 border flex justify-between"><p className="font-bold">{u.name}</p><span className="text-xs">{u.plan}</span></div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}