export interface WrongQuestion {
  id: number
  user_id: number
  note_id: number | null
  question: string
  answer: string
  my_answer: string
  error_type: string  // 计算/概念/审题/记忆/其他
  image_url: string
  mastery: number  // 0-5
  analysis: string
  created_at: string
  updated_at: string
}

export interface CreateWrongQuestionRequest {
  note_id?: number | null
  question: string
  answer?: string
  my_answer?: string
  error_type?: string
}

export interface UpdateWrongQuestionRequest {
  question?: string
  answer?: string
  my_answer?: string
  error_type?: string
  mastery?: number
}

export interface ListWrongQuestionsResponse {
  items: WrongQuestion[]
  total: number
  page: number
  page_size: number
}

export interface AnalysisResponse {
  root_cause: string
  knowledge_gaps: string[]
  suggestion: string
}
