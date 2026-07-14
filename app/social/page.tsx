'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  goal_id: string | null
  profiles: {
    name: string
  }
  goals: {
    title: string
    current_streak: number
  } | null
  reactions: {
    type: string
    user_id: string
  }[]
}

const REACTION_EMOJIS: Record<string, string> = {
  heart: '❤️',
  fire: '🔥',
  muscle: '💪',
  clap: '🙌'
}

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarFeed = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

     const { data } = await supabase
  .from('posts')
  .select(`
    *,
    goals(title, current_streak),
    reactions(type, user_id)
  `)
  .order('created_at', { ascending: false })
  .limit(30)

// Enriquecer con nombre del perfil
const postsConPerfil = await Promise.all(
  (data || []).map(async (post) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', post.user_id)
      .single()
    return { ...post, profiles: profile }
  })
)

setPosts(postsConPerfil)
      setLoading(false)
    }
    cargarFeed()
  }, [])

  const handleReaction = async (postId: string, type: string) => {
    if (!userId) return

    const post = posts.find(p => p.id === postId)
    const yaReaccioné = post?.reactions.some(r => r.user_id === userId && r.type === type)

    if (yaReaccioné) {
      await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', type)
    } else {
      await supabase
        .from('reactions')
        .insert({ post_id: postId, user_id: userId, type })
    }

    // Actualizar estado local
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      if (yaReaccioné) {
        return { ...p, reactions: p.reactions.filter(r => !(r.user_id === userId && r.type === type)) }
      } else {
        return { ...p, reactions: [...p.reactions, { type, user_id: userId }] }
      }
    }))
  }

  const contarReaccion = (post: Post, type: string) =>
    post.reactions.filter(r => r.type === type).length

  const yoReaccioné = (post: Post, type: string) =>
    post.reactions.some(r => r.user_id === userId && r.type === type)

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🤝 Social</h1>
          <div className="flex gap-2">
            <Link href="/social/amigos" className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-gray-200">
              👥 Amigos
            </Link>
            <Link href="/social/retos" className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-orange-600">
              ⚡ Retos
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">El feed está vacío</h2>
            <p className="text-gray-400 mb-6">Agrega amigos para ver sus logros aquí</p>
            <Link href="/social/amigos" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600">
              Agregar amigos →
            </Link>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Autor */}
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg">
                    🔥
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{post.profiles?.name}</p>
                    {post.goals && (
                      <p className="text-xs text-orange-500">
                        🔥 {post.goals.current_streak} días en "{post.goals.title}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{tiempoRelativo(post.created_at)}</span>
              </div>

              {/* Contenido */}
              {post.content && (
                <div className="px-5 pb-3">
                  <p className="text-gray-700 text-sm">{post.content}</p>
                </div>
              )}

              {/* Imagen */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="evidencia"
                  className="w-full object-cover max-h-64"
                />
              )}

              {/* Reacciones */}
              <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => handleReaction(post.id, type)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm transition-colors ${
                      yoReaccioné(post, type)
                        ? 'bg-orange-100 text-orange-600 font-semibold'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span>{emoji}</span>
                    {contarReaccion(post, type) > 0 && (
                      <span>{contarReaccion(post, type)}</span>
                    )}
                  </button>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

      <BottomNav active="social" />
    </main>
  )
}