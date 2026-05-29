export interface ExamPoint {
  id: number
  note_id: number
  content: string
  frequency: string  // 高频/中频/低频
  source: string
  exam_years: number[]
  created_at: string
  updated_at: string
}

export interface AnalyzeExamPointsResponse {
  exam_points: ExamPoint[]
}
