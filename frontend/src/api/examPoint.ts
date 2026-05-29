import client from './client'
import type { ExamPoint, AnalyzeExamPointsResponse } from '../types/examPoint'

export async function listExamPoints(noteId: number): Promise<ExamPoint[]> {
  const res = await client.get<ExamPoint[]>(`/notes/${noteId}/exam-points`)
  return res.data
}

export async function analyzeExamPoints(noteId: number): Promise<AnalyzeExamPointsResponse> {
  const res = await client.post<AnalyzeExamPointsResponse>(`/notes/${noteId}/exam-points`, {}, { timeout: 120000 })
  return res.data
}
