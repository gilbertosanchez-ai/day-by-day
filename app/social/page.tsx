'use client'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Post {
  id: string; user_id: string; content: string; media_url: string | null; media_type: string | null; image_url?: string | null;
  created_at: string; views_count: number;
  profiles: { name: string } | null; goals: { title: string; current_streak: number } | null;
  reactions: { type: string; user_id: string }[];
  comments: { id: string; user_id: string; content: string; created_at: string; profiles: { name: string } | null }[]
}

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [tab, setTab] = useState<'todo' | 'amigos'>('todo')
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [isMuted, setIsMuted] = useState(true)
  const [expandedComments, setExpandedComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [enviandoComment, setEnviandoComment] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return; setUserId(user.id)
      const { data: rels } = await supabase.from('friendships').select('user_id,friend_id').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq('status','accepted')
      setFriendIds((rels||[]).map((r:any)=> r.user_id===user.id? r.friend_id : r.user_id))
      const { data } = await supabase.from('posts').select(`id,user_id,content,media_url,media_type,image_url,created_at,views_count,goals(title,current_streak),reactions(type,user_id),comments(id,user_id,content,created_at)`).order('created_at',{ascending:false}).limit(30)
      const conPerfil = await Promise.all((data||[]).map(async (p:any)=>{
        const {data: pr}= await supabase.from('profiles').select('name').eq('id',p.user_id).single();
        const commentsConPerfil = await Promise.all((p.comments||[]).map(async (c:any)=>{
          const {data: cp}= await supabase.from('profiles').select('name').eq('id',c.user_id).single();
          return {...c, profiles: cp}
        }))
        return {...p, profiles:pr, comments: commentsConPerfil, views_count:p.views_count||0}
      }))
      setPosts(conPerfil); setLoading(false)
    }; cargar()
  }, [])

  useEffect(() => {
    if(!userId ||!posts.length) return
    const visibles = tab==='amigos'? posts.filter(p=> p.user_id===userId || friendIds.includes(p.user_id)) : posts
    const post = visibles[activeIndex]; if(!post) return
    const t = setTimeout(()=>{ setPosts(prev=>prev.map(p=>p.id===post.id?{...p,views_count:(p.views_count||0)+1}:p)); supabase.rpc('increment_post_view',{p_post_id:post.id,p_user_id:userId}) }, 1000)
    return ()=>clearTimeout(t)
  }, [activeIndex, tab])

  useEffect(() => {
    const el = containerRef.current; if(!el) return
    const onScroll = () => {
      const i = Math.round(el.scrollTop / el.clientHeight); if(i!==activeIndex){ setActiveIndex(i); setExpandedComments(false) }
      Object.entries(videoRefs.current).forEach(([id,v])=>{ if(!v) return; const visibles = tab==='amigos'? posts.filter(p=> p.user_id===userId || friendIds.includes(p.user_id)) : posts; const idx = visibles.findIndex(p=>p.id===id); if(idx===i) v.play().catch(()=>{}); else v.pause() })
    }
    el.addEventListener('scroll', onScroll, {passive:true}); return ()=>el.removeEventListener('scroll', onScroll)
  }, [posts, tab, userId, friendIds, activeIndex])

  const handleReaction = async (postId:string, type:string)=>{
    if(!userId) return; const p = posts.find(x=>x.id===postId); const ya = p?.reactions.some(r=>r.user_id===userId && r.type===type)
    if(ya) await supabase.from('reactions').delete().eq('post_id',postId).eq('user_id',userId).eq('type',type)
    else await supabase.from('reactions').insert({post_id:postId,user_id:userId,type})
    setPosts(prev=>prev.map(x=> x.id!==postId? x : ya? {...x, reactions:x.reactions.filter(r=>!(r.user_id===userId && r.type===type))} : {...x, reactions:[...x.reactions,{type,user_id:userId!} ]}))
  }

  const handleComentario = async (postId:string)=>{
    if(!userId || !commentInput.trim()) return
    setEnviandoComment(true)
    const { data: nc } = await supabase.from('comments').insert({ post_id: postId, user_id: userId, content: commentInput.trim() }).select('id,user_id,content,created_at').single()
    if(nc){
      const {data: prof}= await supabase.from('profiles').select('name').eq('id',userId).single()
      setPosts(prev=>prev.map(p=> p.id===postId? {...p, comments:[...p.comments, {...nc, profiles: prof}] } : p))
      setCommentInput('')
    }
    setEnviandoComment(false)
  }

  const postsFiltrados = tab==='amigos'? posts.filter(p=> p.user_id===userId || friendIds.includes(p.user_id)) : posts
  if(loading) return <main className="h-screen bg-black flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>

  return (
    <main className="h-screen w-screen bg-black overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-between p-4 pt-6">
        <h1 className="text-white font-bold">🤝 Social</h1>
        {userId === '36da5a67-b0be-4714-ab6c-753f6ec9ec1e' && (
          <Link href="/admin" className="bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold">⚙ ADMIN</Link>
        )}
        <div className="flex gap-2"><Link href="/social/amigos" className="bg-white/20 text-white px-3 py-1 rounded-xl text-sm">👥</Link><Link href="/social/retos" className="bg-orange-500 text-white px-3 py-1 rounded-xl text-sm">⚡</Link></div>
      </div>
      <div className="absolute top-16 left-0 right-0 z-30 flex justify-center">
        <div className="bg-black/60 rounded-full p-1 flex gap-1"><button onClick={()=>{setTab('todo'); setActiveIndex(0)}} className={`px-5 py-1 rounded-full text-sm font-bold ${tab==='todo'?'bg-white text-black':'text-white/60'}`}>🌍 Todo</button><button onClick={()=>{setTab('amigos'); setActiveIndex(0)}} className={`px-5 py-1 rounded-full text-sm font-bold ${tab==='amigos'?'bg-white text-black':'text-white/60'}`}>👥 Amigos</button></div>
      </div>

      <div ref={containerRef} className="h-screen w-full overflow-y-scroll snap-y snap-mandatory">
        {postsFiltrados.map((post, index)=>{
          const url = post.media_url || post.image_url; const type = post.media_type || (post.image_url?'image':'text')
          const heartCount = post.reactions.filter(r=>r.type==='heart').length; const fireCount = post.reactions.filter(r=>r.type==='fire').length
          const yoHeart = post.reactions.some(r=>r.user_id===userId && r.type==='heart'); const yoFire = post.reactions.some(r=>r.user_id===userId && r.type==='fire')
          const isActive = index===activeIndex
          return (
          <div key={post.id} className="h-screen w-screen snap-start relative flex items-end shrink-0 bg-black">
            {type==='video' && url? <video ref={el=>{videoRefs.current[post.id]=el}} src={url} className="absolute inset-0 w-full h-full object-cover" loop muted={isMuted} playsInline autoPlay={index===0}/> : type==='image' && url? <img src={url} className="absolute inset-0 w-full h-full object-cover"/> : <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-yellow-500"/>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"/>

            <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-5 items-center">
              <button onClick={()=>setIsMuted(!isMuted)} className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-xl">{isMuted?'🔇':'🔊'}</button>
              <button onClick={()=>handleReaction(post.id,'heart')} className="flex flex-col items-center"><div className={`w-12 h-12 flex items-center justify-center text-3xl ${yoHeart?'scale-125':''}`}>❤</div>{heartCount>0 && <span className="text-white text-xs font-bold">{heartCount}</span>}</button>
              <button onClick={()=>handleReaction(post.id,'fire')} className="flex flex-col items-center"><div className={`w-12 h-12 flex items-center justify-center text-3xl ${yoFire?'scale-125':''}`}>🔥</div>{fireCount>0 && <span className="text-white text-xs font-bold">{fireCount}</span>}</button>
              {/* BOTON COMENTARIO RESTAURADO */}
              <button onClick={()=>setExpandedComments(!expandedComments)} className="flex flex-col items-center"><div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-2xl">💬</div>{post.comments.length>0 && <span className="text-white text-xs font-bold">{post.comments.length}</span>}</button>
              <div className="flex flex-col items-center"><div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-xl">👁</div><span className="text-white text-xs font-bold">{post.views_count}</span></div>
              <button onClick={async()=>{
                const reason = prompt('¿Por qué lo reportas?\n1: spam\n2: ofensivo\n3: desnudo\n4: violencia')
                if(!reason) return
                const { error } = await supabase.from('reports').insert({post_id: post.id, reporter_id: userId, reason})
                if(error) alert(error.message)
                else alert('Reportado ✅ Gracias')
              }} className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-xl">🚩</button>
            </div>

            <div className="relative z-10 p-4 pb-28 pr-20">
              <div className="flex gap-2 items-center mb-2"><div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">🔥</div><p className="text-white font-bold text-sm">{post.profiles?.name}</p></div>
              {post.goals && <div className="bg-white/20 rounded-lg px-2 py-1 inline-block mb-2 text-xs text-white">🔥 {post.goals.current_streak} días · {post.goals.title}</div>}
              <p className="text-white text-sm">{post.content}</p>
            </div>

            {expandedComments && isActive && (
              <div className="absolute inset-x-0 bottom-0 z-30 bg-black/90 backdrop-blur rounded-t-2xl max-h-[45vh] flex flex-col pb-20">
                <div className="p-4 border-b border-white/10 flex justify-between"><p className="text-white font-bold">Comentarios ({post.comments.length})</p><button onClick={()=>setExpandedComments(false)} className="text-white/60">✕</button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {post.comments.length===0? <p className="text-white/40 text-sm text-center py-4">Sé el primero en comentar</p> : post.comments.map(c=>(
                    <div key={c.id} className="flex gap-2"><div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-sm">🔥</div><div><p className="text-white text-xs font-bold">{c.profiles?.name || 'Usuario'}</p><p className="text-white/80 text-sm">{c.content}</p></div></div>
                  ))}
                </div>
                <div className="p-4 flex gap-2 border-t border-white/10">
                  <input value={commentInput} onChange={e=>setCommentInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleComentario(post.id)} placeholder="Escribe un comentario..." className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm"/>
                  <button onClick={()=>handleComentario(post.id)} disabled={enviandoComment} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm">{enviandoComment?'...':'→'}</button>
                </div>
              </div>
            )}
          </div>
        )})}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50"><BottomNav active="social" /></div>
    </main>
  )
}
