import { Search, Plus, Filter, LayoutGrid, Zap } from 'lucide-react'
import { Select } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { roleService } from '@/services/roleService'
import {
  WORK_PRIORITY_FILTER_OPTIONS,
  WORK_STATUS_FILTER_OPTIONS,
  WORK_AFFILIATION_FILTER_OPTIONS,
} from '@/data/options'
import type {
  Priority,
  WorkStatus,
  UserRole,
  UserAffiliation,
} from '@/types/work'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type WorkToolbarProps = {
  currentBoard: 'status' | 'priority'
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter?: Priority | 'all'
  onPriorityChange?: (priority: Priority | 'all') => void
  statusFilter?: WorkStatus | 'all'
  onStatusChange?: (status: WorkStatus | 'all') => void
  roleFilter: UserRole | 'all'
  onRoleChange: (role: UserRole | 'all') => void
  affiliationFilter: UserAffiliation | 'all'
  onAffiliationChange: (affiliation: UserAffiliation | 'all') => void
}

export function WorkToolbar({
  currentBoard,
  searchQuery,
  onSearchChange,
  priorityFilter = 'all',
  onPriorityChange,
  statusFilter = 'all',
  onStatusChange,
  roleFilter,
  onRoleChange,
  affiliationFilter,
  onAffiliationChange,
}: WorkToolbarProps) {
  const navigate = useNavigate()

  const { data: functionalRoles = [] } = useQuery({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  const roleOptions = [
    { label: 'All Roles', value: 'all' },
    ...functionalRoles.map((r) => ({ label: r.name, value: r.name })),
  ]

  return (
    <div className="bg-card border-border mb-6 rounded-xl border p-4 shadow-sm">
      {/* Top row: View Switcher, Search, and Create Assessment button */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Board Switcher Pills */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
          <Button
            onClick={() => navigate('/work/status-board')}
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 text-xs font-semibold',
              currentBoard === 'status'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5 text-kanban-board-circle-blue" />
            Status Board
          </Button>
          <Button
            onClick={() => navigate('/work/impact-board')}
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 text-xs font-semibold',
              currentBoard === 'priority'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Zap className="h-3.5 w-3.5 text-kanban-board-circle-yellow" />
            Impact Board
          </Button>
        </div>

        {/* Search & Create Button */}
        <div className="flex flex-1 min-w-72 items-center gap-3 justify-end">
          <div className="relative max-w-md w-full">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-background pl-9 pr-3 text-xs outline-none transition-colors focus-visible:ring-2"
            />
          </div>

          <Button
            onClick={() => navigate('/work/create')}
            variant="default"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        {currentBoard === 'status' && onPriorityChange && (
          <Select
            value={priorityFilter}
            onChange={onPriorityChange}
            options={WORK_PRIORITY_FILTER_OPTIONS}
            className="min-w-36"
            size="small"
            placeholder="Priority"
          />
        )}

        {currentBoard === 'priority' && onStatusChange && (
          <Select
            value={statusFilter}
            onChange={onStatusChange}
            options={WORK_STATUS_FILTER_OPTIONS}
            className="min-w-44"
            size="small"
            placeholder="Status"
          />
        )}

        <Select
          value={roleFilter}
          onChange={onRoleChange}
          options={roleOptions}
          className="min-w-36"
          size="small"
          placeholder="Role"
        />

        <Select
          value={affiliationFilter}
          onChange={onAffiliationChange}
          options={WORK_AFFILIATION_FILTER_OPTIONS}
          className="min-w-36"
          size="small"
          placeholder="Affiliation"
        />

        {(priorityFilter !== 'all' ||
          statusFilter !== 'all' ||
          roleFilter !== 'all' ||
          affiliationFilter !== 'all' ||
          searchQuery.length > 0) && (
          <Button
            onClick={() => {
              onSearchChange('')
              onRoleChange('all')
              onAffiliationChange('all')
              if (onPriorityChange) onPriorityChange('all')
              if (onStatusChange) onStatusChange('all')
            }}
            variant="ghost"
            size="sm"
            className="text-xs underline ml-auto"
          >
            Reset filters
          </Button>
        )}
      </div>
    </div>
  )
}
