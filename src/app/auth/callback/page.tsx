'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) window.location.href = '/dashboard'
    })
    // Also check immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = '/dashboard'
      else {
        // Process hash tokens
        const hash = window.location.hash
        if (hash) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) window.location.href = '/dashboard'
            else window.location.href = '/'
          })
        } else {
          setTimeout(() => window.location.href = '/', 3000)
        }
      }
    })
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'system-ui', backgroundColor:'#f5f5f3' }}>
      <div style={{ width:52, height:52, backgroundColor:'#0f1117', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700, marginBottom:20 }}>DS</div>
      <h2 style={{ fontSize:18, color:'#0f1117', marginBottom:8 }}>Signing you in...</h2>
      <p style={{ color:'#888', fontSize:14 }}>You'll be redirected to your dashboard shortly.</p>
    </div>
  )
}
