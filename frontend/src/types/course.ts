export interface Course {
  id: number
  user_id: number
  name: string
  description: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateCourseRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateCourseRequest {
  name?: string
  description?: string
  color?: string
  sort_order?: number
}
