import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useReviewStore } from '../stores/reviewStore'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const MASTERY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1']

const masteryLabels: Record<string, string> = {
  '0': '完全不会',
  '1': '有印象',
  '2': '模糊',
  '3': '基本掌握',
  '4': '熟练',
  '5': '完全掌握',
}

const errorTypeLabels: Record<string, string> = {
  '计算': '计算',
  '概念': '概念',
  '审题': '审题',
  '记忆': '记忆',
  '其他': '其他',
}

const frequencyLabels: Record<string, string> = {
  '高频': '高频',
  '中频': '中频',
  '低频': '低频',
}

export default function ReviewStatsPage() {
  const { detailedStats, loading, fetchDetailedStats } = useReviewStore()

  useEffect(() => {
    fetchDetailedStats()
  }, [fetchDetailedStats])

  if (loading && !detailedStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = detailedStats

  // Prepare chart data
  const masteryData = stats
    ? Object.entries(stats.mastery_distribution || {}).map(([key, value]) => ({
        name: masteryLabels[key] || `Level ${key}`,
        value,
      }))
    : []

  const errorTypeData = stats
    ? Object.entries(stats.error_type_distribution || {}).map(([key, value]) => ({
        name: errorTypeLabels[key] || key,
        value,
      }))
    : []

  const frequencyData = stats
    ? Object.entries(stats.frequency_distribution || {}).map(([key, value]) => ({
        name: frequencyLabels[key] || key,
        value,
      }))
    : []

  const reviewHistoryData = stats
    ? (stats.recent_reviews || []).map((r) => ({
        date: r.date.slice(5), // MM-DD
        count: r.count,
      }))
    : []

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">学习报告</h1>
          <Link
            to="/review"
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            ← 返回复习
          </Link>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">笔记总数</div>
            <div className="text-xl font-bold text-slate-800">{stats?.total_notes || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">考点总数</div>
            <div className="text-xl font-bold text-indigo-600">{stats?.total_exam_points || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">错题总数</div>
            <div className="text-xl font-bold text-rose-600">{stats?.total_wrong_questions || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3.5">
            <div className="text-xs text-slate-500 mb-1">连续天数</div>
            <div className="text-xl font-bold text-amber-600">{stats?.streak_days || 0}</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Mastery distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">掌握度分布</h3>
            {masteryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={masteryData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70}>
                    {masteryData.map((_, i) => (
                      <Cell key={i} fill={MASTERY_COLORS[i % MASTERY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">暂无数据</p>
            )}
          </div>

          {/* Error type distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">错误类型分布</h3>
            {errorTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={errorTypeData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70}>
                    {errorTypeData.map((_, i) => (
                      <Cell key={i} fill={['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#94a3b8'][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">暂无数据</p>
            )}
          </div>
        </div>

        {/* Frequency distribution + Review history */}
        <div className="grid grid-cols-2 gap-6">
          {/* Frequency distribution */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">考点频率分布</h3>
            {frequencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={frequencyData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70}>
                    {frequencyData.map((_, i) => (
                      <Cell key={i} fill={['#ef4444', '#f59e0b', '#10b981'][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">暂无数据</p>
            )}
          </div>

          {/* Recent 7 days review count */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">近7天复习量</h3>
            {reviewHistoryData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={reviewHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" fontSize={12} tick={{ fill: '#64748b' }} />
                  <YAxis fontSize={12} tick={{ fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
