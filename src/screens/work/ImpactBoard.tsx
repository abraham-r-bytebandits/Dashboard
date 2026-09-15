import { useEffect } from 'react'
import { Plus, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  setWorkItems,
  setTeamDirectory,
  moveWorkItem,
  setSearchQuery,
  setStatusFilter,
  setRoleFilter,
  setAffiliationFilter,
  persistWorkState,
} from '@/store/workSlice'
import type { WorkStatus, Priority, WorkItem, Assignee } from '@/types/work'
import { useJsLoaded } from '@/hooks/use-js-loaded'
import { KanbanBoard } from './_components/KanbanBoard'
import { WorkToolbar } from './_components/WorkToolbar'
import { workService } from '@/services/workService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'

export default function ImpactBoard() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const jsLoaded = useJsLoaded()

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
        return (Array.isArray(users) ? users : []).map((u: any): Assignee => ({
          id: u.publicId || u.id,
          name: u.username || u.email,
          avatar: u.profile?.profileImage || '',
          role: u.functionalRole || 'Member',
          affiliation: (String(u.affiliation).toLowerCase() === 'external' ? 'external' : 'internal'),
          email: u.email,
        }))
      } catch {
        return []
      }
    },
  })

  // Synchronize API data to Redux for optimistic updates
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
    statusFilter,
    roleFilter,
    affiliationFilter,
  } = workState

  const activeItems = workItems.length > 0 ? workItems : apiWorkItems
  const activeDirectory = teamDirectory.length > 0 ? teamDirectory : apiUsers

  // Persist state to localStorage on updates
  useEffect(() => {
    persistWorkState(workState)
  }, [workState])

  // Filter items for the Impact / Priority Board
  const filteredItems = activeItems.filter((item: WorkItem) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter

    const matchesRole =
      roleFilter === 'all' ||
      item.assignees.some((assignee) => assignee.role === roleFilter)

    const matchesAffiliation =
      affiliationFilter === 'all' ||
      item.assignees.some((assignee) => assignee.affiliation === affiliationFilter)

    return matchesSearch && matchesStatus && matchesRole && matchesAffiliation
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

  if (!jsLoaded || isWorksLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span>Loading Impact Board...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Top Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Impact Board: Priority Check
              </h1>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Calibrate and re-prioritize work impact across High, Medium, and Low priorities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatars Stack */}
            {activeDirectory.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-1">
                {activeDirectory.slice(0, 6).map((member: Assignee) => (
                  <div
                    key={member.id}
                    className="bg-slate-700 text-white flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold shadow-sm"
                    title={`${member.name} (${member.role} · ${member.affiliation === 'internal' ? 'Internal' : 'External'})`}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/work/create')}
              className="border-border hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Invite
            </button>
          </div>
        </div>

        {/* Unified Work Toolbar */}
        <WorkToolbar
          currentBoard="priority"
          searchQuery={searchQuery}
          onSearchChange={(q) => dispatch(setSearchQuery(q))}
          statusFilter={statusFilter}
          onStatusChange={(s) => dispatch(setStatusFilter(s))}
          roleFilter={roleFilter}
          onRoleChange={(r) => dispatch(setRoleFilter(r))}
          affiliationFilter={affiliationFilter}
          onAffiliationChange={(a) => dispatch(setAffiliationFilter(a))}
        />

        {/* 3-Column Impact / Priority Kanban Board */}
        <KanbanBoard
          mode="priority"
          items={filteredItems}
          onMoveItem={handleMoveItem}
        />
      </div>
    </div>
  )
}
