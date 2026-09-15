import { Search, Plus, Filter } from 'lucide-react'
import { Select } from 'antd'
import type { Priority, UserRole, UserAffiliation } from '@/types/work'

type BoardMode = 'status' | 'priority' | 'dual'

type WorkToolbarProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter: Priority | 'all'
  onPriorityChange: (priority: Priority | 'all') => void
  roleFilter: UserRole | 'all'
  onRoleChange: (role: UserRole | 'all') => void
  affiliationFilter: UserAffiliation | 'all'
  onAffiliationChange: (affiliation: UserAffiliation | 'all') => void
  boardMode: BoardMode
  onBoardModeChange: (mode: BoardMode) => void
  onCreateTask: () => void
}

const PRIORITY_OPTIONS = [
  { label: 'All Priorities', value: 'all' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Developer', value: 'Developer' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Design', value: 'Design' },
  { label: 'Product', value: 'Product' },
  { label: 'QA', value: 'QA' },
  { label: 'Operations', value: 'Operations' },
]

const AFFILIATION_OPTIONS = [
  { label: 'All Types', value: 'all' },
  { label: 'Internal', value: 'internal' },
  { label: 'External', value: 'external' },
]

const BOARD_MODE_OPTIONS = [
  { label: 'Status Board', value: 'status' },
  { label: 'Impact Board (Priority)', value: 'priority' },
  { label: 'Dual View', value: 'dual' },
]

export function WorkToolbar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  roleFilter,
  onRoleChange,
  affiliationFilter,
  onAffiliationChange,
  boardMode,
  onBoardModeChange,
  onCreateTask,
}: WorkToolbarProps) {
  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-input focus-visible:ring-ring h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm outline-none transition-colors focus-visible:ring-2"
          />
        </div>

        <Select
          value={boardMode}
          onChange={onBoardModeChange}
          options={BOARD_MODE_OPTIONS}
          className="min-w-48"
        />

        <button
          onClick={onCreateTask}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>

        <Select
          value={priorityFilter}
          onChange={onPriorityChange}
          options={PRIORITY_OPTIONS}
          className="min-w-40"
          placeholder="Priority"
        />

        <Select
          value={roleFilter}
          onChange={onRoleChange}
          options={ROLE_OPTIONS}
          className="min-w-40"
          placeholder="Role"
        />

        <Select
          value={affiliationFilter}
          onChange={onAffiliationChange}
          options={AFFILIATION_OPTIONS}
          className="min-w-40"
          placeholder="Affiliation"
        />
      </div>
    </div>
  )
}
