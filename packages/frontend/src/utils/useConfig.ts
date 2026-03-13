import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'

export interface ConfigFile {
  name: string
  path: string
  description: string
  exists: boolean
  version?: string
  last_modified?: string
}

export interface ConfigVersion {
  id: string
  version: string
  hash: string
  file_path: string
  content: string | null
  created_at: string
  created_by: string | null
  is_valid: number
}

export function useConfigFiles() {
  return useQuery({
    queryKey: ['config', 'files'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ConfigFile[] }>('/config/list')
      return response.data
    },
  })
}

export function useConfigFile(path: string) {
  return useQuery({
    queryKey: ['config', 'file', path],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { content: string; version: string | null; hash: string; exists: boolean } }>(`/config/file/${encodeURIComponent(path)}`)
      return response.data
    },
    enabled: !!path,
  })
}

export function useConfigVersions(path: string) {
  return useQuery({
    queryKey: ['config', 'versions', path],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ConfigVersion[] }>(`/config/versions/${encodeURIComponent(path)}`)
      return response.data
    },
    enabled: !!path,
  })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ path, content, reason }: { path: string; content: string; reason: string }) => {
      const response = await api.post('/config/save', { path, content, reason })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['config', 'file', variables.path] })
      queryClient.invalidateQueries({ queryKey: ['config', 'versions', variables.path] })
      queryClient.invalidateQueries({ queryKey: ['config', 'files'] })
    },
  })
}

export function useBackupConfig() {
  return useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      const response = await api.post('/config/backup', { path })
      return response.data
    },
  })
}

export function useRollbackConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ path, versionId, reason }: { path: string; versionId: string; reason: string }) => {
      const response = await api.post('/config/rollback', { path, version_id: versionId, reason })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['config', 'file', variables.path] })
      queryClient.invalidateQueries({ queryKey: ['config', 'versions', variables.path] })
    },
  })
}

export function useValidateConfig() {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/config/validate', { content })
      return response.data
    },
  })
}
