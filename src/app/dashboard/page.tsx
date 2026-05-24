'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

interface Job {
  id: string
  broker_name: string
  status: string
  result: { status: string; message: string } | null
  error_message: string | null
  updated_at: string
}

interface Subscription {
  id: string
  plan_id: string
  status: string
  subject_name: string
  next_scan_at: string
  total_scans: number
}

const STATUS_ICON: Record<string, string> = { completed: '✓', running: '●', claimed: '○', pending: '○', failed: '✗' }
const STATUS_LABEL: Record<string, string> = { completed: 'Submitted', running: 'Running', claimed: 'Queued', pending: 'Waiting', failed: 'Failed' }

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/'; return }
    setUserEmail(user.email || '')

    const { data, error } = await supabase.rpc('get_my_dashboard')
    if (error) { console.error('dashboard error:', error); setLoading(false); return }

    setSub(data?.subscription || null)
    setJobs(data?.jobs || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className={styles.loading}>Loading your dashboard...</div>

  if (!sub) return (
    <div className={styles.loading}>
      <p>No subscription found.</p>
      <a href="/pricing" style={{color:'#0f1117',marginTop:'12px',display:'block'}}>See plans →</a>
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
        <div className={styles.brand}>
          <div className={styles.logo}>DS</div>
          <span>DataShield</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{userEmail}</span>
          <button onClick={handleSignOut} className={styles.signOut}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Hi, {sub.subject_name?.split(' ')[0] || 'there'} 👋</h1>
          <p>Here's the status of your data removal across {jobs.length} brokers.</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#0f6e56'}}>{counts.completed}</div><div className={styles.statLabel}>Submitted</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#185FA5'}}>{counts.inProgress}</div><div className={styles.statLabel}>In progress</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#888'}}>{counts.pending}</div><div className={styles.statLabel}>Pending</div></div>
          <div className={styles.stat}><div className={styles.statNum} style={{color:'#a32d2d'}}>{counts.failed}</div><div className={styles.statLabel}>Failed</div></div>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span>Scan #{sub.total_scans} progress</span>
            <span>{pct}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{width:`${pct}%`}} />
          </div>
          <p className={styles.nextScan}>Next automatic scan: <strong>{nextScan}</strong></p>
        </div>

        <div className={styles.section}>
          <h2>Broker status</h2>
          <div className={styles.brokerGrid}>
            {sortedJobs.map(job => {
              const notFound = job.result?.status === 'not_found'
              const statusClass = styles[job.status] || styles.pending
              return (
                <div key={job.id} className={`${styles.brokerCard} ${statusClass}`}>
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
          <p>Brokers typically process removals within <strong>3–30 days</strong>. Some will email you to confirm — click those links. DataShield automatically re-scans every 30 days.</p>
        </div>
      </main>
    </div>
  )
}
