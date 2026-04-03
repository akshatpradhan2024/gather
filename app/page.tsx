import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="text-xl font-bold text-white tracking-tight">Gather</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-4 text-4xl mb-8 select-none">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎉</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🥳</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎊</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none mb-6">
            Gather
          </h1>
          <p className="text-lg sm:text-xl text-white/60 mb-10 leading-relaxed">
            Host events. Share the link. Everyone shows up.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-150 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              Create an Event
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-150 border border-white/10"
            >
              Log In
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '✍️', title: 'Create in seconds', desc: "Set your event details, pick an emoji, and you're done." },
            { emoji: '🔗', title: 'Share a link', desc: 'One link for all your guests — no app download required.' },
            { emoji: '📱', title: 'SMS reminders', desc: "We'll text your guests automatically the day before." },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left"
            >
              <div className="text-2xl mb-3">{feature.emoji}</div>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-white/20 text-xs py-6 pb-8">
        Made with love &amp; Gather
      </footer>
    </div>
  )
}
