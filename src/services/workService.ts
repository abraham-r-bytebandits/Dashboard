import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import type { WorkItem, WorkStatus, Priority } from '@/types/work'

const WORK_STORAGE_KEY = 'work-assignment-state'

const getStoredWorkItems = (): WorkItem[] => {
  try {
    const raw = localStorage.getItem(WORK_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.workItems)) {
        return parsed.workItems
      }
    }
  } catch {
    // fallback
  }
  return []
}

const saveStoredWorkItems = (items: WorkItem[]) => {
  try {
    const raw = localStorage.getItem(WORK_STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : {}
    localStorage.setItem(
      WORK_STORAGE_KEY,
      JSON.stringify({ ...current, workItems: items })
    )
  } catch {
    // fallback
  }
}

export const workService = {
  getWorkItems: async (params?: {
    status?: string
    priority?: string
    search?: string
  }): Promise<WorkItem[]> => {
    try {
      const res = await apiClient.get('/work-items', { params })
      const items = res.data?.data || res.data
      if (Array.isArray(items)) {
        saveStoredWorkItems(items)
        return items
      }
    } catch {
      // Backend fallback to local store
    }
    return getStoredWorkItems()
  },

  createWorkItem: async (data: Partial<WorkItem>): Promise<WorkItem> => {
    const newItem: WorkItem = {
      id: `work-${Date.now()}`,
      title: data.title || 'Untitled Assessment',
      description: data.description || '',
      priority: data.priority || 'medium',
      status: data.status || 'new',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      assignees: data.assignees || [],
      milestone: data.milestone || { completed: 0, total: 1 },
      attachmentsCount: data.attachmentsCount || 0,
      attachments: data.attachments || [],
      commentsCount: data.commentsCount || 0,
      createdAt: new Date().toISOString(),
    }

    try {
      const res = await apiClient.post('/work-items', data)
      if (res.data?.data) {
        const stored = getStoredWorkItems()
        saveStoredWorkItems([...stored, res.data.data])
        return res.data.data
      }
    } catch {
      // Backend fallback
    }

    const current = getStoredWorkItems()
    saveStoredWorkItems([...current, newItem])
    return newItem
  },

  updateWorkItemStatus: async (
    id: string,
    status: WorkStatus
  ): Promise<void> => {
    try {
      await apiClient.patch(`/work-items/${id}/status`, { status })
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    const updated = items.map((item) =>
      item.id === id || (item as any).publicId === id || (item as any).customId === id ? { ...item, status } : item
    )
    saveStoredWorkItems(updated)
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
  },

  updateWorkItemPriority: async (
    id: string,
    priority: Priority
  ): Promise<void> => {
    try {
      await apiClient.patch(`/work-items/${id}/priority`, { priority })
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    const updated = items.map((item) =>
      item.id === id || (item as any).publicId === id || (item as any).customId === id ? { ...item, priority } : item
    )
    saveStoredWorkItems(updated)
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
  },

  updateWorkItemMilestone: async (
    id: string,
    completed: number,
    total?: number
  ): Promise<WorkItem | null> => {
    try {
      const res = await apiClient.patch(`/work-items/${id}/milestone`, {
        completed,
        total,
      })
      const updatedItem = res.data?.data || res.data
      if (updatedItem) {
        const items = getStoredWorkItems()
        saveStoredWorkItems(
          items.map((item) => (item.id === id || (item as any).publicId === id || (item as any).customId === id ? { ...item, ...updatedItem } : item))
        )
        queryClient.invalidateQueries({ queryKey: ['work-items'] })
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
        return updatedItem
      }
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    let updatedItem: WorkItem | null = null
    const updated = items.map((item) => {
      if (item.id === id || (item as any).publicId === id || (item as any).customId === id) {
        updatedItem = {
          ...item,
          milestone: {
            completed,
            total: total !== undefined ? total : item.milestone.total,
          },
        }
        return updatedItem
      }
      return item
    })
    saveStoredWorkItems(updated)
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
    return updatedItem
  },

  deleteWorkItem: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/work-items/${id}`)
    } catch {
      // Backend fallback
    }

    const items = getStoredWorkItems()
    saveStoredWorkItems(items.filter((item) => item.id !== id && (item as any).publicId !== id && (item as any).customId !== id))
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
  },
}

