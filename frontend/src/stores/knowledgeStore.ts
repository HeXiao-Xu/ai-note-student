import { create } from 'zustand'
import * as knowledgeApi from '../api/knowledge'
import type { KnowledgeEntity, GraphData, RelatedEntity } from '../types/knowledge'

interface KnowledgeState {
  entities: KnowledgeEntity[]
  graphData: GraphData | null
  relatedEntities: RelatedEntity[]
  selectedEntity: KnowledgeEntity | null
  loading: boolean
  extracting: boolean
  error: string | null

  fetchEntities: (courseId?: number) => Promise<void>
  extractEntities: (noteId: number) => Promise<void>
  fetchGraphData: (courseId?: number) => Promise<void>
  addRelation: (sourceId: number, targetId: number, type: string) => Promise<void>
  fetchRelatedEntities: (entityId: number) => Promise<void>
  setSelectedEntity: (entity: KnowledgeEntity | null) => void
  clearError: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  entities: [],
  graphData: null,
  relatedEntities: [],
  selectedEntity: null,
  loading: false,
  extracting: false,
  error: null,

  fetchEntities: async (courseId?: number) => {
    set({ loading: true, error: null })
    try {
      const res = await knowledgeApi.listEntities(courseId)
      set({ entities: res.data, loading: false })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取实体失败'
      set({ error: msg, loading: false })
    }
  },

  extractEntities: async (noteId: number) => {
    set({ extracting: true, error: null })
    try {
      await knowledgeApi.extractEntities(noteId)
      set({ extracting: false })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提取实体失败'
      set({ error: msg, extracting: false })
    }
  },

  fetchGraphData: async (courseId?: number) => {
    set({ loading: true, error: null })
    try {
      const res = await knowledgeApi.getGraphData(courseId)
      set({ graphData: res.data, loading: false })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取图谱数据失败'
      set({ error: msg, loading: false })
    }
  },

  addRelation: async (sourceId: number, targetId: number, type: string) => {
    try {
      await knowledgeApi.addRelation(sourceId, targetId, type)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '添加关系失败'
      set({ error: msg })
    }
  },

  fetchRelatedEntities: async (entityId: number) => {
    try {
      const res = await knowledgeApi.getRelatedEntities(entityId)
      set({ relatedEntities: res.data })
    } catch {
      set({ relatedEntities: [] })
    }
  },

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  clearError: () => set({ error: null }),
}))
