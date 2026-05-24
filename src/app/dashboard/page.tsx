'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

interface Job { id: string; broker_name: string; status: string; result: any; error_message: string | null }
interface Subscription { id: string; plan_id: string; status: string; subject_name: string; next_scan_at: string; total_scans: number }
const STATUS_ICON: Record<string, string> = { completed: '✓', running: '●', claimed: '○', pending: '○', failed: '✗' }
const STATUS_LABEL: Record<string, string> = { completed: 'Submitted', running: 'Running', claimed: 'Queued', pending: 'Waiting', failed: 'Failed' }

export default function Dashboard() {
  const [ready, setReady] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    async function init() {
      // Step 1: Try to extract tokens from URL hash (magic link flow)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error || !data.session) { window.location.href = '/'; return }
          // Clean up URL
          window.history.replaceState(null, '', '/dashboard')
          setUserEmail(data.session.user.email || '')
          const { data: d } = await supabase.rpc('get_my_dashboard')
          setSub(d?.subscription || null)
          setJobs(d?.jobs || [])
          setReady(true)
          return
        }
      }

      // Step 2: Check existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/'; return }
      setUserEmail(session.user.email || '')
      const { data: d } = await supabase.rpc('get_my_dashboard')
      setSub(d?.subscription || null)
      setJobs(d?.jobs || [])
      setReady(true)
    }
    init()
  }, [])

  useEffect(() => {
    if (!ready) return
    const interval = setInterval(async () => {
      const { data: d } = await supabase.rpc('get_my_dashboard')
      setSub(d?.subscription || null)
      setJobs(d?.jobs || [])
    }, 10000)
    return () => clearInterval(interval)
  }, [ready])

  if (!ready) return (
    <div className={styles.loading}>
      <div style={{width:48,height:48,background:'#0f1117',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16,marginBottom:16}}>DS</div>
      <div style={{fontSize:14,color:'#888'}}>Loading...</div>
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
  const nextScan = sub.next_scan_at ? new Date(sub.next_scan_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '—'
  const sorted = [...jobs].sort((a,b) => ({completed:0,running:1,claimed:2,pending:3,failed:4} as any)[a.status] - ({completed:0,running:1,claimed:2,pending:3,failed:4} as any)[b.status])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}><div className={styles.logo}>DS</div><span>DataShield</span></div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{userEmail}</span>
          <button className={styles.bellBtn} onClick={async()=>{await fetch('https://raiddanqvnzxyjwfmyqo.supabase.co/functions/v1/notify-scan-complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription_id:sub.id})}); setReportSent(true); setTimeout(()=>setReportSent(false),3000)}}>
            {reportSent?'✓ Sent':'🔔 Email report'}
          </button>
          <button className={styles.signOut} onClick={async()=>{await supabase.auth.signOut();window.location.href='/'}}>Sign out</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Hi, {sub.subject_name?.split(' ')[0]||'there'} 👋</h1>
          <p>Scan #{sub.total_scans} — {jobs.length} brokers</p>
        </div>
        <div className={styles.stats}>
          {[['Submitted',counts.completed,'#0f6e56'],['Running',counts.inProgress,'#185FA5'],['Pending',counts.pending,'#888'],['Failed',counts.failed,'#a32d2d']].map(([l,n,c])=>(
            <div key={l as string} className={styles.stat}><div className={styles.statNum} style={{color:c as string}}>{n as number}</div><div className={styles.statLabel}>{l as string}</div></div>
          ))}
        </div>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}><span>Scan #{sub.total_scans}</span><span>{pct}%</span></div>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{width:`${pct}%`}}/></div>
          <p className={styles.nextScan}>Next scan: <strong>{nextScan}</strong></p>
        </div>
        <div className={styles.section}>
          <h2>Broker status</h2>
          <div className={styles.brokerGrid}>
            {sorted.map(job=>(
              <div key={job.id} className={`${styles.brokerCard} ${styles[job.status]||styles.pending}`}>
                <div className={styles.brokerIcon}>{STATUS_ICON[job.status]||'○'}</div>
                <div><div className={styles.brokerName}>{job.broker_name}</div><div className={styles.brokerStatus}>{job.result?.status==='not_found'?'Not listed':STATUS_LABEL[job.status]}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.infoBox}><h3>What happens next?</h3><p>Brokers process removals within <strong>3–30 days</strong>. Some will email you to confirm. DataShield re-scans every 30 days.</p></div>
      </main>
    </div>
  )
}
