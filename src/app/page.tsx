'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function Home() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://removemydata.app/dashboard' }
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.shield}>DS</div>
          <h1>DataShield</h1>
          <p>Your personal data removal service</p>
        </div>
        {sent ? (
          <div className={styles.sent}>
            <div className={styles.sentIcon}>✓</div>
            <h2>Check your email</h2>
            <p>We sent a magic link to <strong>{email}</strong>. Click it to access your dashboard.</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className={styles.form}>
            <label>Email address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Sign in →'}</button>
          </form>
        )}
        <p className={styles.tagline}>
          We automatically scan and remove your data from 20+ data brokers every 30 days.{' '}
          <a href="/pricing" style={{color:'#0f1117'}}>See plans →</a>
        </p>
      </div>
    </main>
  )
}
