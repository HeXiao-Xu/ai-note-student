export interface KnowledgeEntity {
  id: number
  user_id: number
  course_id: number
  name: string
  type: 'concept' | 'definition' | 'formula' | 'theorem'
  description: string
  note_ids: number[]
  created_at: string
  updated_at: string
}

export interface KnowledgeRelation {
  id: number
  source_id: number
  target_id: number
  type: 'contains' | 'prerequisite' | 'application'
  created_at: string
}

export interface GraphNode {
  id: number
  name: string
  type: string
  symbolSize: number
  category: number
}

export interface GraphEdge {
  source: string
  target: string
  type: string
}

export interface GraphCategory {
  name: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  categories: GraphCategory[]
}

export interface RelatedEntity {
  id: number
  user_id: number
  course_id: number
  name: string
  type: string
  description: string
  note_ids: number[]
  relation_type?: string
  score?: number
  created_at: string
  updated_at: string
}
