'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

interface Subscriber {
  user_id: string
  subject_name: string
  subject_email: string
  plan_id: string
  status: string
  total_scans: number
  next_scan_at: string
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  subscription_id: string
}

interface Health {
  total_subscribers: number
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  pending_jobs: number
  running_jobs: number
  emails_sent: number
  recent_emails: any[]
}

export default function AdminPage() {
  const [subs, setSubs] = useState<Subscriber[]>([])
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [notifying, setNotifying] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [{ data: s }, { data: h }] = await Promise.all([
      supabase.rpc('admin_get_subscribers'),
      supabase.rpc('admin_get_health')
    ])
    setSubs(s || [])
    setHealth(h)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function triggerRescan(subscriptionId: string, name: string) {
    if (!confirm(`Trigger new scan for ${name}?`)) return
    setTriggering(subscriptionId)
    await supabase.rpc('admin_trigger_rescan', { p_subscription_id: subscriptionId })
    setTriggering(null)
    load()
  }

  async function sendReport(subscriptionId: string) {
    setNotifying(subscriptionId)
    await fetch(`https://raiddanqvnzxyjwfmyqo.supabase.co/functions/v1/notify-scan-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subscriptionId })
    })
    setNotifying(null)
    load()
  }

  if (loading) return <div className={styles.loading}>Loading admin...</div>
  if (!health) return <div className={styles.loading}>Access denied</div>

  const successRate = health.total_jobs > 0 ? Math.round((health.completed_jobs / health.total_jobs) * 100) : 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}><div className={styles.logo}>DS</div><span>DataShield Admin</span></div>
        <a href="/dashboard" className={styles.signOut}>← Dashboard</a>
      </header>

      <main className={styles.main}>
        {/* Health Overview */}
        <h2 className={styles.sectionTitle}>System health</h2>
        <div className={styles.healthGrid}>
          <div className={styles.healthCard}><div className={styles.statNum} style={{color:'#0f6e56'}}>{health.total_subscribers}</div><div className={styles.statLabel}>Active subscribers</div></div>
          <div className={styles.healthCard}><div className={styles.statNum} style={{color:'#185FA5'}}>{health.running_jobs}</div><div className={styles.statLabel}>Jobs running</div></div>
          <div className={styles.healthCard}><div className={styles.statNum} style={{color:'#888'}}>{health.pending_jobs}</div><div className={styles.statLabel}>Jobs pending</div></div>
          <div className={styles.healthCard}><div className={styles.statNum} style={{color:'#A32D2D'}}>{health.failed_jobs}</div><div className={styles.statLabel}>Jobs failed</div></div>
          <div className={styles.healthCard}><div className={styles.statNum}>{health.emails_sent}</div><div className={styles.statLabel}>Emails sent</div></div>
          <div className={styles.healthCard}><div className={styles.statNum} style={{color:'#0f6e56'}}>{successRate}%</div><div className={styles.statLabel}>Success rate</div></div>
        </div>

        <div className={styles.progressCard}>
          <div className={styles.progressHeader}><span>Overall job success rate</span><span>{health.completed_jobs} / {health.total_jobs}</span></div>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{width:`${successRate}%`}} /></div>
        </div>

        {/* Subscribers */}
        <h2 className={styles.sectionTitle}>Subscribers ({subs.length})</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name / Email</span><span>Plan</span><span>Progress</span><span>Scans</span><span>Next scan</span><span>Actions</span>
          </div>
          {subs.map(s => {
            const pct = s.total_jobs > 0 ? Math.round((s.completed_jobs / s.total_jobs) * 100) : 0
            return (
              <div key={s.subscription_id} className={styles.tableRow}>
                <div>
                  <div className={styles.subName}>{s.subject_name}</div>
                  <div className={styles.subEmail}>{s.subject_email}</div>
                </div>
                <div><span className={styles.planBadge}>{s.plan_id}</span></div>
                <div>
                  <div className={styles.miniProgress}>
                    <div className={styles.miniProgressFill} style={{width:`${pct}%`}} />
                  </div>
                  <div className={styles.progressText}>{s.completed_jobs}/{s.total_jobs} ({pct}%)</div>
                </div>
                <div className={styles.scanCount}>#{s.total_scans}</div>
                <div className={styles.nextDate}>{s.next_scan_at ? new Date(s.next_scan_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}</div>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => triggerRescan(s.subscription_id, s.subject_name)} disabled={triggering === s.subscription_id}>
                    {triggering === s.subscription_id ? '...' : '↺ Scan'}
                  </button>
                  <button className={styles.actionBtn} onClick={() => sendReport(s.subscription_id)} disabled={notifying === s.subscription_id}>
                    {notifying === s.subscription_id ? '...' : '✉ Report'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Email Log */}
        <h2 className={styles.sectionTitle}>Recent email activity</h2>
        <div className={styles.emailLog}>
          {(health.recent_emails || []).length === 0 && <p className={styles.empty}>No emails sent yet.</p>}
          {(health.recent_emails || []).map((e: any, i: number) => (
            <div key={i} className={styles.emailRow}>
              <span className={`${styles.emailType} ${styles[e.type]}`}>{e.type.replace('_', ' ')}</span>
              <span className={styles.emailRecipient}>{e.recipient_email}</span>
              <span className={`${styles.emailStatus} ${e.status === 'sent' ? styles.sent : styles.failed}`}>{e.status}</span>
              <span className={styles.emailDate}>{new Date(e.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
