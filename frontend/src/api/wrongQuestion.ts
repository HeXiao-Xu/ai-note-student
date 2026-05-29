import client from './client'
import type { WrongQuestion, CreateWrongQuestionRequest, UpdateWrongQuestionRequest, ListWrongQuestionsResponse, AnalysisResponse } from '../types/wrongQuestion'

export async function listWrongQuestions(params?: { page?: number; page_size?: number; error_type?: string }): Promise<ListWrongQuestionsResponse> {
  const res = await client.get<ListWrongQuestionsResponse>('/wrong-questions', { params })
  return res.data
}

export async function getWrongQuestion(id: number): Promise<WrongQuestion> {
  const res = await client.get<WrongQuestion>(`/wrong-questions/${id}`)
  return res.data
}

export async function createWrongQuestion(data: CreateWrongQuestionRequest): Promise<WrongQuestion> {
  const res = await client.post<WrongQuestion>('/wrong-questions', data)
  return res.data
}

export async function updateWrongQuestion(id: number, data: UpdateWrongQuestionRequest): Promise<WrongQuestion> {
  const res = await client.put<WrongQuestion>(`/wrong-questions/${id}`, data)
  return res.data
}

export async function deleteWrongQuestion(id: number): Promise<void> {
  await client.delete(`/wrong-questions/${id}`)
}

export async function uploadWrongQuestionImage(id: number, file: File): Promise<WrongQuestion> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<WrongQuestion>(`/wrong-questions/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function analyzeWrongQuestion(id: number): Promise<AnalysisResponse> {
  const res = await client.post<AnalysisResponse>(`/wrong-questions/${id}/analyze`, {}, { timeout: 120000 })
  return res.data
}
