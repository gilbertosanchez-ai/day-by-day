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
  image_url?: string | null
  created_at: string
  goal_id: string | null
  repost_of: string | null
  views_count: number
  profiles: { name: string } | null
  goals: { title: string; current_streak: number } | null
  reactions: { type: string; user_id: string }[]
  comments: { id: string; user_id: string; content: string; created_at: string; profiles: { name: string } | null }[]
}

const REACTION_EMOJIS: Record<string, string> = {
  heart: '❤',
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
  const [tab, setTab] = useState<'todo' | 'amigos'>('todo')
  const [friendIds, setFriendIds] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const lastViewedRef = useRef<Record<string, number>>({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const tiempoRelativo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime()
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

      const { data: rels } = await supabase
       .from('friendships')
       .select('user_id,friend_id')
       .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
       .eq('status','accepted')
      const fIds = (rels||[]).map((r:any)=> r.user_id===user.id? r.friend_id : r.user_id)
      setFriendIds(fIds)

      const { data } = await supabase
       .from('posts')
       .select(`id, user_id, content, media_url, media_type, image_url, created_at, goal_id, repost_of, views_count, goals(title, current_streak), reactions(type, user_id), comments(id, user_id, content, created_at)`)
       .order('created_at', { ascending: false })
       .limit(50)

      const postsConPerfil = await Promise.all(
        (data || []).map(async (post: any) => {
          const { data: profile } = await supabase.from('profiles').select('name').eq('id', post.user_id).single()
          const commentsConPerfil = await Promise.all(
            (post.comments || []).map(async (c: any) => {
              const { data: cp } = await supabase.from('profiles').select('name').eq('id', c.user_id).single()
              return {...c, profiles: cp }
            })
          )
          return {...post, profiles: profile, comments: commentsConPerfil, views_count: post.views_count || 0 }
        })
      )
      setPosts(postsConPerfil)
      setLoading(false)
    }
    cargarFeed()
  }, [])

  useEffect(() => {
    if (!userId || posts.length === 0) return
    const visibles = tab==='amigos'? posts.filter(p=> p.user_id===userId || friendIds.includes(p.user_id)) : posts
    const post = visibles[activeIndex]
    if (!post) return
    const now = Date.now()
    if (now - (lastViewedRef.current[post.id] || 0) < 120000) return
    const timer = setTimeout(async () => {
      lastViewedRef.current[post.id] = now
      setPosts(prev => prev.map(p => p.id === post.id? {...p, views_count: (p.views_count || 0) + 1 } : p))
      await supabase.rpc('increment_post_view', { p_post_id: post.id, p_user_id: userId })
    }, 1000)
    return () => clearTimeout(timer)
  }, [activeIndex, userId, posts.length, tab, friendIds])

    useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      const index = Math.round(container.scrollTop / container.clientHeight)
      if (index!== activeIndex) { setActiveIndex(index); setExpandedComments(false) }
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (!video) return
        const postIndex = posts.findIndex(p => p.id === id)
        if (postIndex === index) video.play().catch(()=>{})
        else video.pause()
      })
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [posts, activeIndex])

  const handleReaction = async (postId: string, type: string) => {
    if (!userId) return
    const ya = posts.find(p=>p.id===postId)?.reactions.some(r=>r.user_id===userId && r.type===type)
    if (ya) await supabase.from('reactions').delete().eq('post_id',postId).eq('user_id',userId).eq('type',type)
    else await supabase.from('reactions').insert({ post_id: postId, user_id: userId, type })
    setPosts(prev=>prev.map(p=> p.id!==postId? p : ya? {...p, reactions:p.reactions.filter(r=>!(r.user_id===userId && r.type===type))} : {...p, reactions:[...p.reactions,{type,user_id:userId!}]}))
  }

  const handleComentario = async (postId: string) => {
    if (!userId ||!commentInput.trim()) return
    setEnviandoComment(true)
    const { data: nc } = await supabase.from('comments').insert({ post_id: postId, user_id: userId, content: commentInput.trim() }).select('id,user_id,content,created_at').single()
    if (nc) { const { data: prof } = await supabase.from('profiles').select('name').eq('id',userId).single(); setPosts(prev=>prev.map(p=>p.id===postId?{...p,comments:[...p.comments,{...nc,profiles:prof}]}:p)); setCommentInput('') }
    setEnviandoComment(false)
  }

  const contarReaccion = (post: Post, type: string) => post.reactions.filter(r=>r.type===type).length
  const yoReaccioné = (post: Post, type: string) => post.reactions.some(r=>r.user_id===userId && r.type===type)
  const postsFiltrados = tab==='amigos'? posts.filter(p=> p.user_id===userId || friendIds.includes(p.user_id)) : posts

  if (loading) return <main className="min-h-screen bg-black flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>
  if (postsFiltrados.length===0) return <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 pb-24"><div className="text-6xl mb-4">🤝</div><h2 className="text-xl font-bold text-white mb-2">{tab==='amigos'?'Aún no hay posts de amigos':'Feed vacío'}</h2><p className="text-gray-400 text-center mb-6">{tab==='amigos'?'Agrega amigos para ver su progreso aquí':'Sé el primero en compartir tu avance'}</p><div className="flex gap-2"><button onClick={()=>setTab('todo')} className="bg-white/20 text-white px-4 py-2 rounded-xl">Ver Todo</button><Link href="/social/amigos" className="bg-orange-500 text-white px-5 py-3 rounded-xl font-bold">Agregar amigos →</Link></div><div className="fixed bottom-0 left-0 right-0 z-[100]"><BottomNav active="social" /></div></main>

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">🤝 Social</h1>
        <div className="flex gap-2"><Link href="/social/amigos" className="bg-white/20 backdrop-blur text-white px-3 py-1.5 rounded-xl text-sm">👥</Link><Link href="/social/retos" className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-sm">⚡</Link></div>
      </div>
      <div className="absolute top-14 left-0 right-0 z-30 flex justify-center"><div className="bg-black/60 backdrop-blur rounded-full p-1 flex gap-1"><button onClick={()=>{setTab('todo'); setActiveIndex(0)}} className={`px-5 py-1.5 rounded-full text-sm font-bold ${tab==='todo'?'bg-white text-black':'text-white/60'}`}>🌍 Todo</button><button onClick={()=>{setTab('amigos'); setActiveIndex(0)}} className={`px-5 py-1.5 rounded-full text-sm font-bold ${tab==='amigos'?'bg-white text-black':'text-white/60'}`}>👥 Amigos</button></div></div>
      <div ref={containerRef} className="flex-1 h-full overflow-y-scroll snap-y snap-mandatory pb-20" style={{ scrollbarWidth:'none' }}>
        {postsFiltrados.map((post, index) => {
          const mediaUrl = post.media_url || post.image_url
          const mediaType = post.media_type || (post.image_url?'image':'text')
          return (
          <div key={post.id} className="h-[100dvh] w-full snap-start snap-always relative flex items-end">
            {mediaType==='video' && mediaUrl? <video ref={el=>{videoRefs.current[post.id]=el}} src={mediaUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none" loop muted playsInline autoPlay={index===0}/> : mediaType==='image' && mediaUrl? <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none"/> : <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 pointer-events-none"/>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none"/>
            <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center z-20">
              {Object.entries(REACTION_EMOJIS).map(([type,emoji])=><button key={type} onClick={()=>handleReaction(post.id,type)} className="flex flex-col items-center gap-1"><div className={`w-12 h-12 flex items-center justify-center text-2xl ${yoReaccioné(post,type)?'scale-125':''}`}>{emoji}</div>{contarReaccion(post,type)>0 && <span className="text-white text-xs font-bold">{contarReaccion(post,type)}</span>}</button>)}
              <button onClick={()=>setExpandedComments(!expandedComments)} className="flex flex-col items-center gap-1"><div className="w-12 h-12 flex items-center justify-center text-2xl">💬</div>{post.comments.length>0 && <span className="text-white text-xs font-bold">{post.comments.length}</span>}</button>
              <div className="flex flex-col items-center gap-1 mt-2"><div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">👁️</div><span className="text-white text-xs font-bold">{post.views_count}</span></div>
            </div>
            <div className="relative z-20 px-4 pb-28 flex-1 mr-16"><div className="flex items-center gap-2 mb-2"><div className="w-9 h-9 bg-orange-400 rounded-full flex items-center justify-center">🔥</div><div><p className="text-white font-bold text-sm">{post.profiles?.name}</p><p className="text-white/60 text-xs">{tiempoRelativo(post.created_at)} • 👁️ {post.views_count} vistas</p></div></div>{post.goals && <div className="bg-white/20 backdrop-blur rounded-xl px-3 py-1.5 inline-flex gap-1 mb-2"><span className="text-orange-300 text-sm">🔥 {post.goals.current_streak} días</span><span className="text-white/60 text-xs">· {post.goals.title}</span></div>}{post.content && <p className="text-white text-sm">{post.content}</p>}</div>
            {expandedComments && activeIndex===index && (<div className="absolute inset-x-0 bottom-0 z-30 bg-black/90 backdrop-blur rounded-t-2xl max-h-96 flex flex-col pb-20"><div className="p-4 border-b border-white/10 flex justify-between"><p className="text-white font-bold">Comentarios</p><button onClick={()=>setExpandedComments(false)} className="text-white/60">✕</button></div><div className="flex-1 overflow-y-auto p-4 space-y-3">{post.comments.map(c=><div key={c.id} className="flex gap-2"><div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-sm">🔥</div><div><p className="text-white text-xs font-bold">{c.profiles?.name}</p><p className="text-white/80 text-sm">{c.content}</p></div></div>)}</div><div className="p-4 flex gap-2 border-t border-white/10"><input value={commentInput} onChange={e=>setCommentInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleComentario(post.id)} placeholder="Escribe..." className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm"/><button onClick={()=>handleComentario(post.id)} disabled={enviandoComment} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm">{enviandoComment?'...':'→'}</button></div></div>)}
          </div>
        )})}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-[100]"><BottomNav active="social" /></div>
    </main>
  )
}