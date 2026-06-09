import { create } from 'zustand'
import * as qaApi from '../api/qa'
import type { QASession, AskResult, SourceNote, SourceEntity } from '../types/qa'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sourceNotes?: SourceNote[]
  sourceEntities?: SourceEntity[]
  loading?: boolean
}

interface QAState {
  sessions: QASession[]
  currentSessionId: number | null
  messages: ChatMessage[]
  asking: boolean
  loadingSessions: boolean
  loadingMessages: boolean
  error: string | null

  fetchSessions: (courseId?: number) => Promise<void>
  selectSession: (sessionId: number) => Promise<void>
  newSession: () => void
  askQuestion: (question: string, courseId?: number) => Promise<void>
  deleteSession: (sessionId: number) => Promise<void>
  renameSession: (sessionId: number, title: string) => Promise<void>
  clearError: () => void
}

let msgIdCounter = 0
function nextMsgId() {
  return `msg-${++msgIdCounter}`
}

export const useQAStore = create<QAState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  asking: false,
  loadingSessions: false,
  loadingMessages: false,
  error: null,

  fetchSessions: async (courseId?: number) => {
    set({ loadingSessions: true })
    try {
      const res = await qaApi.listSessions(courseId)
      set({ sessions: res.data, loadingSessions: false })
    } catch {
      set({ sessions: [], loadingSessions: false })
    }
  },

  selectSession: async (sessionId: number) => {
    set({ currentSessionId: sessionId, loadingMessages: true, messages: [] })
    try {
      const res = await qaApi.getSessionMessages(sessionId)
      const msgs: ChatMessage[] = []
      for (const conv of res.data) {
        msgs.push({
          id: `conv-${conv.id}-q`,
          role: 'user',
          content: conv.question,
        })
        // Parse source_info for backward compat
        const info = conv.source_info
        msgs.push({
          id: `conv-${conv.id}-a`,
          role: 'assistant',
          content: conv.answer,
          sourceNotes: conv.source_notes || info?.source_notes,
          sourceEntities: conv.source_entities || info?.source_entities,
        })
      }
      set({ messages: msgs, loadingMessages: false })
    } catch {
      set({ messages: [], loadingMessages: false })
    }
  },

  newSession: () => {
    set({ currentSessionId: null, messages: [] })
  },

  askQuestion: async (question: string, courseId?: number) => {
    const { currentSessionId } = get()
    set({ asking: true, error: null })

    // Add user message immediately
    const userMsgId = nextMsgId()
    const loadingMsgId = nextMsgId()
    set((state) => ({
      messages: [
        ...state.messages,
        { id: userMsgId, role: 'user' as const, content: question },
        { id: loadingMsgId, role: 'assistant' as const, content: '', loading: true },
      ],
    }))

    try {
      const res = await qaApi.askQuestion(question, courseId, currentSessionId || undefined)
      const result: AskResult = res.data

      // Replace loading message with actual answer
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === loadingMsgId
            ? {
                ...m,
                loading: false,
                content: result.answer,
                sourceNotes: result.source_notes,
                sourceEntities: result.source_entities,
              }
            : m,
        ),
        currentSessionId: result.session_id,
        asking: false,
      }))

      // Refresh sessions list
      const sessionRes = await qaApi.listSessions(courseId)
      set({ sessions: sessionRes.data })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提问失败'
      // Remove loading message and show error
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== loadingMsgId),
        error: msg,
        asking: false,
      }))
    }
  },

  deleteSession: async (sessionId: number) => {
    try {
      await qaApi.deleteSession(sessionId)
      const { currentSessionId, sessions } = get()
      const newSessions = sessions.filter((s) => s.id !== sessionId)
      set({ sessions: newSessions })
      if (currentSessionId === sessionId) {
        set({ currentSessionId: null, messages: [] })
      }
    } catch {
      set({ error: '删除会话失败' })
    }
  },

  renameSession: async (sessionId: number, title: string) => {
    try {
      await qaApi.renameSession(sessionId, title)
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title } : s,
        ),
      }))
    } catch {
      set({ error: '重命名失败' })
    }
  },

  clearError: () => set({ error: null }),
}))
