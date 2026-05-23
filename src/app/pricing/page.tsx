'use client'
import { useState } from 'react'
import styles from './page.module.css'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    desc: 'Perfect for getting started',
    monthly: 6.99,
    yearly: 59.99,
    features: ['20 data broker removals', 'Monthly re-scans', 'Email scan reports', 'Customer dashboard'],
    monthlyLink: 'https://buy.stripe.com/test_5kQ7sK2KC4NeaNa76F4Vy00',
    yearlyLink: 'https://buy.stripe.com/test_5kQ7sK2KC4NeaNa76F4Vy00',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Most popular for full protection',
    monthly: 12.99,
    yearly: 99.99,
    features: ['50+ data broker removals', 'Bi-weekly re-scans', 'Email scan reports', 'Customer dashboard', 'Priority processing'],
    monthlyLink: 'https://buy.stripe.com/test_dRm28q0CudjKdZmdv34Vy01',
    yearlyLink: 'https://buy.stripe.com/test_dRm28q0CudjKdZmdv34Vy01',
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    desc: 'Maximum privacy protection',
    monthly: 19.99,
    yearly: 149.99,
    features: ['Unlimited data brokers', 'Weekly re-scans', 'Email scan reports', 'Customer dashboard', 'Priority processing', 'Dedicated support'],
    monthlyLink: 'https://buy.stripe.com/test_9B63cu990bbC1cAdv34Vy02',
    yearlyLink: 'https://buy.stripe.com/test_9B63cu990bbC1cAdv34Vy02',
    highlight: false,
  },
]

export default function Pricing() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>DS</div>
          <span>DataShield</span>
        </div>
        <a href="/dashboard" className={styles.signIn}>Sign in →</a>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>Your data, removed automatically</h1>
          <p>We scan 50+ data broker sites and submit removal requests on your behalf — every 30 days, automatically.</p>
        </div>

        <div className={styles.toggle}>
          <button className={interval === 'monthly' ? styles.active : ''} onClick={() => setInterval('monthly')}>Monthly</button>
          <button className={interval === 'yearly' ? styles.active : ''} onClick={() => setInterval('yearly')}>
            Yearly <span className={styles.badge}>Save 35%</span>
          </button>
        </div>

        <div className={styles.plans}>
          {PLANS.map(plan => (
            <div key={plan.id} className={`${styles.plan} ${plan.highlight ? styles.featured : ''}`}>
              {plan.highlight && <div className={styles.popularBadge}>Most popular</div>}
              <h2>{plan.name}</h2>
              <p className={styles.planDesc}>{plan.desc}</p>
              <div className={styles.price}>
                <span className={styles.amount}>${interval === 'monthly' ? plan.monthly : (plan.yearly / 12).toFixed(2)}</span>
                <span className={styles.period}>/mo</span>
              </div>
              {interval === 'yearly' && <p className={styles.billed}>Billed ${plan.yearly}/yr</p>}
              <a href={interval === 'monthly' ? plan.monthlyLink : plan.yearlyLink} className={styles.cta}>
                Get started →
              </a>
              <ul className={styles.features}>
                {plan.features.map(f => <li key={f}><span>✓</span> {f}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.trust}>
          <div className={styles.trustItem}><strong>20+</strong><span>Data brokers covered</span></div>
          <div className={styles.trustItem}><strong>30 days</strong><span>Re-scan frequency</span></div>
          <div className={styles.trustItem}><strong>Automatic</strong><span>No manual work needed</span></div>
        </div>

        <div className={styles.faq}>
          <h2>Common questions</h2>
          <div className={styles.faqItem}>
            <h3>How does it work?</h3>
            <p>After you subscribe, we immediately scan data broker sites for your information and submit removal requests. Most brokers process removals within 3–30 days. We re-scan every 30 days since brokers often re-add removed listings.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Will I get confirmation emails?</h3>
            <p>Yes — some brokers will email you to confirm your removal request. You'll need to click those confirmation links. We'll also email you a full scan report when each sweep is complete.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Can I cancel anytime?</h3>
            <p>Yes. Cancel anytime from your dashboard with no fees or penalties.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
