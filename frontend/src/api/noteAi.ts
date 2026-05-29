import client from './client'
import type { QuickNotesResponse } from '../types/review'

export async function generateQuickNotes(noteId: number): Promise<QuickNotesResponse> {
  const res = await client.post<QuickNotesResponse>('/exam-points/generate-quick', { note_id: noteId }, { timeout: 120000 })
  return res.data
}
