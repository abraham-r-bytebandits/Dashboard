import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  setWorkItems,
  setTeamDirectory,
  moveWorkItem,
} from '@/store/workSlice'
import type { WorkStatus, Priority, WorkItem, Assignee } from '@/types/work'
import { workService } from '@/services/workService'
import { mapApiUserToAssignee } from '@/services/roleService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'

type BoardMode = 'status' | 'priority'

export function useWorkBoardData(mode: BoardMode) {
  const dispatch = useAppDispatch()

  // 1. Fetch work items from API
  const { data: apiWorkItems = [], isLoading: isWorksLoading } = useQuery<WorkItem[]>({
    queryKey: ['work-items'],
    queryFn: () => workService.getWorkItems(),
  })

  // 2. Fetch users/team members from API
  const { data: apiUsers = [] } = useQuery<Assignee[]>({
    queryKey: ['team-directory-users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        const users = res.data?.data || res.data || []
        return (Array.isArray(users) ? users : []).map(mapApiUserToAssignee)
      } catch {
        return []
      }
    },
  })

  // Synchronize API data to Redux for optimistic drag-and-drop
  useEffect(() => {
    if (apiWorkItems.length > 0) {
      dispatch(setWorkItems(apiWorkItems))
    }
  }, [apiWorkItems, dispatch])

  useEffect(() => {
    if (apiUsers.length > 0) {
      dispatch(setTeamDirectory(apiUsers))
    }
  }, [apiUsers, dispatch])

  const workState = useAppSelector((state) => state.work)
  const {
    workItems,
    teamDirectory,
    searchQuery,
    priorityFilter,
    statusFilter,
    roleFilter,
    affiliationFilter,
  } = workState

  const activeItems = workItems.length > 0 ? workItems : apiWorkItems
  const activeDirectory = teamDirectory.length > 0 ? teamDirectory : apiUsers

  // Persistence now handled centrally by store.subscribe() in src/store/index.ts

  // Filter items based on board mode
  const filteredItems = activeItems.filter((item: WorkItem) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDimension =
      mode === 'status'
        ? priorityFilter === 'all' || item.priority === priorityFilter
        : statusFilter === 'all' || item.status === statusFilter

    const matchesRole =
      roleFilter === 'all' ||
      item.assignees.some((assignee) => assignee.role === roleFilter)

    const matchesAffiliation =
      affiliationFilter === 'all' ||
      item.assignees.some((assignee) => assignee.affiliation === affiliationFilter)

    return matchesSearch && matchesDimension && matchesRole && matchesAffiliation
  })

  const handleMoveItem = async (
    itemId: string,
    newStatus?: WorkStatus,
    newPriority?: Priority
  ) => {
    dispatch(
      moveWorkItem({
        id: itemId,
        status: newStatus,
        priority: newPriority,
      })
    )
    if (newStatus) {
      await workService.updateWorkItemStatus(itemId, newStatus)
    }
    if (newPriority) {
      await workService.updateWorkItemPriority(itemId, newPriority)
    }
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
  }

  return {
    filteredItems,
    activeDirectory,
    isLoading: isWorksLoading,
    handleMoveItem,
    filters: {
      searchQuery,
      priorityFilter,
      statusFilter,
      roleFilter,
      affiliationFilter,
    },
  }
}
