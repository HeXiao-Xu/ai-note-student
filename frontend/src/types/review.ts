export interface ReviewItem {
  plan_id: number
  ref_type: 'exam_point' | 'wrong_question'
  ref_id: number
  note_id: number
  note_title: string
  content: string
  next_review_at: string
  interval_days: number
  review_count: number
  mastery: number
}

export interface ReviewStats {
  due_today: number
  completed_today: number
  total_items: number
  streak_days: number
  mastery_distribution: Record<string, number>
}

export interface DetailedStats {
  total_notes: number
  total_exam_points: number
  total_wrong_questions: number
  total_review_plans: number
  due_today: number
  completed_today: number
  streak_days: number
  error_type_distribution: Record<string, number>
  frequency_distribution: Record<string, number>
  mastery_distribution: Record<string, number>
  recent_reviews: DailyReviewCount[]
}

export interface DailyReviewCount {
  date: string
  count: number
}

export interface QuickNotesResponse {
  note_id: number
  title: string
  content: string
}
