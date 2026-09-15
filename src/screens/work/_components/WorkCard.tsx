import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreVertical, Paperclip, MessageSquare, Flag, Calendar } from 'lucide-react'
import { format, isValid } from 'date-fns'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'

const DEFAULT_BADGE_CLASSNAME = 'bg-muted text-muted-foreground border-border'

type WorkCardProps = {
  item: WorkItem
  showStatus?: boolean
}

export function WorkCard({ item, showStatus }: WorkCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = {
    high: { label: 'High', className: 'bg-red-50 text-red-700 border-red-200' },
    medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { label: 'Low', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  }

  const statusConfig = {
    new: { label: 'New', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    todo: { label: 'To do', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    clarifications: { label: 'Clarifications', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    under_analysis: { label: 'Under analysis', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    approval: { label: 'Approval', className: 'bg-green-50 text-green-700 border-green-200' },
  }

  const roleColors = {
    Developer: 'bg-indigo-100 text-indigo-700',
    Marketing: 'bg-pink-100 text-pink-700',
    Design: 'bg-amber-100 text-amber-700',
    Product: 'bg-violet-100 text-violet-700',
    QA: 'bg-teal-100 text-teal-700',
    Operations: 'bg-gray-100 text-gray-700',
  }

  const milestonePercentage = item.milestone.total > 0
    ? (item.milestone.completed / item.milestone.total) * 100
    : 0

  const dueDate = new Date(item.dueDate)
  const dueDateLabel = isValid(dueDate) ? format(dueDate, 'dd MMM, yyyy') : 'No due date'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border-border rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-50'
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3" />
          <span>Due: {dueDateLabel}</span>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground -mr-2 -mt-2 p-2"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <h3 className="text-foreground mb-2 text-sm font-semibold">{item.title}</h3>
      <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">{item.description}</p>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Milestone {item.milestone.completed}/{item.milestone.total}
          </span>
          <span className="text-muted-foreground">{Math.round(milestonePercentage)}%</span>
        </div>
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${milestonePercentage}%` }} />
        </div>
      </div>

      {item.assignees.length > 0 && (
        <div className="mb-3">
          <div className="text-muted-foreground mb-2 text-xs">Assigned for</div>
          <div className="mb-2 flex -space-x-2">
            {item.assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-medium"
                title={`${assignee.name} - ${assignee.role} (${assignee.affiliation})`}
              >
                {assignee.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {item.assignees.map((assignee) => (
              <span
                key={assignee.id}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  roleColors[assignee.role] ?? DEFAULT_BADGE_CLASSNAME
                )}
              >
                {assignee.role} · {assignee.affiliation === 'internal' ? 'Internal' : 'External'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium',
              priorityConfig[item.priority]?.className ?? DEFAULT_BADGE_CLASSNAME
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityConfig[item.priority]?.label ?? item.priority}
          </div>
          {showStatus && (
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium',
                statusConfig[item.status]?.className ?? DEFAULT_BADGE_CLASSNAME
              )}
            >
              {statusConfig[item.status]?.label ?? item.status}
            </div>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          {item.attachmentsCount > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {item.attachmentsCount}
            </span>
          )}
          {item.commentsCount > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {item.commentsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
