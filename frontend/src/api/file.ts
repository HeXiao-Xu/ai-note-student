import client from './client'
import type { FileAttachment } from '../types/file'

export async function uploadFile(noteId: number, file: File): Promise<FileAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<FileAttachment>(`/notes/${noteId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  })
  return res.data
}

export async function listFiles(noteId: number): Promise<FileAttachment[]> {
  const res = await client.get<FileAttachment[]>(`/notes/${noteId}/files`)
  return res.data
}

export async function deleteFile(fileId: number): Promise<void> {
  await client.delete(`/files/${fileId}`)
}

export async function downloadFile(fileId: number): Promise<{ blob: Blob; filename: string }> {
  const res = await client.get(`/files/${fileId}/download`, { responseType: 'blob' })
  const disposition = res.headers['content-disposition']
  let filename = 'download'
  if (disposition) {
    const match = disposition.match(/filename="?(.+?)"?$/)
    if (match) filename = match[1]
  }
  return { blob: res.data, filename }
}

export function saveBlobAsFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function triggerOCR(fileId: number): Promise<FileAttachment> {
  const res = await client.post<FileAttachment>(`/files/${fileId}/ocr`, null, { timeout: 30000 })
  return res.data
}

export async function triggerParse(fileId: number): Promise<FileAttachment> {
  const res = await client.post<FileAttachment>(`/files/${fileId}/parse`, null, { timeout: 30000 })
  return res.data
}
