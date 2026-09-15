import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreVertical, Paperclip, MessageSquare, Flag, Calendar, Trash2 } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { Dropdown, type MenuProps } from 'antd'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/redux'
import { deleteWorkItem, moveWorkItem } from '@/store/workSlice'
import { workService } from '@/services/workService'

const DEFAULT_BADGE_CLASSNAME = 'bg-muted text-muted-foreground border-border'

type WorkCardProps = {
  item: WorkItem
  showStatus?: boolean
}

export function WorkCard({ item, showStatus }: WorkCardProps) {
  const dispatch = useAppDispatch()
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

  const roleColors: Record<string, string> = {
    Developer: 'bg-indigo-100 text-indigo-700',
    Marketing: 'bg-pink-100 text-pink-700',
    Design: 'bg-amber-100 text-amber-700',
    Product: 'bg-violet-100 text-violet-700',
    QA: 'bg-teal-100 text-teal-700',
    Operations: 'bg-gray-100 text-gray-700',
  }

  const dueDate = new Date(item.dueDate)
  const dueDateLabel = isValid(dueDate) ? format(dueDate, 'dd MMM, yyyy') : 'No due date'

  const menuItems: MenuProps['items'] = [
    {
      key: 'priority-group',
      label: 'Set Priority',
      children: [
        {
          key: 'p-high',
          label: 'High Priority',
          onClick: () => {
            workService.updateWorkItemPriority(item.id, 'high')
            dispatch(moveWorkItem({ id: item.id, priority: 'high' }))
          },
        },
        {
          key: 'p-medium',
          label: 'Medium Priority',
          onClick: () => {
            workService.updateWorkItemPriority(item.id, 'medium')
            dispatch(moveWorkItem({ id: item.id, priority: 'medium' }))
          },
        },
        {
          key: 'p-low',
          label: 'Low Priority',
          onClick: () => {
            workService.updateWorkItemPriority(item.id, 'low')
            dispatch(moveWorkItem({ id: item.id, priority: 'low' }))
          },
        },
      ],
    },
    {
      key: 'status-group',
      label: 'Move Status',
      children: [
        {
          key: 's-new',
          label: 'New',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'new')
            dispatch(moveWorkItem({ id: item.id, status: 'new' }))
          },
        },
        {
          key: 's-todo',
          label: 'To do',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'todo')
            dispatch(moveWorkItem({ id: item.id, status: 'todo' }))
          },
        },
        {
          key: 's-clarifications',
          label: 'Clarifications / Doubts',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'clarifications')
            dispatch(moveWorkItem({ id: item.id, status: 'clarifications' }))
          },
        },
        {
          key: 's-under_analysis',
          label: 'Under analysis',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'under_analysis')
            dispatch(moveWorkItem({ id: item.id, status: 'under_analysis' }))
          },
        },
        {
          key: 's-approval',
          label: 'Approval',
          onClick: () => {
            workService.updateWorkItemStatus(item.id, 'approval')
            dispatch(moveWorkItem({ id: item.id, status: 'approval' }))
          },
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      danger: true,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      label: 'Delete Work Item',
      onClick: () => {
        workService.deleteWorkItem(item.id)
        dispatch(deleteWorkItem(item.id))
      },
    },
  ]

  const totalMilestones = Math.max(1, Math.min(12, item.milestone.total || 1))

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card border-border rounded-xl border p-4 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 ring-2 ring-primary'
      )}
    >
      {/* Due Date & Action Menu */}
      <div className="mb-2.5 flex items-start justify-between">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span>Due: {dueDateLabel}</span>
        </div>

        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground -mr-1.5 -mt-1 p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </Dropdown>
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-foreground mb-1.5 text-sm font-semibold tracking-tight">
        {item.title}
      </h3>
      <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-relaxed">
        {item.description}
      </p>

      {/* Segmented Milestone Progress Bar matching screenshot */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            Milestone
          </span>
          <span className="text-muted-foreground font-semibold">
            {item.milestone.completed}/{item.milestone.total}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalMilestones }).map((_, idx) => {
            const isCompleted = idx < item.milestone.completed
            return (
              <div
                key={idx}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )
          })}
        </div>
      </div>

      {/* Assigned For Section */}
      {item.assignees.length > 0 && (
        <div className="mb-3">
          <div className="text-muted-foreground mb-1.5 text-[11px] font-medium">
            Assigned for
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Avatar Stack */}
            <div className="flex -space-x-1.5 overflow-hidden py-0.5">
              {item.assignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="bg-slate-800 text-white flex h-6 w-6 items-center justify-center rounded-full border border-background text-[10px] font-medium shadow-xs"
                  title={`${assignee.name} — ${assignee.role} (${assignee.affiliation === 'internal' ? 'Internal' : 'External'})`}
                >
                  {assignee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
              ))}
            </div>

            {/* Role & Affiliation Tags */}
            <div className="flex flex-wrap items-center gap-1 justify-end">
              {item.assignees.slice(0, 2).map((assignee) => (
                <span
                  key={assignee.id}
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                    roleColors[assignee.role] ?? DEFAULT_BADGE_CLASSNAME
                  )}
                  title={`${assignee.name} (${assignee.role} · ${assignee.affiliation === 'internal' ? 'Internal' : 'External'})`}
                >
                  {assignee.role} · {assignee.affiliation === 'internal' ? 'Int' : 'Ext'}
                </span>
              ))}
              {item.assignees.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{item.assignees.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Priority & Status Badges, Attachments & Comments */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold',
              priorityConfig[item.priority]?.className ?? DEFAULT_BADGE_CLASSNAME
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityConfig[item.priority]?.label ?? item.priority}
          </div>

          {showStatus && (
            <div
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                statusConfig[item.status]?.className ?? DEFAULT_BADGE_CLASSNAME
              )}
            >
              {statusConfig[item.status]?.label ?? item.status}
            </div>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
          {item.attachmentsCount > 0 && (
            <span className="flex items-center gap-1" title={`${item.attachmentsCount} attachments`}>
              <Paperclip className="h-3 w-3" />
              {item.attachmentsCount}
            </span>
          )}
          {item.commentsCount > 0 && (
            <span className="flex items-center gap-1" title={`${item.commentsCount} comments`}>
              <MessageSquare className="h-3 w-3" />
              {item.commentsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
