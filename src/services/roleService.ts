import { apiClient } from '@/lib/apiClient'
import type { FunctionalRole } from '@/types'

export const roleService = {
  getFunctionalRoles: async (): Promise<FunctionalRole[]> => {
    try {
      const res = await apiClient.get('/admin/functional-roles')
      const roles = res.data?.data || res.data
      return Array.isArray(roles) ? roles : []
    } catch {
      return []
    }
  },

  createFunctionalRole: async (roleData: {
    name: string
    description?: string
    color?: string
  }): Promise<FunctionalRole> => {
    const res = await apiClient.post('/admin/functional-roles', roleData)
    return res.data?.data || res.data
  },

  deleteFunctionalRole: async (publicId: string): Promise<void> => {
    await apiClient.delete(`/admin/functional-roles/${publicId}`)
  },
}
