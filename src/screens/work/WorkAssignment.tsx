import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import {
  moveWorkItem,
  addWorkItem,
  setSearchQuery,
  setPriorityFilter,
  setRoleFilter,
  setAffiliationFilter,
  persistWorkState,
} from '@/store/workSlice'
import type { Priority, WorkStatus, WorkItem, Assignee } from '@/types/work'
import { useJsLoaded } from '@/hooks/use-js-loaded'
import { KanbanBoard } from './_components/KanbanBoard'
import { WorkToolbar } from './_components/WorkToolbar'
import { WorkModal } from './_components/WorkModal'

type BoardMode = 'status' | 'priority' | 'dual'

export default function WorkAssignment() {
  const dispatch = useAppDispatch()
  const jsLoaded = useJsLoaded()
  const [boardMode, setBoardMode] = useState<BoardMode>('status')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const workState = useAppSelector((state) => state.work)
  const { workItems, teamDirectory, searchQuery, priorityFilter, roleFilter, affiliationFilter } = workState

  // Persist to localStorage on state changes
  useEffect(() => {
    persistWorkState(workState)
  }, [workState])

  // Filter work items based on search and filters
  const filteredItems = workItems.filter((item: WorkItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter

    const matchesRole = roleFilter === 'all' ||
      item.assignees.some((assignee) => assignee.role === roleFilter)

    const matchesAffiliation = affiliationFilter === 'all' ||
      item.assignees.some((assignee) => assignee.affiliation === affiliationFilter)

    return matchesSearch && matchesPriority && matchesRole && matchesAffiliation
  })

  const handleMoveItem = (itemId: string, newStatus?: WorkStatus, newPriority?: Priority) => {
    dispatch(moveWorkItem({ id: itemId, status: newStatus, priority: newPriority }))
  }

  const handleCreateTask = (values: {
    title: string
    description: string
    priority: Priority
    status: WorkStatus
    dueDate: string
    assignees: string[]
    milestoneCompleted: number
    milestoneTotal: number
  }) => {
    const assigneeObjects = teamDirectory.filter((member) => values.assignees.includes(member.id))

    const newItem: WorkItem = {
      id: `work-${Date.now()}`,
      title: values.title,
      description: values.description,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate,
      assignees: assigneeObjects,
      milestone: {
        completed: values.milestoneCompleted,
        total: values.milestoneTotal,
      },
      attachmentsCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    }

    dispatch(addWorkItem(newItem))
  }

  if (!jsLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-bold">Work Assignment & Priority Check</h1>
              <p className="text-muted-foreground text-sm">Monitor all of your tasks here</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {teamDirectory.slice(0, 5).map((member: Assignee) => (
                  <div
                    key={member.id}
                    className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium"
                    title={member.name}
                  >
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                ))}
              </div>
              <button className="border-border hover:bg-accent inline-flex items-center gap-2 rounded-md border bg-transparent px-4 py-2 text-sm font-medium transition-colors">
                <Plus className="h-4 w-4" />
                Invite
              </button>
            </div>
          </div>
        </div>

        <WorkToolbar
          searchQuery={searchQuery}
          onSearchChange={(query) => dispatch(setSearchQuery(query))}
          priorityFilter={priorityFilter}
          onPriorityChange={(priority) => dispatch(setPriorityFilter(priority))}
          roleFilter={roleFilter}
          onRoleChange={(role) => dispatch(setRoleFilter(role))}
          affiliationFilter={affiliationFilter}
          onAffiliationChange={(affiliation) => dispatch(setAffiliationFilter(affiliation))}
          boardMode={boardMode}
          onBoardModeChange={setBoardMode}
          onCreateTask={() => setIsModalOpen(true)}
        />

        {boardMode === 'dual' ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-foreground mb-4 text-lg font-semibold">Status Board</h2>
              <KanbanBoard mode="status" items={filteredItems} onMoveItem={handleMoveItem} />
            </div>
            <div>
              <h2 className="text-foreground mb-4 text-lg font-semibold">Impact Board (Priority)</h2>
              <KanbanBoard mode="priority" items={filteredItems} onMoveItem={handleMoveItem} />
            </div>
          </div>
        ) : (
          <KanbanBoard mode={boardMode} items={filteredItems} onMoveItem={handleMoveItem} />
        )}

        <WorkModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          teamDirectory={teamDirectory}
        />
      </div>
    </div>
  )
}
