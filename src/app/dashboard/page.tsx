'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

export default function Dashboard() {
  const [state, setState] = useState<'loading'|'ready'|'no-sub'>('loading')
  const [jobs, setJobs] = useState<any[]>([])
  const [sub, setSub] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [sendingReport, setSendingReport] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    async function init() {
      // Wait for Supabase to process URL hash if coming from magic link
      await new Promise(r => setTimeout(r, 1500))

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Try one more time after another second
        await new Promise(r => setTimeout(r, 2000))
        const { data: { session: session2 } } = await supabase.auth.getSession()
        if (!session2) { window.location.href = '/'; return }
        setEmail(session2.user.email || '')
      } else {
        setEmail(session.user.email || '')
      }

      const { data } = await supabase.rpc('get_my_dashboard')
      setSub(data?.subscription || null)
      setJobs(data?.jobs || [])
      setState(data?.subscription ? 'ready' : 'no-sub')
    }
    init()
  }, [])

  useEffect(() => {
    if (state !== 'ready') return
    const t = setInterval(async () => {
      const { data } = await supabase.rpc('get_my_dashboard')
      if (data?.subscription) { setSub(data.subscription); setJobs(data.jobs || []) }
    }, 10000)
    return () => clearInterval(t)
  }, [state])

  if (state === 'loading') return (
    <div className={styles.loading}>
      <div style={{width:44,height:44,background:'#0f1117',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,marginBottom:16}}>DS</div>
      <div style={{color:'#888',fontSize:14}}>Loading your dashboard...</div>
    </div>
  )

  if (state === 'no-sub') return (
    <div className={styles.loading}>
      <div style={{width:44,height:44,background:'#0f1117',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,marginBottom:16}}>DS</div>
      <p style={{marginBottom:12,color:'#444',fontSize:15}}>No active subscription found.</p>
      <a href="/pricing" style={{color:'#0f1117',fontSize:14,fontWeight:500}}>See plans →</a>
    </div>
  )

  const done = jobs.filter((j:any) => j.status==='completed').length
  const active = jobs.filter((j:any) => ['running','claimed'].includes(j.status)).length
  const pending = jobs.filter((j:any) => j.status==='pending').length
  const failed = jobs.filter((j:any) => j.status==='failed').length
  const pct = jobs.length ? Math.round(done/jobs.length*100) : 0
  const COLOR:any = {completed:'#0f6e56',running:'#185FA5',claimed:'#854F0B',pending:'#888',failed:'#A32D2D'}
  const ICON:any = {completed:'✓',running:'●',claimed:'○',pending:'○',failed:'✗'}
  const LABEL:any = {completed:'Submitted',running:'Running',claimed:'Queued',pending:'Waiting',failed:'Failed'}
  const sorted = [...jobs].sort((a:any,b:any) => ({completed:0,running:1,claimed:2,pending:3,failed:4} as any)[a.status] - ({completed:0,running:1,claimed:2,pending:3,failed:4} as any)[b.status] || a.broker_name.localeCompare(b.broker_name))
  const nextScan = sub?.next_scan_at ? new Date(sub.next_scan_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '—'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}><div className={styles.logo}>DS</div><span>DataShield</span></div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{email}</span>
          <button className={styles.bellBtn} disabled={sendingReport} onClick={async()=>{setSendingReport(true);await fetch('https://raiddanqvnzxyjwfmyqo.supabase.co/functions/v1/notify-scan-complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription_id:sub.id})});setSendingReport(false);setReportSent(true);setTimeout(()=>setReportSent(false),3000)}}>
            {reportSent?'✓ Sent':sendingReport?'...':'🔔 Email report'}
          </button>
          <button className={styles.signOut} onClick={async()=>{await supabase.auth.signOut();window.location.href='/'}}>Sign out</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Hi, {sub?.subject_name?.split(' ')[0]||'there'} 👋</h1>
          <p>Scan #{sub?.total_scans} — {jobs.length} brokers monitored</p>
        </div>
        <div className={styles.stats}>
          {[['Submitted',done,'#0f6e56'],['Running',active,'#185FA5'],['Pending',pending,'#888'],['Failed',failed,'#a32d2d']].map(([l,n,c])=>(
            <div key={l as string} className={styles.stat}><div className={styles.statNum} style={{color:c as string}}>{n as number}</div><div className={styles.statLabel}>{l as string}</div></div>
          ))}
        </div>
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}><span>Progress</span><span>{pct}%</span></div>
          <div className={styles.progressBar}><div className={styles.progressFill} style={{width:`${pct}%`}}/></div>
          <p className={styles.nextScan}>Next scan: <strong>{nextScan}</strong></p>
        </div>
        <div className={styles.section}>
          <h2>Broker status</h2>
          <div className={styles.brokerGrid}>
            {sorted.map((j:any)=>(
              <div key={j.id} className={`${styles.brokerCard} ${styles[j.status]||styles.pending}`}>
                <div className={styles.brokerIcon} style={{background:COLOR[j.status]+'22',color:COLOR[j.status]}}>{ICON[j.status]||'○'}</div>
                <div><div className={styles.brokerName}>{j.broker_name}</div><div className={styles.brokerStatus}>{j.result?.status==='not_found'?'Not listed':LABEL[j.status]||j.status}</div></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
