import api from './client'
import type { KnowledgeEntity, GraphData, RelatedEntity } from '../types/knowledge'

export function listEntities(courseId?: number) {
  const params: Record<string, string | number> = {}
  if (courseId) params.course_id = courseId
  return api.get<KnowledgeEntity[]>('/knowledge/entities', { params })
}

export function extractEntities(noteId: number) {
  return api.post<KnowledgeEntity[]>('/knowledge/entities/extract', { note_id: noteId }, { timeout: 120000 })
}

export function getGraphData(courseId?: number) {
  const params: Record<string, string | number> = {}
  if (courseId) params.course_id = courseId
  return api.get<GraphData>('/knowledge/graph', { params })
}

export function addRelation(sourceId: number, targetId: number, type: string) {
  return api.post('/knowledge/relations', { source_id: sourceId, target_id: targetId, type })
}

export function getRelatedEntities(entityId: number) {
  return api.get<RelatedEntity[]>(`/knowledge/related/${entityId}`)
}
