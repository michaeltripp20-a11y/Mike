import { useState, useEffect } from 'react'

/* ─── Data ──────────────────────────────────────────────────────────────── */

const NAV_LINKS = ['About', 'Experience', 'Speaking', 'Writing', 'Newsletter', 'Contact']

const EXPERIENCE = [
  {
    company: 'Premium Retail Services',
    role: 'District Manager',
    period: '2020 – Present',
    desc: 'Leading 19 stores and a team of 60 field reps across Arkansas. Focused on execution, accountability, and turning floor-level data into district-wide results.',
  },
  {
    company: 'Nikco Wholesale',
    role: 'Director of Sales',
    period: 'Jan 2020 – Apr 2024',
    desc: 'Directed wholesale sales strategy, built out the sales team, and drove revenue growth across key retail accounts.',
  },
]

const SKILLS = ['Retail Operations', 'Field Team Leadership', 'District Management', 'Sales Strategy', 'Store Execution', 'Frontline Coaching', 'P&L Accountability', 'LinkedIn Content']

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function IconLinkedIn() {
  return (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

/* ─── Components ─────────────────────────────────────────────────────────── */

function Nav({ active, onNav }: { active: string; onNav: (s: string) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0f]/90 backdrop-blur border-b border-gray-800' : ''}`}>
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-white font-bold text-lg tracking-tight">MT</span>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <button
              key={l}
              onClick={() => onNav(l)}
              className={`text-sm transition-colors ${active === l ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              {l}
            </button>
          ))}
          <a
            href="mailto:michael@thetrippgroup.com"
            className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Get in touch
          </a>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(v => !v)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            {menuOpen ? <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></> : <><path d="M4 6h16M4 12h16M4 18h16"/></>}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a0a0f] border-b border-gray-800 px-6 pb-4 flex flex-col gap-4">
          {NAV_LINKS.map(l => (
            <button key={l} onClick={() => { onNav(l); setMenuOpen(false) }} className="text-left text-gray-300 text-sm">
              {l}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

function Hero({ onNav }: { onNav: (s: string) => void }) {
  return (
    <section id="hero" className="min-h-screen flex items-center px-6">
      <div className="max-w-5xl mx-auto w-full pt-24 pb-16">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-sm text-gray-300">District Manager · The Floor Report · mtripp76</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight tracking-tight animate-fade-up delay-100">
          Michael<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Tripp</span>
        </h1>

        <p className="mt-6 text-xl text-gray-400 max-w-xl leading-relaxed animate-fade-up delay-200">
          District Manager. Retail leader. I write about what actually works on the floor — for the managers running stores every day.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up delay-300">
          <a
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7472105417490333696"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Subscribe on LinkedIn <IconArrow />
          </a>
          <a
            href="https://thefloorreport.substack.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border border-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-colors"
          >
            Read on Substack
          </a>
          <button
            onClick={() => onNav('Contact')}
            className="flex items-center gap-2 border border-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-colors"
          >
            Contact me
          </button>
        </div>

        {/* Skill pills */}
        <div className="mt-16 flex flex-wrap gap-2 animate-fade-up delay-400">
          {SKILLS.map(s => (
            <span key={s} className="text-xs text-gray-400 border border-gray-700 rounded-full px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="About" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">About</p>
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">Execution over motivation.</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            I'm M Tripp — District Manager, retail leader, and founder of The Floor Report. I've led 19 stores and 60 reps across Arkansas, and I've learned that most leadership content is built for people who've never closed a store on a Saturday night.
          </p>
          <p className="text-gray-400 leading-relaxed">
            So I built something different. The Floor Report is a newsletter for the managers actually running the floor. And on LinkedIn as mtripp76, I post the kind of content that gets shared in manager group chats, not boardroom decks.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Stores led', value: '19' },
            { label: 'Field reps managed', value: '60' },
            { label: 'Newsletter', value: 'The Floor Report' },
            { label: 'Based in', value: 'Little Rock, AR' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Experience() {
  return (
    <section id="Experience" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">Experience</p>
        <h2 className="text-4xl font-bold text-white mb-12">Where I've been.</h2>
        <div className="space-y-4">
          {EXPERIENCE.map((e, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <div className="text-white font-semibold text-lg">{e.role}</div>
                  <div className="text-indigo-400 text-sm font-medium">{e.company}</div>
                </div>
                <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-3 py-1 self-start sm:self-auto">{e.period}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const SERVICES = [
  {
    title: 'Keynotes',
    desc: 'High-energy talks on retail leadership, execution, and building teams that perform — for conferences, kickoffs, and company events.',
  },
  {
    title: 'Leadership Retreats',
    desc: 'Facilitated sessions that get your leadership team aligned on standards, accountability, and how work actually gets done on the floor.',
  },
  {
    title: 'Team Workshops',
    desc: 'Hands-on training for store and district managers — practical frameworks your team can put to work the next shift.',
  },
  {
    title: 'Individual Coaching',
    desc: 'One-on-one coaching for retail leaders who want to level up — from running a store to running a district and beyond.',
  },
]

function Speaking({ onNav }: { onNav: (s: string) => void }) {
  return (
    <section id="Speaking" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">Speaking & Coaching</p>
        <h2 className="text-4xl font-bold text-white mb-4">Work with me.</h2>
        <p className="text-gray-400 leading-relaxed max-w-2xl mb-12">
          I'm available for keynotes, leadership retreats, team workshops, and individual coaching — built on real floor experience, not theory.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {SERVICES.map(s => (
            <div key={s.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
              <div className="text-white font-semibold mb-2">{s.title}</div>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNav('Contact')}
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          Book me <IconArrow />
        </button>
      </div>
    </section>
  )
}

const WRITING_TOPICS = [
  {
    title: 'Frontline Leadership',
    desc: 'Coaching reps, holding the standard, and leading people who are on their feet all day — without turning into the manager everyone dreads.',
  },
  {
    title: 'Store Execution',
    desc: 'Resets, planograms, audits, and the unglamorous details that separate stores that look ready from stores that are ready.',
  },
  {
    title: 'Managing Up & Across',
    desc: 'How to run a district, communicate with corporate, and protect your team from the noise that rolls downhill.',
  },
  {
    title: 'Career Growth in Retail',
    desc: 'Getting from the floor to the district — and what actually gets people promoted versus what they think does.',
  },
]

function Writing() {
  return (
    <section id="Writing" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">Writing</p>
        <h2 className="text-4xl font-bold text-white mb-12">What I write about.</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {WRITING_TOPICS.map(t => (
            <div key={t.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
              <div className="text-white font-semibold mb-2">{t.title}</div>
              <p className="text-gray-400 text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
        <blockquote className="border-l-2 border-indigo-400 pl-6 max-w-2xl">
          <p className="text-xl text-gray-200 leading-relaxed font-medium mb-3">
            "Your team watches what you reward, not what you say."
          </p>
          <cite className="text-sm text-gray-500 not-italic">— The Floor Report, Issue #1</cite>
        </blockquote>
      </div>
    </section>
  )
}

function Newsletter() {
  return (
    <section id="Newsletter" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">Newsletter</p>
          <h2 className="text-4xl font-bold text-white mb-4">The Floor Report</h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            Real retail leadership from someone who actually runs the floor. Published weekly. Practical — the kind you can use Monday.
          </p>
          <ul className="space-y-3 mb-8">
            {[
              'Written for store and district managers',
              'Execution-first. No fluff.',
              'Real tactics from the floor',
            ].map(line => (
              <li key={line} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                {line}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7472105417490333696"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe on LinkedIn <IconArrow />
            </a>
            <a
              href="https://thefloorreport.substack.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:border-gray-400 transition-colors"
            >
              Read on Substack
            </a>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-6">Latest from the newsletter</div>
          <div className="space-y-5">
            {[
              { title: 'Nobody Remembers Your Best Day', tag: 'Issue #2' },
              { title: 'Your Team Watches What You Reward, Not What You Say', tag: 'Issue #1' },
            ].map(item => (
              <a
                key={item.title}
                href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7472105417490333696"
                target="_blank"
                rel="noreferrer"
                className="block group"
              >
                <div className="text-xs text-indigo-400 font-semibold mb-1">{item.tag}</div>
                <div className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                  {item.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Opens the user's mail client pre-populated
    const subject = encodeURIComponent(`Message from ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name}\nEmail: ${form.email}`)
    window.open(`mailto:michael@thetrippgroup.com?subject=${subject}&body=${body}`, '_blank')
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <section id="Contact" className="py-24 px-6 border-t border-gray-800">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-3">Contact</p>
          <h2 className="text-4xl font-bold text-white mb-6">Let's talk.</h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Reach out about keynotes, leadership retreats, team workshops, individual coaching, The Floor Report, or anything else worth talking about.
          </p>
          <div className="flex flex-col gap-4">
            <a href="mailto:michael@thetrippgroup.com" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
              <IconMail /> michael@thetrippgroup.com
            </a>
            <a href="https://www.linkedin.com/in/mtripp76" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
              <IconLinkedIn /> mtripp76 on LinkedIn
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            required
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <textarea
            required
            rows={5}
            placeholder="Your message"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            {sent ? 'Opening mail client…' : 'Send message'} {!sent && <IconArrow />}
          </button>
        </form>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-800 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-gray-600 text-sm">© {new Date().getFullYear()} Michael Tripp · michaeltripp.com</span>
        <div className="flex items-center gap-5 text-gray-500">
          <a href="https://www.linkedin.com/in/mtripp76" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn"><IconLinkedIn /></a>
          <a href="mailto:michael@thetrippgroup.com" className="hover:text-white transition-colors" aria-label="Email"><IconMail /></a>
          <a href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7472105417490333696" target="_blank" rel="noreferrer" className="text-sm hover:text-white transition-colors">The Floor Report</a>
        </div>
      </div>
    </footer>
  )
}

/* ─── App ────────────────────────────────────────────────────────────────── */

export default function App() {
  const [activeNav, setActiveNav] = useState('')

  function scrollTo(id: string) {
    setActiveNav(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const sections = ['About', 'Experience', 'Speaking', 'Writing', 'Newsletter', 'Contact']
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.id) })
      },
      { threshold: 0.4 }
    )
    sections.forEach(s => { const el = document.getElementById(s); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Nav active={activeNav} onNav={scrollTo} />
      <Hero onNav={scrollTo} />
      <About />
      <Experience />
      <Speaking onNav={scrollTo} />
      <Writing />
      <Newsletter />
      <Contact />
      <Footer />
    </div>
  )
}
