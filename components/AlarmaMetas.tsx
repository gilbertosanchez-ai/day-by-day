'use client'
import { useEffect, useState } from 'react'

interface Goal { id: string; title: string; reminder_time: string | null; reminder_enabled: boolean }

export default function AlarmaMetas({ goals }: { goals: Goal[] }) {
  const [permiso, setPermiso] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => setPermiso(p))
    } else {
      setPermiso(Notification.permission)
    }

    const check = () => {
      const ahora = new Date()
      const minsAhora = ahora.getHours() * 60 + ahora.getMinutes()
      const hoy = ahora.toDateString()

      goals.forEach(g => {
        if (!g.reminder_enabled || !g.reminder_time) return
        const [h, m] = g.reminder_time.split(':').map(Number)
        let minsAlarma = h * 60 + m - 5
        if (minsAlarma < 0) minsAlarma += 1440
        if (minsAlarma === minsAhora) {
          const key = `alarma_${g.id}_${hoy}`
          if (localStorage.getItem(key)) return
          
          if (permiso === 'granted' || Notification.permission === 'granted') {
            try { new Notification(`🔥 En 5 min: ${g.title}`, { body: 'Prepárate, no falles hoy.' }) } 
            catch { alert(`🔥 En 5 min: ${g.title}`) }
          } else {
            // Fallback iPhone sin permiso
            alert(`🔥 En 5 min: ${g.title}`)
            if (navigator.vibrate) navigator.vibrate([300,100,300])
          }
          localStorage.setItem(key, '1')
        }
      })
    }

    const interval = setInterval(check, 30000) // cada 30s para iPhone
    check()
    return () => clearInterval(interval)
  }, [goals, permiso])

  return null
}