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
  session_id: number
}

export interface QASession {
  id: number
  user_id: number
  course_id: number
  title: string
  created_at: string
  updated_at: string
}

export interface QAConversation {
  id: number
  user_id: number
  session_id: number
  course_id: number
  question: string
  answer: string
  source_note_ids: number[]
  source_info?: {
    source_notes?: SourceNote[]
    source_entities?: SourceEntity[]
  }
  source_notes?: SourceNote[]
  source_entities?: SourceEntity[]
  created_at: string
}
