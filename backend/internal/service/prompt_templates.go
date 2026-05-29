package service

import "strings"

const (
	// PromptExamPointAnalysis 考点分析提示词
	PromptExamPointAnalysis = `你是一位教育分析专家。请分析以下课程笔记，提取出所有可能的考试重点/考点。

课程名称：{{.CourseName}}
笔记标题：{{.NoteTitle}}
笔记内容：
{{.NoteContent}}

请按以下JSON格式输出考点列表（不要输出其他内容，不要用markdown代码块包裹）：
[{"content":"考点内容","frequency":"高频","source":"推断依据"}]

frequency 只能是：高频、中频、低频
每个考点一条，尽量完整覆盖笔记中的重要知识点。`

	// PromptQuickNotes 速记版生成提示词
	PromptQuickNotes = `你是一位学习助手。请将以下笔记内容精简为速记版，保留核心知识点，使用简洁的要点格式。

课程名称：{{.CourseName}}
笔记标题：{{.NoteTitle}}
笔记内容：
{{.NoteContent}}

要求：
1. 使用要点/关键词格式
2. 保留所有核心公式/定义/结论
3. 删除冗余解释和示例
4. 适当使用缩写
5. 使用 Markdown 格式输出
6. 直接输出速记内容，不要加标题或多余说明`

	// PromptWrongQuestionAnalysis 错题归因提示词
	PromptWrongQuestionAnalysis = `你是一位教育诊断专家。请分析以下错题，给出错因分析。

题目：{{.Question}}
正确答案：{{.Answer}}
学生的答案：{{.MyAnswer}}
错误类型：{{.ErrorType}}

请按以下JSON格式输出分析结果（不要输出其他内容，不要用markdown代码块包裹）：
{"root_cause":"根本原因分析","knowledge_gaps":["知识盲点1","知识盲点2"],"suggestion":"改进建议"}`
)

// PromptData provides template data for variable substitution
type PromptData map[string]string

// RenderPrompt replaces {{.Key}} placeholders with values
func RenderPrompt(template string, data PromptData) string {
	result := template
	for k, v := range data {
		result = strings.ReplaceAll(result, "{{."+k+"}}", v)
	}
	return result
}
