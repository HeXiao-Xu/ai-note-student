import { useEffect, useState, useRef, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import type { KnowledgeEntity } from '../types/knowledge'
import { useCourseStore } from '../stores/courseStore'
import { useNoteStore } from '../stores/noteStore'

const typeColors: Record<string, string> = {
  concept: '#6366f1',
  definition: '#10b981',
  formula: '#f59e0b',
  theorem: '#8b5cf6',
}

const typeLabels: Record<string, string> = {
  concept: '概念',
  definition: '定义',
  formula: '公式',
  theorem: '定理',
}

const relationTypeLabels: Record<string, string> = {
  contains: '包含',
  prerequisite: '前置依赖',
  application: '应用',
}

export default function KnowledgeGraphPage() {
  const {
    graphData, selectedEntity, relatedEntities, loading, extracting, error,
    fetchGraphData, extractEntities, addRelation, fetchRelatedEntities, setSelectedEntity,
  } = useKnowledgeStore()
  const { courses } = useCourseStore()
  const { notes, fetchAllNotes } = useNoteStore()

  const [courseId, setCourseId] = useState<number>(0)
  const [showNoteSelector, setShowNoteSelector] = useState(false)
  const [relationForm, setRelationForm] = useState({ sourceId: 0, targetId: 0, type: 'contains' })

  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    fetchGraphData(courseId || undefined)
  }, [courseId, fetchGraphData])

  useEffect(() => {
    fetchAllNotes()
  }, [fetchAllNotes])

  const handleNodeClick = useCallback((params: { data?: { id: number; name: string; type: string } }) => {
    if (params.data && 'id' in params.data) {
      setSelectedEntity({
        id: params.data.id,
        name: params.data.name,
        type: params.data.type as KnowledgeEntity['type'],
      } as KnowledgeEntity)
      fetchRelatedEntities(params.data.id)
    }
  }, [setSelectedEntity, fetchRelatedEntities])

  const getChartOption = () => {
    if (!graphData || graphData.nodes.length === 0) return {}

    const categoryColors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6']

    const nodes = graphData.nodes.map((n) => ({
      id: String(n.id),
      name: n.name,
      symbolSize: n.symbolSize,
      category: n.category,
      itemStyle: { color: categoryColors[n.category] || '#6366f1' },
      label: { show: true, fontSize: 11 },
    }))

    const edges = graphData.edges.map((e) => ({
      source: e.source,
      target: e.target,
      lineStyle: {
        type: e.type === 'prerequisite' ? 'dashed' : e.type === 'application' ? 'dotted' : 'solid',
        width: 1.5,
        color: '#94a3b8',
        curveness: 0.2,
      },
    }))

    return {
      tooltip: {
        formatter: (params: { data?: { name?: string; type?: string }; dataType?: string }) => {
          if (params.dataType === 'node') {
            const d = params.data as { name?: string; type?: string }
            return `<b>${d?.name || ''}</b><br/>类型: ${typeLabels[d?.type || ''] || d?.type}`
          }
          return ''
        },
      },
      legend: {
        data: graphData.categories.map((c) => c.name),
        bottom: 10,
        textStyle: { fontSize: 11, color: '#64748b' },
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: edges,
        categories: graphData.categories.map((c, i) => ({
          name: c.name,
          itemStyle: { color: categoryColors[i] },
        })),
        roam: true,
        draggable: true,
        force: {
          repulsion: 300,
          edgeLength: [80, 200],
          gravity: 0.1,
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: 11,
          color: '#334155',
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 },
        },
      }],
    }
  }

  const handleExtract = async (noteId: number) => {
    await extractEntities(noteId)
    setShowNoteSelector(false)
    fetchGraphData(courseId || undefined)
  }

  const handleAddRelation = async () => {
    if (!relationForm.sourceId || !relationForm.targetId) return
    await addRelation(relationForm.sourceId, relationForm.targetId, relationForm.type)
    fetchGraphData(courseId || undefined)
    setRelationForm({ sourceId: 0, targetId: 0, type: 'contains' })
  }

  const filteredNotes = courseId ? notes.filter((n) => n.course_id === courseId) : notes

  return (
    <div className="flex h-full">
      {/* Left: Graph visualization */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-900">知识图谱</h1>
            <select
              value={courseId}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>全部课程</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNoteSelector(!showNoteSelector)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {extracting ? '提取中...' : 'AI提取实体'}
          </button>
        </div>

        {/* Note selector dropdown */}
        {showNoteSelector && (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 mb-2">选择笔记提取知识实体：</p>
            <div className="flex flex-wrap gap-2">
              {filteredNotes.length === 0 ? (
                <p className="text-xs text-slate-400">暂无笔记</p>
              ) : (
                filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleExtract(note.id)}
                    disabled={extracting}
                    className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {note.title}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-2 bg-rose-50 text-rose-600 text-xs">{error}</div>
        )}

        <div className="flex-1 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : graphData && graphData.nodes.length > 0 ? (
            <ReactECharts
              ref={chartRef}
              option={getChartOption()}
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: handleNodeClick }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <p className="text-sm text-slate-400">暂无知识图谱数据</p>
              <p className="text-xs text-slate-400 mt-1">点击"AI提取实体"从笔记中提取</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Control panel */}
      <div className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-y-auto">
        {/* Selected entity details */}
        {selectedEntity && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800">{selectedEntity.name}</h3>
              <button onClick={() => setSelectedEntity(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${typeColors[selectedEntity.type] ? `bg-opacity-10 text-opacity-90` : 'bg-slate-100 text-slate-500'}`}
              style={{ backgroundColor: typeColors[selectedEntity.type] + '18', color: typeColors[selectedEntity.type] }}
            >
              {typeLabels[selectedEntity.type] || selectedEntity.type}
            </span>
            {'description' in selectedEntity && selectedEntity.description && (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{(selectedEntity as { description?: string }).description}</p>
            )}

            {/* Related entities */}
            {relatedEntities.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium text-slate-500 mb-1.5">关联实体</h4>
                <div className="space-y-1.5">
                  {relatedEntities.map((re) => (
                    <div key={re.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: typeColors[re.type] || '#94a3b8' }}
                      />
                      <span className="text-slate-700">{re.name}</span>
                      {re.score !== undefined && re.score > 0 && (
                        <span className="text-slate-400 ml-auto">{(re.score * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add relation form */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">添加关系</h3>
          <div className="space-y-2">
            <select
              value={relationForm.sourceId}
              onChange={(e) => setRelationForm({ ...relationForm, sourceId: Number(e.target.value) })}
              className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>选择源实体</option>
              {graphData?.nodes.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <select
              value={relationForm.type}
              onChange={(e) => setRelationForm({ ...relationForm, type: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="contains">包含</option>
              <option value="prerequisite">前置依赖</option>
              <option value="application">应用</option>
            </select>
            <select
              value={relationForm.targetId}
              onChange={(e) => setRelationForm({ ...relationForm, targetId: Number(e.target.value) })}
              className="w-full text-sm border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>选择目标实体</option>
              {graphData?.nodes.filter((n) => n.id !== relationForm.sourceId).map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddRelation}
              disabled={!relationForm.sourceId || !relationForm.targetId}
              className="w-full text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              添加关系
            </button>
          </div>
        </div>

        {/* Entity list */}
        <div className="p-4 flex-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">实体列表</h3>
          {graphData && graphData.nodes.length > 0 ? (
            <div className="space-y-1.5">
              {graphData.nodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedEntity({
                      id: n.id, name: n.name, type: n.type as KnowledgeEntity["type"],
                    } as KnowledgeEntity)
                    fetchRelatedEntities(n.id)
                  }}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    selectedEntity?.id === n.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-white text-slate-600'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: typeColors[n.type] || '#94a3b8' }}
                  />
                  <span className="truncate">{n.name}</span>
                  <span className="text-slate-400 ml-auto">{typeLabels[n.type]}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">暂无实体</p>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-slate-200">
          <h4 className="text-xs font-medium text-slate-500 mb-2">图例</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(typeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[key] }} />
                {label}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(relationTypeLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span
                  className="w-4 h-0 border-t"
                  style={{
                    borderStyle: key === 'prerequisite' ? 'dashed' : key === 'application' ? 'dotted' : 'solid',
                    borderColor: '#94a3b8',
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
