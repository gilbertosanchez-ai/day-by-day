'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Post {
  id: string
  user_id: string
  content: string
  media_url: string | null
  media_type: string | null
  created_at: string
  goal_id: string | null
  repost_of: string | null
  profiles: { name: string } | null
  goals: { title: string; current_streak: number } | null
  reactions: { type: string; user_id: string }[]
  comments: { id: string; user_id: string; content: string; created_at: string; profiles: { name: string } | null }[]
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [expandedComments, setExpandedComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [enviandoComment, setEnviandoComment] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha + 'Z').getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return `hace ${Math.floor(hrs / 24)}d`
  }

  useEffect(() => {
    const cargarFeed = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('posts')
        .select(`*, goals(title, current_streak), reactions(type, user_id), comments(id, user_id, content, created_at)`)
        .order('created_at', { ascending: false })
        .limit(30)

      const postsConPerfil = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', post.user_id)
            .single()

          const commentsConPerfil = await Promise.all(
            (post.comments || []).map(async (c: { id: string; user_id: string; content: string; created_at: string }) => {
              const { data: cp } = await supabase.from('profiles').select('name').eq('id', c.user_id).single()
              return { ...c, profiles: cp }
            })
          )

          return { ...post, profiles: profile, comments: commentsConPerfil }
        })
      )

      setPosts(postsConPerfil)
      setLoading(false)
    }
    cargarFeed()
  }, [])

  // Detectar qué post está visible y pausar/reproducir videos
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const height = window.innerHeight
      const index = Math.round(scrollTop / height)
      setActiveIndex(index)
      setExpandedComments(false)

      // Pausar todos los videos y reproducir solo el activo
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (!video) return
        const postIndex = posts.findIndex(p => p.id === id)
        if (postIndex === index) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [posts])

  const handleReaction = async (postId: string, type: string) => {
    if (!userId) return
    const post = posts.find(p => p.id === postId)
    const yaReaccioné = post?.reactions.some(r => r.user_id === userId && r.type === type)

    if (yaReaccioné) {
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('type', type)
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: userId, type })
    }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      if (yaReaccioné) {
        return { ...p, reactions: p.reactions.filter(r => !(r.user_id === userId && r.type === type)) }
      } else {
        return { ...p, reactions: [...p.reactions, { type, user_id: userId! }] }
      }
    }))
  }

  const handleComentario = async (postId: string) => {
    if (!userId || !commentInput.trim()) return
    setEnviandoComment(true)

    const { data: newComment } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content: commentInput.trim() })
      .select('id, user_id, content, created_at')
      .single()

    if (newComment) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { ...newComment, profiles: profile }] }
          : p
      ))
      setCommentInput('')
    }
    setEnviandoComment(false)
  }

  const contarReaccion = (post: Post, type: string) => post.reactions.filter(r => r.type === type).length
  const yoReaccioné = (post: Post, type: string) => post.reactions.some(r => r.user_id === userId && r.type === type)

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  if (posts.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 pb-24">
        <div className="text-6xl mb-4">🤝</div>
        <h2 className="text-xl font-bold text-white mb-2">El feed está vacío</h2>
        <p className="text-gray-400 mb-6 text-center">Cumple una meta y comparte tu logro</p>
        <Link href="/social/amigos" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold">
          Agregar amigos →
        </Link>
        <BottomNav active="social" />
      </main>
    )
  }

  const activePost = posts[activeIndex]

  return (
    <main className="fixed inset-0 bg-black">

      {/* Header flotante */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">🤝 Social</h1>
        <div className="flex gap-2">
          <Link href="/social/amigos" className="bg-white/20 backdrop-blur text-white px-3 py-1.5 rounded-xl text-sm font-medium">
            👥
          </Link>
          <Link href="/social/retos" className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium">
            ⚡
          </Link>
        </div>
      </div>

      {/* Feed deslizable */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="h-screen w-full snap-start snap-always relative flex items-end"
          >
            {/* Fondo según tipo de media */}
            {post.media_type === 'video' && post.media_url ? (
              <video
                ref={el => { videoRefs.current[post.id] = el }}
                src={post.media_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                autoPlay={index === 0}
              />
            ) : post.media_type === 'image' && post.media_url ? (
              <img
                src={post.media_url}
                alt="post"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500" />
            )}

            {/* Overlay oscuro */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

            {/* Botones de reacción — derecha */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center z-20">
              {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                <button
                  key={type}
                  onClick={() => handleReaction(post.id, type)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-transform ${yoReaccioné(post, type) ? 'scale-125' : ''}`}>
                    {emoji}
                  </div>
                  {contarReaccion(post, type) > 0 && (
                    <span className="text-white text-xs font-bold">{contarReaccion(post, type)}</span>
                  )}
                </button>
              ))}

              {/* Comentarios */}
              <button
                onClick={() => setExpandedComments(!expandedComments)}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl">💬</div>
                {post.comments.length > 0 && (
                  <span className="text-white text-xs font-bold">{post.comments.length}</span>
                )}
              </button>
            </div>

            {/* Info del post — abajo izquierda */}
            <div className="relative z-20 px-4 pb-24 flex-1 mr-16">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-orange-400 rounded-full flex items-center justify-center text-lg">🔥</div>
                <div>
                  <p className="text-white font-bold text-sm">{post.profiles?.name}</p>
                  <p className="text-white/60 text-xs">{tiempoRelativo(post.created_at)}</p>
                </div>
              </div>

              {post.goals && (
                <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 inline-flex items-center gap-1 mb-2">
                  <span className="text-orange-300 text-sm">🔥 {post.goals.current_streak} días</span>
                  <span className="text-white/60 text-xs">· {post.goals.title}</span>
                </div>
              )}

              {post.content && (
                <p className="text-white text-sm leading-relaxed">{post.content}</p>
              )}

              {!post.media_url && (
                <div className="mt-4 text-6xl text-center w-full">🔥</div>
              )}
            </div>

            {/* Panel de comentarios */}
            {expandedComments && activeIndex === index && (
              <div className="absolute inset-x-0 bottom-16 z-30 bg-black/90 backdrop-blur rounded-t-2xl max-h-96 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <p className="text-white font-bold">Comentarios</p>
                  <button onClick={() => setExpandedComments(false)} className="text-white/60 text-sm">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {post.comments.length === 0 && (
                    <p className="text-white/40 text-sm text-center py-4">Sin comentarios aún</p>
                  )}
                  {post.comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">🔥</div>
                      <div>
                        <p className="text-white text-xs font-bold">{c.profiles?.name}</p>
                        <p className="text-white/80 text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 flex gap-2 border-t border-white/10">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComentario(post.id)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => handleComentario(post.id)}
                    disabled={enviandoComment}
                    className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {enviandoComment ? '...' : '→'}
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      <BottomNav active="social" />
    </main>
  )
}