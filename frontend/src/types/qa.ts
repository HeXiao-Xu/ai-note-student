export interface SourceNote {
  id: number
  title: string
  relevance: number
}

export interface SourceEntity {
  id: number
  name: string
  type: string
}

export interface AskResult {
  answer: string
  source_notes: SourceNote[]
  source_entities: SourceEntity[]
}

export interface QAConversation {
  id: number
  user_id: number
  course_id: number
  question: string
  answer: string
  source_note_ids: number[]
  created_at: string
}
