'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

interface Job { id: string; broker_name: string; status: string; result: any; error_message: string | null; updated_at: string }
interface Subscription { id: string; plan_id: string; status: string; subject_name: string; next_scan_at: string; total_scans: number }

const STATUS_ICON: Record<string, string> = { completed: '✓', running: '●', claimed: '○', pending: '○', failed: '✗' }
const STATUS_LABEL: Record<string, string> = { completed: 'Submitted', running: 'Running', claimed: 'Queued', pending: 'Waiting', failed: 'Failed' }

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [sendingReport, setSendingReport] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  const fetchData = useCallback(async (userId: string, email: string) => {
    setUserEmail(email)
    const { data } = await supabase.rpc('get_my_dashboard')
    setSub(data?.subscription || null)
    setJobs(data?.jobs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // Wait for auth state — handles both existing sessions and new magic link logins
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchData(session.user.id, session.user.email || '')
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        window.location.href = '/'
      }
    })
    return () => authSub.unsubscribe()
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.rpc('get_my_dashboard')
        setSub(data?.subscription || null)
        setJobs(data?.jobs || [])
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  async function sendScanReport() {
    if (!sub) return
    setSendingReport(true)
    await fetch('https://raiddanqvnzxyjwfmyqo.supabase.co/functions/v1/notify-scan-complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: sub.id })
    })
    setSendingReport(false)
    setReportSent(true)
    setTimeout(() => setReportSent(false), 3000)
  }

  if (loading) return (
    <div className={styles.loading}>
      <div style={{fontSize:13,color:'#888'}}>Loading your dashboard...</div>
    </div>
  )

  if (!sub) return (
    <div className={styles.loading}>
      <p style={{marginBottom:12}}>No subscription found.</p>
      <a href="/pricing" style={{color:'#0f1117',fontSize:14}}>See plans →</a>
    </div>
  )

  const counts = {
    completed: jobs.filter(j => j.status === 'completed').length,
    inProgress: jobs.filter(j => ['running','claimed'].includes(j.status)).length,
    pending: jobs.filter(j => j.status === 'pending').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  }
  const pct = jobs.length ? Math.round((counts.completed / jobs.length) * 100) : 0
  const nextScan = sub.next_scan_at ? new Date(sub.next_scan_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
  const sortedJobs = [...jobs].sort((a, b) => {
    const order: Record<string, number> = { completed: 0, running: 1, claimed: 2, pending: 3, failed: 4 }
    return (order[a.status] ?? 5) - (order[b.status] ?? 5) || a.broker_name.localeCompare(b.broker_name)
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}><div className={styles.logo}>DS</div><span>DataShield</span></div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{userEmail}</span>
          <button onClick={sendScanReport} disabled={sendingReport} className={styles.bellBtn}>
            {reportSent ? '✓ Sent' : sendingReport ? '...' : '🔔 Email report'}
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} className={styles.signOut}>Sign out</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Hi, {sub.subject_name?.split(' ')[0] || 'there'} 👋</h1>
          <p>Scan #{sub.total_scans} — {jobs.length} brokers monitored</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#0f6e56'}}>{counts.completed}</div><div className={styles.statLabel}>Submitted</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#185FA5'}}>{counts.inProgress}</div><div className={styles.statLabel}>In progress</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#888'}}>{counts.pending}</div><div className={styles.statLabel}>Pending</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#a32d2d'}}>{counts.failed}</div><div className={styles.statLabel}>Failed</div></div>
        </div>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}><span>Scan #{sub.total_scans} progress</span><span>{pct}%</span></div>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{width:`${pct}%`}} /></div>
          <p className={styles.nextScan}>Next automatic scan: <strong>{nextScan}</strong></p>
        </div>
        <div className={styles.section}>
          <h2>Broker status</h2>
          <div className={styles.brokerGrid}>
            {sortedJobs.map(job => {
              const notFound = job.result?.status === 'not_found'
              return (
                <div key={job.id} className={`${styles.brokerCard} ${styles[job.status] || styles.pending}`}>
                  <div className={styles.brokerIcon}>{STATUS_ICON[job.status] || '○'}</div>
                  <div>
                    <div className={styles.brokerName}>{job.broker_name}</div>
                    <div className={styles.brokerStatus}>{notFound ? 'Not listed' : STATUS_LABEL[job.status] || job.status}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.infoBox}>
          <h3>What happens next?</h3>
          <p>Brokers process removals within <strong>3–30 days</strong>. Some will email you to confirm — click those links. DataShield re-scans every 30 days automatically.</p>
        </div>
      </main>
    </div>
  )
}
