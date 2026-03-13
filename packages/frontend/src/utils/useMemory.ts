import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../utils/api'

export interface Memory {
  id: string
  title: string
  content: string | null
  source: 'conversation' | 'task' | 'web' | 'file'
  pinned: number
  retention_days: number
  created_at: string
  updated_at: string
}

export function useMemories(params?: { source?: string; pinned?: boolean }) {
  return useQuery({
    queryKey: ['memories', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.source) queryParams.append('source', params.source)
      if (params?.pinned !== undefined) queryParams.append('pinned', String(params.pinned))
      
      const response = await api.get<{ success: boolean; data: Memory[] }>(`/memory?${queryParams}`)
      return response.data
    },
  })
}

export function useMemory(id: string) {
  return useQuery({
    queryKey: ['memory', id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Memory }>(`/memory/${id}`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useSearchMemories(query: string) {
  return useQuery({
    queryKey: ['memories', 'search', query],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Memory[] }>(`/memory/search?q=${encodeURIComponent(query)}`)
      return response.data
    },
    enabled: query.length > 0,
  })
}

export function useCreateMemory() {
  return useMutation({
    mutationFn: async (data: { title: string; content: string; source?: string }) => {
      const response = await api.post('/memory', data)
      return response.data
    },
  })
}

export function useUpdateMemory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Memory> }) => {
      const response = await api.patch(`/memory/${id}`, data)
      return response.data
    },
  })
}

export function useDeleteMemory() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/memory/${id}`)
      return response.data
    },
  })
}

export function useTogglePin() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/memory/${id}/pin`)
      return response.data
    },
  })
}

export function useMemoryStats() {
  return useQuery({
    queryKey: ['memories', 'stats'],
    queryFn: async () => {
      const response = await api.get('/memory/stats/overview')
      return response.data
    },
  })
}
