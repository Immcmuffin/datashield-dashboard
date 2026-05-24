'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    // Listen for auth state change — fires when Supabase processes the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        subscription.unsubscribe()
        window.location.replace('/dashboard')
      }
    })

    // Also check immediately in case already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        window.location.replace('/dashboard')
      }
    })

    // Fallback: if nothing happens in 8 seconds, go to home
    const fallback = setTimeout(() => {
      subscription.unsubscribe()
      window.location.replace('/')
    }, 8000)

    return () => {
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'system-ui',background:'#f5f5f3'}}>
      <div style={{width:52,height:52,background:'#0f1117',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700,marginBottom:20}}>DS</div>
      <h2 style={{fontSize:18,color:'#0f1117',marginBottom:8}}>Signing you in...</h2>
      <p style={{color:'#888',fontSize:14}}>Redirecting to your dashboard.</p>
    </div>
  )
}
