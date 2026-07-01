import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useReviewStore } from '../stores/reviewStore'
import ReviewCard from '../components/ReviewCard'

export default function ReviewPage() {
  const { todayItems, stats, loading, fetchTodayReviews, fetchStats, answerReview } = useReviewStore()

  useEffect(() => {
    fetchTodayReviews()
    fetchStats()
  }, [fetchTodayReviews, fetchStats])

  const handleAnswer = async (planId: number, quality: number) => {
    await answerReview(planId, quality)
    // Refresh stats after answering
    fetchStats()
  }

  const completedToday = stats?.completed_today || 0
  const streakDays = stats?.streak_days || 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">今日复习</h1>
          <Link
            to="/review/stats"
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            学习报告 →
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">待复习</div>
            <div className="text-2xl font-bold text-indigo-600">{todayItems.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">今日已完成</div>
            <div className="text-2xl font-bold text-emerald-600">{completedToday}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">连续天数</div>
            <div className="text-2xl font-bold text-amber-600">{streakDays}</div>
          </div>
        </div>

        {/* Review cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : todayItems.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500 font-medium">今日复习已完成</p>
            <p className="text-xs text-slate-400 mt-1">继续保持，明天见！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayItems.map((item) => (
              <ReviewCard
                key={item.plan_id}
                item={item}
                onAnswer={handleAnswer}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
