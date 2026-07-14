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
  repost_of: string | null
  profiles: { name: string } | null
  goals: { title: string; current_streak: number } | null
  reactions: { type: string; user_id: string }[]
  comments: { id: string; user_id: string; content: string; created_at: string; profiles: { name: string } | null }[]
  repost_original?: Post | null
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
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [enviandoComment, setEnviandoComment] = useState<string | null>(null)
  const [repostModal, setRepostModal] = useState<Post | null>(null)
  const [repostTexto, setRepostTexto] = useState('')
  const [publicandoRepost, setPublicandoRepost] = useState(false)

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

  const cargarPost = async (postId: string): Promise<Post | null> => {
    const { data } = await supabase
      .from('posts')
      .select(`*, goals(title, current_streak), reactions(type, user_id), comments(id, user_id, content, created_at)`)
      .eq('id', postId)
      .single()
    if (!data) return null
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', data.user_id).single()
    return { ...data, profiles: profile }
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
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', post.user_id).single()

          let repost_original = null
          if (post.repost_of) {
            repost_original = await cargarPost(post.repost_of)
          }

          // Cargar perfiles de comentarios
          const commentsConPerfil = await Promise.all(
            (post.comments || []).map(async (c: any) => {
              const { data: cp } = await supabase.from('profiles').select('name').eq('id', c.user_id).single()
              return { ...c, profiles: cp }
            })
          )

          return { ...post, profiles: profile, repost_original, comments: commentsConPerfil }
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
      await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('type', type)
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: userId, type })
    }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      if (yaReaccioné) {
        return { ...p, reactions: p.reactions.filter(r => !(r.user_id === userId && r.type === type)) }
      } else {
        return { ...p, reactions: [...p.reactions, { type, user_id: userId }] }
      }
    }))
  }

  const handleComentario = async (postId: string) => {
    if (!userId || !commentInputs[postId]?.trim()) return
    setEnviandoComment(postId)

    const { data: newComment } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, content: commentInputs[postId].trim() })
      .select('id, user_id, content, created_at')
      .single()

    if (newComment) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
      const commentConPerfil = { ...newComment, profiles: profile }

      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...p.comments, commentConPerfil] }
          : p
      ))
      setCommentInputs(prev => ({ ...prev, [postId]: '' }))
    }
    setEnviandoComment(null)
  }

  const handleRepost = async () => {
    if (!userId || !repostModal) return
    setPublicandoRepost(true)

    const { data: newPost } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: repostTexto,
        repost_of: repostModal.id
      })
      .select(`*, goals(title, current_streak), reactions(type, user_id), comments(id, user_id, content, created_at)`)
      .single()

    if (newPost) {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', userId).single()
      const postCompleto = { ...newPost, profiles: profile, repost_original: repostModal, comments: [] }
      setPosts(prev => [postCompleto, ...prev])
    }

    setRepostModal(null)
    setRepostTexto('')
    setPublicandoRepost(false)
  }

  const contarReaccion = (post: Post, type: string) => post.reactions.filter(r => r.type === type).length
  const yoReaccioné = (post: Post, type: string) => post.reactions.some(r => r.user_id === userId && r.type === type)

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
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-lg">🔥</div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{post.profiles?.name}</p>
                    {post.goals && (
                      <p className="text-xs text-orange-500">🔥 {post.goals.current_streak} días en "{post.goals.title}"</p>
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

              {/* Post original (repost) */}
              {post.repost_original && (
                <div className="mx-5 mb-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm">🔥</div>
                    <p className="font-bold text-gray-700 text-xs">{post.repost_original.profiles?.name}</p>
                    <span className="text-xs text-gray-400">{tiempoRelativo(post.repost_original.created_at)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{post.repost_original.content}</p>
                </div>
              )}

              {/* Imagen */}
              {post.image_url && (
                <img src={post.image_url} alt="evidencia" className="w-full object-cover max-h-64" />
              )}

              {/* Reacciones + botones */}
              <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
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
                    {contarReaccion(post, type) > 0 && <span>{contarReaccion(post, type)}</span>}
                  </button>
                ))}

                {/* Botón comentarios */}
                <button
                  onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm bg-gray-50 text-gray-500 hover:bg-gray-100 ml-auto"
                >
                  <span>💬</span>
                  {post.comments.length > 0 && <span>{post.comments.length}</span>}
                </button>

                {/* Botón repost */}
                <button
                  onClick={() => { setRepostModal(post); setRepostTexto('') }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm bg-gray-50 text-gray-500 hover:bg-gray-100"
                >
                  <span>🔁</span>
                </button>
              </div>

              {/* Sección de comentarios expandible */}
              {expandedComments[post.id] && (
                <div className="border-t border-gray-50 px-5 py-3 space-y-3">
                  {post.comments.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">Sin comentarios aún — sé el primero 💬</p>
                  )}
                  {post.comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">🔥</div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                        <p className="text-xs font-bold text-gray-700">{c.profiles?.name}</p>
                        <p className="text-sm text-gray-600">{c.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Input nuevo comentario */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleComentario(post.id)}
                      placeholder="Escribe un comentario..."
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    />
                    <button
                      onClick={() => handleComentario(post.id)}
                      disabled={enviandoComment === post.id}
                      className="bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                      {enviandoComment === post.id ? '...' : '→'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Modal repost */}
      {repostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 px-4 pb-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-bold text-gray-800 mb-3">🔁 Repostear</h3>
            <textarea
              value={repostTexto}
              onChange={e => setRepostTexto(e.target.value)}
              placeholder="Agrega un comentario (opcional)..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 mb-3 resize-none"
            />
            {/* Preview del post original */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm">🔥</div>
                <p className="font-bold text-gray-700 text-xs">{repostModal.profiles?.name}</p>
              </div>
              <p className="text-gray-600 text-sm">{repostModal.content}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRepostModal(null)}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-3 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRepost}
                disabled={publicandoRepost}
                className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {publicandoRepost ? '...' : '🔁 Repostear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="social" />
    </main>
  )
}