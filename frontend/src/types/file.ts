export interface FileAttachment {
  id: number
  note_id: number
  file_name: string
  file_type: string
  object_key: string
  file_size: number
  ocr_text: string
  parse_text: string
  ocr_status: 'pending' | 'processing' | 'done' | 'failed'
  parse_status: 'pending' | 'processing' | 'done' | 'failed'
  created_at: string
}
