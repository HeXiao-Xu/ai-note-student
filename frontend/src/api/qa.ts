import api from './client'
import type { AskResult, QAConversation } from '../types/qa'

export function askQuestion(question: string, courseId?: number) {
  return api.post<AskResult>('/qa/ask', { question, course_id: courseId || 0 }, { timeout: 120000 })
}

export function getHistory(courseId?: number) {
  const params: Record<string, string | number> = {}
  if (courseId) params.course_id = courseId
  return api.get<QAConversation[]>('/qa/history', { params })
}
