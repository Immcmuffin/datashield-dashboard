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
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.navShield}>DS</span>
          <span className={styles.navName}>DataShield</span>
        </div>
        <div className={styles.navLinks}>
          <a href="/pricing">Pricing</a>
          <a href="/dashboard" className={styles.navCta}>Sign in →</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>🔒 Automated data removal</div>
        <h1 className={styles.heroTitle}>
          Your personal data<br />
          is <span className={styles.accent}>everywhere.</span><br />
          We remove it.
        </h1>
        <p className={styles.heroSub}>
          DataShield scans 50+ data broker sites and submits removal requests on your behalf — automatically, every 30 days.
        </p>
        <div className={styles.heroActions}>
          {sent ? (
            <div className={styles.sent}>
              <span>✓</span> Check your email for the sign-in link
            </div>
          ) : (
            <form onSubmit={handleLogin} className={styles.heroForm}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={styles.heroInput}
              />
              <button type="submit" disabled={loading} className={styles.heroBtn}>
                {loading ? 'Sending...' : 'Get started free →'}
              </button>
            </form>
          )}
          <p className={styles.heroNote}>No credit card required to sign in. Cancel anytime.</p>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.stat}><strong>50+</strong><span>Data brokers</span></div>
        <div className={styles.statDivider} />
        <div className={styles.stat}><strong>30 days</strong><span>Re-scan cycle</span></div>
        <div className={styles.statDivider} />
        <div className={styles.stat}><strong>Automatic</strong><span>No manual work</span></div>
        <div className={styles.statDivider} />
        <div className={styles.stat}><strong>Real-time</strong><span>Dashboard tracking</span></div>
      </section>

      {/* How it works */}
      <section className={styles.how}>
        <h2>How it works</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>01</div>
            <h3>Subscribe</h3>
            <p>Choose a plan and provide your basic info. We handle the rest automatically.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>02</div>
            <h3>We scan</h3>
            <p>Our system scans 50+ data broker sites and finds your personal information.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>03</div>
            <h3>We remove</h3>
            <p>Removal requests are submitted automatically. You get a full report by email.</p>
          </div>
          <div className={styles.stepArrow}>→</div>
          <div className={styles.step}>
            <div className={styles.stepNum}>04</div>
            <h3>We repeat</h3>
            <p>Brokers re-add data over time. We re-scan every 30 days to keep you protected.</p>
          </div>
        </div>
      </section>

      {/* Brokers */}
      <section className={styles.brokers}>
        <h2>Sites we remove you from</h2>
        <div className={styles.brokerList}>
          {['Spokeo','Whitepages','BeenVerified','Intelius','Radaris','MyLife','TruthFinder','FastPeopleSearch','Instant Checkmate','ZabaSearch','PeekYou','Pipl','AnyWho','USSearch','Nuwber','PublicRecordsNow','InfoTracer','Clustrmaps','Addresses','PeopleFinder'].map(b => (
            <span key={b} className={styles.brokerTag}>{b}</span>
          ))}
          <span className={styles.brokerTag} style={{background:'#0f1117',color:'#fff'}}>+ 30 more</span>
        </div>
      </section>

      {/* Pricing preview */}
      <section className={styles.pricingPreview}>
        <h2>Simple, transparent pricing</h2>
        <p>Start protecting your privacy today.</p>
        <div className={styles.plans}>
          <div className={styles.plan}>
            <div className={styles.planName}>Basic</div>
            <div className={styles.planPrice}>$6.99<span>/mo</span></div>
            <div className={styles.planDesc}>20 brokers, monthly scans</div>
            <a href="https://buy.stripe.com/5kQ7sK2KC4NeaNa76F4Vy00" className={styles.planBtn}>Get started →</a>
          </div>
          <div className={`${styles.plan} ${styles.planFeatured}`}>
            <div className={styles.planBadge}>Most popular</div>
            <div className={styles.planName}>Pro</div>
            <div className={styles.planPrice}>$12.99<span>/mo</span></div>
            <div className={styles.planDesc}>50+ brokers, bi-weekly scans</div>
            <a href="https://buy.stripe.com/dRm28q0CudjKdZmdv34Vy01" className={`${styles.planBtn} ${styles.planBtnWhite}`}>Get started →</a>
          </div>
          <div className={styles.plan}>
            <div className={styles.planName}>Elite</div>
            <div className={styles.planPrice}>$19.99<span>/mo</span></div>
            <div className={styles.planDesc}>Unlimited brokers, weekly scans</div>
            <a href="https://buy.stripe.com/9B63cu990bbC1cAdv34Vy02" className={styles.planBtn}>Get started →</a>
          </div>
        </div>
        <a href="/pricing" className={styles.allPlans}>See full pricing details →</a>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <h2>Start protecting your privacy today</h2>
        <p>Join thousands of people who've taken back control of their personal data.</p>
        <a href="/pricing" className={styles.footerCtaBtn}>See plans →</a>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span className={styles.navShield} style={{width:24,height:24,fontSize:10}}>DS</span>
          <span>DataShield</span>
        </div>
        <div className={styles.footerLinks}>
          <a href="/pricing">Pricing</a>
          <a href="/dashboard">Dashboard</a>
          <a href="mailto:support@removemydata.app">Support</a>
        </div>
        <div className={styles.footerCopy}>© 2026 DataShield · removemydata.app</div>
      </footer>
    </main>
  )
}
