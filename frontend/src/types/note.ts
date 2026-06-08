export interface Note {
  id: number
  user_id: number
  course_id: number
  title: string
  content: string
  tags: string[]
  is_exam_focus: boolean
  file_type: string
  file_object_key: string
  pdf_object_key: string
  file_content: string
  created_at: string
  updated_at: string
}

export interface CreateNoteRequest {
  title: string
  content?: string
  tags?: string[]
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  tags?: string[]
}
