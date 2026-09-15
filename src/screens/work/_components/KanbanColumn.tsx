import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'
import { WorkCard } from './WorkCard'

type KanbanColumnProps = {
  id: string
  title: string
  items: WorkItem[]
  color: string
  showStatus?: boolean
  onAddTask?: () => void
}

export function KanbanColumn({ id, title, items, color, showStatus, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex min-w-80 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('h-3 w-3 rounded-full', color)} />
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {items.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/30 flex-1 space-y-3 rounded-lg p-3',
          isOver && 'bg-muted/50 ring-primary ring-2'
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <WorkCard key={item.id} item={item} showStatus={showStatus} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
