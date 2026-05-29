import { create } from 'zustand'
import type { FileAttachment } from '../types/file'
import * as fileApi from '../api/file'

interface FileState {
  files: FileAttachment[]
  loading: boolean
  error: string | null
  uploadProgress: number

  fetchFiles: (noteId: number) => Promise<void>
  uploadFile: (noteId: number, file: File) => Promise<FileAttachment | null>
  deleteFile: (fileId: number) => Promise<void>
  clear: () => void
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  loading: false,
  error: null,
  uploadProgress: 0,

  fetchFiles: async (noteId) => {
    set({ loading: true, error: null })
    try {
      const files = await fileApi.listFiles(noteId)
      set({ files, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.error || '获取文件列表失败', loading: false })
    }
  },

  uploadFile: async (noteId, file) => {
    set({ error: null, uploadProgress: 0 })
    try {
      const result = await fileApi.uploadFile(noteId, file)
      set((state) => ({
        files: [result, ...state.files],
        uploadProgress: 100,
      }))
      return result
    } catch (err: any) {
      set({ error: err.response?.data?.error || '上传失败' })
      return null
    }
  },

  deleteFile: async (fileId) => {
    try {
      await fileApi.deleteFile(fileId)
      set((state) => ({
        files: state.files.filter((f) => f.id !== fileId),
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.error || '删除失败' })
    }
  },

  clear: () => set({ files: [], loading: false, error: null, uploadProgress: 0 }),
}))
