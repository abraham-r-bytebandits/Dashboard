import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkItem, WorkStatus, Priority } from '@/types/work'
import { KanbanColumn } from './KanbanColumn'
import { WorkCard } from './WorkCard'

type KanbanBoardProps = {
  mode: 'status' | 'priority'
  items: WorkItem[]
  onMoveItem: (itemId: string, newStatus?: WorkStatus, newPriority?: Priority) => void
}

type StatusColumn = {
  id: WorkStatus
  title: string
  color: string
}

type PriorityColumn = {
  id: Priority
  title: string
  color: string
}

const STATUS_COLUMNS: StatusColumn[] = [
  { id: 'new', title: 'New', color: 'bg-kanban-board-circle-cyan' },
  { id: 'todo', title: 'To do', color: 'bg-kanban-board-circle-blue' },
  { id: 'clarifications', title: 'Clarifications / Doubts', color: 'bg-kanban-board-circle-yellow' },
  { id: 'under_analysis', title: 'Under analysis', color: 'bg-kanban-board-circle-purple' },
  { id: 'approval', title: 'Approval', color: 'bg-kanban-board-circle-green' },
]

const PRIORITY_COLUMNS: PriorityColumn[] = [
  { id: 'high', title: 'High Priority', color: 'bg-kanban-board-circle-red' },
  { id: 'medium', title: 'Medium Priority', color: 'bg-kanban-board-circle-yellow' },
  { id: 'low', title: 'Low Priority', color: 'bg-kanban-board-circle-blue' },
]

export function KanbanBoard({ mode, items, onMoveItem }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const itemId = active.id as string
    const targetColumnId = over.id as string

    if (mode === 'status') {
      const newStatus = targetColumnId as WorkStatus
      onMoveItem(itemId, newStatus, undefined)
    } else {
      const newPriority = targetColumnId as Priority
      onMoveItem(itemId, undefined, newPriority)
    }

    setActiveId(null)
  }

  const activeItem = activeId ? items.find(item => item.id === activeId) : null

  const columns = mode === 'status' ? STATUS_COLUMNS : PRIORITY_COLUMNS

  const getColumnItems = (columnId: string) => {
    if (mode === 'status') {
      return items.filter(item => item.status === columnId)
    } else {
      return items.filter(item => item.priority === columnId)
    }
  }

  const handleAddTaskForColumn = (columnId: string) => {
    if (mode === 'status') {
      navigate(`/work/create?status=${columnId}`)
    } else {
      navigate(`/work/create?priority=${columnId}`)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            items={getColumnItems(column.id)}
            color={column.color}
            showStatus={mode === 'priority'}
            onAddTask={() => handleAddTaskForColumn(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <WorkCard item={activeItem} showStatus={mode === 'priority'} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
