import api from './client'
import type { AskResult, QAConversation, QASession } from '../types/qa'

export function askQuestion(question: string, courseId?: number, sessionId?: number) {
  return api.post<AskResult>('/qa/ask', {
    question,
    course_id: courseId || 0,
    session_id: sessionId || 0,
  }, { timeout: 120000 })
}

export function listSessions(courseId?: number) {
  const params: Record<string, string | number> = {}
  if (courseId) params.course_id = courseId
  return api.get<QASession[]>('/qa/sessions', { params })
}

export function getSessionMessages(sessionId: number) {
  return api.get<QAConversation[]>(`/qa/sessions/${sessionId}/messages`)
}

export function deleteSession(sessionId: number) {
  return api.delete(`/qa/sessions/${sessionId}`)
}

export function renameSession(sessionId: number, title: string) {
  return api.put(`/qa/sessions/${sessionId}`, { title })
}
