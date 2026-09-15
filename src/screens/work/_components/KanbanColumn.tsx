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

export function KanbanColumn({
  id,
  title,
  items,
  color,
  showStatus,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex min-w-[320px] max-w-[340px] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background ring-border', color)} />
          <h3 className="text-foreground text-sm font-bold tracking-tight">{title}</h3>
          <span className="bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
            {items.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            title={`Add new assessment to ${title}`}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md p-1 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/20 flex-1 space-y-3 rounded-xl p-3 border border-border/40 min-h-[500px] transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-primary/40 border-primary/40'
        )}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <WorkCard key={item.id} item={item} showStatus={showStatus} />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 p-4 text-center">
            <span className="text-muted-foreground text-xs font-medium">
              No tasks in this column
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
