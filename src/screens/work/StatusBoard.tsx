import { Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/redux'
import {
  setSearchQuery,
  setPriorityFilter,
  setRoleFilter,
  setAffiliationFilter,
} from '@/store/workSlice'
import type { Assignee } from '@/types/work'
import { useJsLoaded } from '@/hooks/use-js-loaded'
import { KanbanBoard } from './_components/KanbanBoard'
import { WorkToolbar } from './_components/WorkToolbar'
import { useWorkBoardData } from './hooks/useWorkBoardData'

export default function StatusBoard() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const jsLoaded = useJsLoaded()

  const { filteredItems, activeDirectory, isLoading, handleMoveItem, filters } =
    useWorkBoardData('status')

  const { searchQuery, priorityFilter, roleFilter, affiliationFilter } = filters

  if (!jsLoaded || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-muted-foreground flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading Status Board...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-[1800px]">
        {/* Top Header matching reference design */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kanban-board-circle-blue text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Work Assignment: Status Board
              </h1>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Monitor all of your task progress across workflow stages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Avatars Stack */}
            {activeDirectory.length > 0 && (
              <div className="flex -space-x-2 overflow-hidden py-1">
                {activeDirectory.slice(0, 6).map((member: Assignee) => (
                  <div
                    key={member.id}
                    className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-xs font-semibold shadow-sm"
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
          currentBoard="status"
          searchQuery={searchQuery}
          onSearchChange={(q) => dispatch(setSearchQuery(q))}
          priorityFilter={priorityFilter}
          onPriorityChange={(p) => dispatch(setPriorityFilter(p))}
          roleFilter={roleFilter}
          onRoleChange={(r) => dispatch(setRoleFilter(r))}
          affiliationFilter={affiliationFilter}
          onAffiliationChange={(a) => dispatch(setAffiliationFilter(a))}
        />

        {/* 5-Column Status Kanban Board */}
        <KanbanBoard
          mode="status"
          items={filteredItems}
          onMoveItem={handleMoveItem}
        />
      </div>
    </div>
  )
}
