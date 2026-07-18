'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const ADMIN_ID = '36da5a67-b0be-4714-ab6c-753f6ec9ec1e'

interface Report {
  id: string
  reason: string
  created_at: string
  posts: { id: string, media_url?: string | null, media_type?: string | null, content?: string | null } | null
}

export default function AdminPage() {
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
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
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.id !== ADMIN_ID) {
          console.log('No eres admin, tu id es:', user?.id)
          router.push('/dashboard')
          return
        }

        const { data: redemptionsData } = await supabase.from('redemptions').select('*, profiles(name), rewards(title)').order('created_at', { ascending: false })
        const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('id, reason, created_at, posts(id, media_url, media_type, content)')
          .order('created_at', { ascending: false })

        if (reportsError) console.error('Error reports:', reportsError)
        console.log('REPORTS:', reportsData)

        setRedemptions(redemptionsData || [])
        setUsers(usersData || [])
        setReports((reportsData as any) || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false) // <- ESTO es lo que te faltaba, ahora siempre quita el loading
      }
    }
    cargarDatos()
  }, [])

  const eliminarVideo = async (postId: string) => {
    if (!confirm('¿Seguro ELIMINAR este video?')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) alert(error.message)
    else setReports(prev => prev.filter(r => r.posts?.id !== postId))
  }

  const ignorarReporte = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from('redemptions').update({ status }).eq('id', id)
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>

  const pendientes = redemptions.filter(r => r.status === 'pending')

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4"><div className="max-w-4xl mx-auto flex justify-between"><h1 className="font-bold">⚙ Panel Admin</h1><a href="/dashboard" className="text-sm text-gray-400">← Volver</a></div></div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold">{users.length}</p><p className="text-xs text-gray-400">Usuarios</p></div>
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold text-red-500">{reports.length}</p><p className="text-xs text-gray-400">Reportes</p></div>
          <div className="bg-orange-50 rounded-2xl p-4 border text-center"><p className="text-3xl font-bold text-orange-600">{pendientes.length}</p><p className="text-xs">Pendientes</p></div>
          <div className="bg-white rounded-2xl p-4 border text-center"><p className="text-3xl font-bold">{redemptions.length}</p><p className="text-xs">Canjes</p></div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('canjes')} className={`px-4 py-2 rounded-xl text-sm ${tab==='canjes'?'bg-orange-500 text-white':'bg-white border'}`}>🏆 Canjes</button>
          <button onClick={() => setTab('reportes')} className={`px-4 py-2 rounded-xl text-sm ${tab==='reportes'?'bg-red-500 text-white':'bg-white border'}`}>🚨 Reportes {reports.length>0 && `(${reports.length})`}</button>
          <button onClick={() => setTab('usuarios')} className={`px-4 py-2 rounded-xl text-sm ${tab==='usuarios'?'bg-orange-500 text-white':'bg-white border'}`}>👥 Usuarios</button>
        </div>

        {tab==='reportes' && (
          <div className="space-y-4">
            {reports.length===0 ? <div className="bg-white rounded-2xl p-12 text-center border">✅ No hay reportes</div> :
              reports.map(r=>(
                <div key={r.id} className="bg-white rounded-2xl p-4 border flex gap-4">
                  {r.posts?.media_type === 'video' ? (
                    <video src={r.posts?.media_url || ''} className="w-28 h-48 object-cover rounded-lg bg-black" controls />
                  ) : (
                    <img src={r.posts?.media_url || ''} className="w-28 h-48 object-cover rounded-lg bg-black" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-sm text-red-600">Motivo: {r.reason || 'sin motivo'}</p>
                    <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString('es-MX')} - {r.posts?.id?.slice(0,8) || 'post borrado'}</p>
                    <p className="text-sm mt-2 line-clamp-2">{r.posts?.content || 'Sin descripción'}</p>
                    <div className="flex gap-2 mt-4">
                      <button onClick={()=> r.posts?.id && eliminarVideo(r.posts.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold">🗑 Eliminar video</button>
                      <button onClick={()=> ignorarReporte(r.id)} className="bg-gray-100 px-4 py-2 rounded-lg text-xs">Ignorar</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
        {tab==='canjes' && <div className="space-y-4">{redemptions.map((r:any)=><div key={r.id} className="bg-white rounded-2xl p-5 border flex justify-between"><div><p className="font-bold">{r.rewards?.title}</p><p className="text-sm text-gray-500">👤 {r.profiles?.name}</p></div><span className="text-xs">{r.status}</span></div>)}</div>}
        {tab==='usuarios' && <div className="space-y-3">{users.map((u:any)=><div key={u.id} className="bg-white rounded-2xl p-5 border flex justify-between"><p className="font-bold">{u.name}</p><span className="text-xs">{u.plan}</span></div>)}</div>}
      </div>
    </main>
  )
}