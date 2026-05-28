import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Decorative left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden noise-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 via-slate-900/40 to-slate-950/90" />
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-teal-400/8 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-100 font-serif">AI Note</span>
            </div>
          </div>

          <div className="max-w-sm">
            <blockquote className="text-2xl font-serif text-slate-200 leading-relaxed mb-6">
              「好记性不如烂笔头」
            </blockquote>
            <p className="text-slate-400 text-sm leading-relaxed">
              用智能笔记整理你的学习世界。AI 辅助、智能归类、一键检索，让知识不再遗忘。
            </p>

            <div className="flex gap-6 mt-10">
              <div>
                <div className="text-2xl font-bold text-teal-400">AI</div>
                <div className="text-xs text-slate-500 mt-1">智能辅助</div>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <div className="text-2xl font-bold text-teal-400">∞</div>
                <div className="text-xs text-slate-500 mt-1">无限笔记</div>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <div className="text-2xl font-bold text-teal-400">⚡</div>
                <div className="text-xs text-slate-500 mt-1">即时搜索</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600">© 2026 AI Note Student</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-100 font-serif">AI Note</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
