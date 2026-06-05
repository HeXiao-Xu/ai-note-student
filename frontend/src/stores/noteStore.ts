import { create } from 'zustand'
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types/note'
import * as noteApi from '../api/note'

interface NoteState {
  notes: Note[]
  currentNote: Note | null
  searchResults: Note[]
  loading: boolean
  error: string | null

  fetchNotesByCourse: (courseId: number) => Promise<void>
  fetchAllNotes: () => Promise<void>
  fetchNote: (id: number) => Promise<void>
  createNote: (courseId: number, data: CreateNoteRequest) => Promise<Note>
  importDocument: (courseId: number, file: File) => Promise<Note>
  updateNote: (id: number, data: UpdateNoteRequest) => Promise<Note>
  deleteNote: (id: number) => Promise<void>
  searchNotes: (query: string) => Promise<void>
  clearSearch: () => void
  setCurrentNote: (note: Note | null) => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  currentNote: null,
  searchResults: [],
  loading: false,
  error: null,

  fetchNotesByCourse: async (courseId) => {
    set({ loading: true, error: null })
    try {
      const notes = await noteApi.listNotesByCourse(courseId)
      set({ notes, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取笔记失败'
      set({ error: message, loading: false })
    }
  },

  fetchAllNotes: async () => {
    set({ loading: true, error: null })
    try {
      const notes = await noteApi.listAllNotes()
      set({ notes, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取笔记失败'
      set({ error: message, loading: false })
    }
  },

  fetchNote: async (id) => {
    set({ loading: true, error: null })
    try {
      const note = await noteApi.getNote(id)
      set({ currentNote: note, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取笔记失败'
      set({ error: message, loading: false })
    }
  },

  createNote: async (courseId, data) => {
    const note = await noteApi.createNote(courseId, data)
    set({ notes: [note, ...get().notes] })
    return note
  },

  importDocument: async (courseId, file) => {
    const note = await noteApi.importDocument(courseId, file)
    set({ notes: [note, ...get().notes] })
    return note
  },

  updateNote: async (id, data) => {
    const note = await noteApi.updateNote(id, data)
    set({
      notes: get().notes.map((n) => (n.id === id ? note : n)),
      currentNote: get().currentNote?.id === id ? note : get().currentNote,
    })
    return note
  },

  deleteNote: async (id) => {
    await noteApi.deleteNote(id)
    set({
      notes: get().notes.filter((n) => n.id !== id),
      currentNote: get().currentNote?.id === id ? null : get().currentNote,
    })
  },

  searchNotes: async (query) => {
    set({ loading: true, error: null })
    try {
      const searchResults = await noteApi.searchNotes(query)
      set({ searchResults, loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '搜索失败'
      set({ error: message, loading: false })
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  setCurrentNote: (note) => set({ currentNote: note }),
}))
