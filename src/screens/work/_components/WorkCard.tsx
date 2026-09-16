import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Paperclip,
  MessageSquare,
  Flag,
  Calendar,
  Trash2,
  Eye,
  Star,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { Dropdown, type MenuProps } from 'antd'
import type { WorkItem } from '@/types/work'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/redux'
import { deleteWorkItem, moveWorkItem } from '@/store/workSlice'
import { workService } from '@/services/workService'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

const DEFAULT_BADGE_CLASSNAME = 'bg-muted text-muted-foreground border-border'

function stripHtml(html?: string) {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '').trim()
}

type WorkCardProps = {
  item: WorkItem
  showStatus?: boolean
}

export function WorkCard({ item, showStatus }: WorkCardProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const pointerStartPos = useRef<{ x: number; y: number } | null>(null)

  const isAssignee = !!(
    user &&
    item.assignees?.some(
      (a) =>
        (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
        a.id === user.id ||
        a.id === user.publicId
    )
  )
  const canSetPriority = isAdmin || isSuperAdmin
  const canDelete = isAdmin || isSuperAdmin

  const handleOpenDetails = () => {
    navigate(`/work/details/${item.id}`)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return
    if (pointerStartPos.current) {
      const dx = Math.abs(e.clientX - pointerStartPos.current.x)
      const dy = Math.abs(e.clientY - pointerStartPos.current.y)
      if (dx > 6 || dy > 6) {
        return
      }
    }
    handleOpenDetails()
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = {
    high: {
      label: 'High',
      className:
        'bg-kanban-board-circle-red/10 text-kanban-board-circle-red border-kanban-board-circle-red/30',
    },
    medium: {
      label: 'Medium',
      className:
        'bg-kanban-board-circle-yellow/10 text-kanban-board-circle-yellow border-kanban-board-circle-yellow/30',
    },
    low: {
      label: 'Low',
      className:
        'bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue border-kanban-board-circle-blue/30',
    },
  }

  const statusConfig = {
    new: {
      label: 'New',
      className:
        'bg-kanban-board-circle-cyan/10 text-kanban-board-circle-cyan border-kanban-board-circle-cyan/30',
    },
    todo: {
      label: 'To do',
      className:
        'bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue border-kanban-board-circle-blue/30',
    },
    clarifications: {
      label: 'Clarifications',
      className:
        'bg-kanban-board-circle-yellow/10 text-kanban-board-circle-yellow border-kanban-board-circle-yellow/30',
    },
    under_analysis: {
      label: 'Under analysis',
      className:
        'bg-kanban-board-circle-purple/10 text-kanban-board-circle-purple border-kanban-board-circle-purple/30',
    },
    approval: {
      label: 'Approval',
      className:
        'bg-kanban-board-circle-green/10 text-kanban-board-circle-green border-kanban-board-circle-green/30',
    },
  }

  const roleColors: Record<string, string> = {
    Developer:
      'bg-kanban-board-circle-indigo/10 text-kanban-board-circle-indigo',
    Marketing: 'bg-kanban-board-circle-pink/10 text-kanban-board-circle-pink',
    Design: 'bg-kanban-board-circle-yellow/10 text-kanban-board-circle-yellow',
    Product: 'bg-kanban-board-circle-violet/10 text-kanban-board-circle-violet',
    QA: 'bg-kanban-board-circle-cyan/10 text-kanban-board-circle-cyan',
    Operations: 'bg-kanban-board-circle-gray/10 text-kanban-board-circle-gray',
  }

  const dueDate = item.dueDate ? new Date(item.dueDate) : null
  const dueDateLabel = dueDate && isValid(dueDate)
    ? format(dueDate, 'dd MMM, yyyy')
    : undefined

  const menuItems: MenuProps['items'] = [
    {
      key: 'view-details',
      icon: <Eye className="h-3.5 w-3.5" />,
      label: 'View Full Details',
      onClick: handleOpenDetails,
    },
    ...(canSetPriority
      ? [
          { type: 'divider' as const },
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
        ]
      : []),
    {
      type: 'divider',
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
    ...(canDelete
      ? [
          { type: 'divider' as const },
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
      : []),
  ]

  const totalMilestones = Math.max(1, item.milestone?.total || 1)
  const completedMilestones = item.milestone?.completed || 0
  const milestonePercent = Math.round(
    (completedMilestones / totalMilestones) * 100
  )

  return (
    <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          handlePointerDown(e)
          listeners?.onPointerDown?.(e)
        }}
        onClick={handleCardClick}
        className={cn(
          'group relative bg-card border-border rounded-xl border p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-grab active:cursor-grabbing',
          isDragging && 'opacity-50 ring-2 ring-primary',
        )}
      >
        {/* Due Date & Action Menu */}
        <div className="mb-2.5 flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {dueDateLabel && (
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                <span>Due: {dueDateLabel}</span>
              </div>
            )}
            {isAssignee && (
              <span className="bg-primary/10 text-primary border-primary/25 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
                <Star className="h-2.5 w-2.5 fill-primary" />
                Assigned
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenDetails()
              }}
              title="View Full Details"
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity -mt-1 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Dropdown
                menu={{ items: menuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="-mr-1.5 -mt-1 cursor-pointer"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>

      {/* Title & Description */}
      <h3 className="text-foreground mb-1.5 text-sm font-semibold tracking-tight">
        {item.title}
      </h3>
      <p className="text-muted-foreground mb-3 line-clamp-2 text-xs leading-relaxed">
        {stripHtml(item.description)}
      </p>

      {/* Milestone Progress with Prominent Percentage */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Milestone</span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors',
                milestonePercent === 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : milestonePercent > 0
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {milestonePercent}%
            </span>
            <span className="text-muted-foreground/70 text-[11px]">
              ({completedMilestones}/{totalMilestones})
            </span>
          </div>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-300 rounded-full',
              milestonePercent === 100
                ? 'bg-kanban-board-circle-green'
                : 'bg-blue-600'
            )}
            style={{ width: `${Math.min(100, milestonePercent)}%` }}
          />
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
                  className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full border border-background text-[10px] font-medium shadow-xs"
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
                    roleColors[assignee.role] ?? DEFAULT_BADGE_CLASSNAME,
                  )}
                  title={`${assignee.name} (${assignee.role} · ${assignee.affiliation === 'internal' ? 'Internal' : 'External'})`}
                >
                  {assignee.role} ·{' '}
                  {assignee.affiliation === 'internal' ? 'Int' : 'Ext'}
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
              priorityConfig[item.priority]?.className ??
                DEFAULT_BADGE_CLASSNAME,
            )}
          >
            <Flag className="h-3 w-3" />
            {priorityConfig[item.priority]?.label ?? item.priority}
          </div>

          {showStatus && (
            <div
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                statusConfig[item.status]?.className ?? DEFAULT_BADGE_CLASSNAME,
              )}
            >
              {statusConfig[item.status]?.label ?? item.status}
            </div>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
          {item.attachmentsCount > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${item.attachmentsCount} attachments`}
            >
              <Paperclip className="h-3 w-3" />
              {item.attachmentsCount}
            </span>
          )}
          {item.commentsCount > 0 && (
            <span
              className="flex items-center gap-1"
              title={`${item.commentsCount} comments`}
            >
              <MessageSquare className="h-3 w-3" />
              {item.commentsCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
