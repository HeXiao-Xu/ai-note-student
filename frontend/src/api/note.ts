import client from './client'
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/note'

export async function listNotesByCourse(courseId: number): Promise<Note[]> {
  const res = await client.get<Note[]>(`/courses/${courseId}/notes`)
  return res.data
}

export async function listAllNotes(): Promise<Note[]> {
  const res = await client.get<Note[]>('/notes')
  return res.data
}

export async function createNote(courseId: number, data: CreateNoteRequest): Promise<Note> {
  const res = await client.post<Note>(`/courses/${courseId}/notes`, data)
  return res.data
}

export async function getNote(id: number): Promise<Note> {
  const res = await client.get<Note>(`/notes/${id}`)
  return res.data
}

export async function updateNote(id: number, data: UpdateNoteRequest): Promise<Note> {
  const res = await client.put<Note>(`/notes/${id}`, data)
  return res.data
}

export async function deleteNote(id: number): Promise<void> {
  await client.delete(`/notes/${id}`)
}

export async function searchNotes(query: string): Promise<Note[]> {
  const res = await client.get<Note[]>('/notes/search', { params: { q: query } })
  return res.data
}
