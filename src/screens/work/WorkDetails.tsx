import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Flag,
  CheckCircle2,
  Paperclip,
  Download,
  Copy,
  Check,
  Trash2,
  Users,
  FileText,
  ExternalLink,
  ChevronDown,
  Building2,
  Globe,
  Clock,
  LayoutGrid,
  Zap,
  Plus,
  Minus,
  X,
  Share2,
  RotateCcw,
  Star,
  Lock,
  Eye,
  Code2,
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { message, Dropdown, type MenuProps, Popconfirm } from 'antd'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { moveWorkItem, deleteWorkItem, updateMilestoneProgress } from '@/store/workSlice'
import { useAuth } from '@/context/AuthContext'
import { workService } from '@/services/workService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import type { WorkItem, WorkStatus, Priority } from '@/types/work'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STATUS_CONFIG: Record<
  WorkStatus,
  { label: string; colorClass: string; bgClass: string; textClass: string }
> = {
  new: {
    label: 'New',
    colorClass: 'bg-kanban-board-circle-cyan',
    bgClass: 'bg-kanban-board-circle-cyan/10 border-kanban-board-circle-cyan/30',
    textClass: 'text-kanban-board-circle-cyan',
  },
  todo: {
    label: 'To do',
    colorClass: 'bg-kanban-board-circle-blue',
    bgClass: 'bg-kanban-board-circle-blue/10 border-kanban-board-circle-blue/30',
    textClass: 'text-kanban-board-circle-blue',
  },
  clarifications: {
    label: 'Clarifications / Doubts',
    colorClass: 'bg-kanban-board-circle-yellow',
    bgClass: 'bg-kanban-board-circle-yellow/10 border-kanban-board-circle-yellow/30',
    textClass: 'text-kanban-board-circle-yellow',
  },
  under_analysis: {
    label: 'Under analysis',
    colorClass: 'bg-kanban-board-circle-purple',
    bgClass: 'bg-kanban-board-circle-purple/10 border-kanban-board-circle-purple/30',
    textClass: 'text-kanban-board-circle-purple',
  },
  approval: {
    label: 'Approval',
    colorClass: 'bg-kanban-board-circle-green',
    bgClass: 'bg-kanban-board-circle-green/10 border-kanban-board-circle-green/30',
    textClass: 'text-kanban-board-circle-green',
  },
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bgClass: string; textClass: string; flagColor: string }
> = {
  high: {
    label: 'High Priority',
    bgClass: 'bg-kanban-board-circle-red/10 border-kanban-board-circle-red/30',
    textClass: 'text-kanban-board-circle-red',
    flagColor: 'text-kanban-board-circle-red',
  },
  medium: {
    label: 'Medium Priority',
    bgClass: 'bg-kanban-board-circle-yellow/10 border-kanban-board-circle-yellow/30',
    textClass: 'text-kanban-board-circle-yellow',
    flagColor: 'text-kanban-board-circle-yellow',
  },
  low: {
    label: 'Low Priority',
    bgClass: 'bg-kanban-board-circle-blue/10 border-kanban-board-circle-blue/30',
    textClass: 'text-kanban-board-circle-blue',
    flagColor: 'text-kanban-board-circle-blue',
  },
}

const ROLE_COLORS: Record<string, string> = {
  Developer: 'bg-kanban-board-circle-indigo/10 text-kanban-board-circle-indigo border-kanban-board-circle-indigo/20',
  Marketing: 'bg-kanban-board-circle-pink/10 text-kanban-board-circle-pink border-kanban-board-circle-pink/20',
  Design: 'bg-kanban-board-circle-yellow/10 text-kanban-board-circle-yellow border-kanban-board-circle-yellow/20',
  Product: 'bg-kanban-board-circle-violet/10 text-kanban-board-circle-violet border-kanban-board-circle-violet/20',
  QA: 'bg-kanban-board-circle-cyan/10 text-kanban-board-circle-cyan border-kanban-board-circle-cyan/20',
  Operations: 'bg-kanban-board-circle-gray/10 text-kanban-board-circle-gray border-kanban-board-circle-gray/20',
}

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function WorkDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [copiedId, setCopiedId] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isUpdatingMilestone, setIsUpdatingMilestone] = useState(false)
  const [descriptionViewMode, setDescriptionViewMode] = useState<'preview' | 'source'>('preview')
  const [copiedHtml, setCopiedHtml] = useState(false)

  // 1. Get from Redux state for fast rendering
  const reduxWorkItem = useAppSelector((state) =>
    state.work.workItems.find((w) => w.id === id || (w as any).publicId === id)
  )

  // 2. Fetch fresh data from API with background polling & window focus sync
  const {
    data: apiWorkItem,
    isLoading,
    refetch,
  } = useQuery<WorkItem>({
    queryKey: ['work-item-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('No id provided')
      try {
        const res = await apiClient.get(`/work-items/${id}`)
        return res.data?.data || res.data
      } catch {
        // Fallback: check stored items list
        const items = await workService.getWorkItems()
        const found = items.find((w) => w.id === id || (w as any).publicId === id)
        if (found) return found
        throw new Error('Work item not found')
      }
    },
    enabled: !!id,
    placeholderData: reduxWorkItem,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // Synchronize across tabs/windows when local storage updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('work_items')) {
        refetch()
        queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [id, refetch])

  const item = apiWorkItem || reduxWorkItem

  // RBAC permissions
  const isAssignee = !!(
    user &&
    item?.assignees?.some(
      (a) =>
        (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
        a.id === user.id ||
        a.id === user.publicId
    )
  )
  const isCreator = !!(user && item && (item as any).createdByPublicId === user.publicId)
  const canEditMilestones = isSuperAdmin || isAdmin || isAssignee || isCreator
  const canChangeStatus = isSuperAdmin || isAdmin || isAssignee || isCreator
  const canChangePriority = isSuperAdmin || isAdmin
  const canDelete = isSuperAdmin || isAdmin

  const totalMilestones = Math.max(1, item?.milestone?.total || 1)
  const completedMilestones = item?.milestone?.completed || 0
  const milestonePercent = Math.round(
    (completedMilestones / totalMilestones) * 100
  )

  const handleUpdateMilestones = async (newCompleted: number) => {
    if (!item || !canEditMilestones) return
    const clamped = Math.max(0, Math.min(totalMilestones, newCompleted))
    dispatch(updateMilestoneProgress({ id: item.id, completed: clamped }))

    // Optimistically update TanStack Query cache for immediate UI feedback
    const updatedItem: WorkItem = {
      ...item,
      milestone: {
        ...item.milestone,
        total: totalMilestones,
        completed: clamped,
      },
    }
    queryClient.setQueryData(['work-item-detail', id], updatedItem)
    queryClient.setQueryData<WorkItem[]>(['work-items'], (old) =>
      old ? old.map((w) => (w.id === item.id || (w as any).publicId === item.id ? updatedItem : w)) : old
    )

    setIsUpdatingMilestone(true)
    try {
      await workService.updateWorkItemMilestone(item.id, clamped)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-item-detail', id] })
      const pct = Math.round((clamped / totalMilestones) * 100)
      if (clamped === totalMilestones) {
        message.success(`🎉 All milestones completed (100%)!`)
      } else {
        message.success(`Milestone progress updated: ${pct}% (${clamped}/${totalMilestones} completed)`)
      }
    } catch {
      message.error('Failed to update milestone progress')
    } finally {
      setIsUpdatingMilestone(false)
    }
  }

  const handleSetPercent = (pct: number) => {
    const target = Math.round((pct / 100) * totalMilestones)
    handleUpdateMilestones(target)
  }

  const handleStepNext = () => {
    if (completedMilestones < totalMilestones) {
      handleUpdateMilestones(completedMilestones + 1)
    }
  }

  const handleStepPrev = () => {
    if (completedMilestones > 0) {
      handleUpdateMilestones(completedMilestones - 1)
    }
  }

  const handleCompleteAll = () => {
    handleUpdateMilestones(totalMilestones)
  }

  const handleResetMilestones = () => {
    handleUpdateMilestones(0)
  }

  const handleCopyId = () => {
    if (!item) return
    navigator.clipboard.writeText(item.id)
    setCopiedId(true)
    message.success('Assessment ID copied to clipboard!')
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    message.success('Link copied to clipboard!')
  }

  const handleStatusChange = async (newStatus: WorkStatus) => {
    if (!item) return
    dispatch(moveWorkItem({ id: item.id, status: newStatus }))
    try {
      await workService.updateWorkItemStatus(item.id, newStatus)
    } catch {}
    refetch()
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    message.success(`Status moved to ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
  }

  const handlePriorityChange = async (newPriority: Priority) => {
    if (!item) return
    dispatch(moveWorkItem({ id: item.id, priority: newPriority }))
    try {
      await workService.updateWorkItemPriority(item.id, newPriority)
    } catch {}
    refetch()
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    message.success(`Priority updated to ${PRIORITY_CONFIG[newPriority]?.label || newPriority}`)
  }

  const handleDelete = async () => {
    if (!item) return
    dispatch(deleteWorkItem(item.id))
    try {
      await workService.deleteWorkItem(item.id)
    } catch {}
    queryClient.invalidateQueries({ queryKey: ['work-items'] })
    message.success('Assessment deleted successfully')
    navigate('/work/status-board')
  }

  if (isLoading && !item) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading Assessment Details...</span>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-foreground text-xl font-bold">Assessment Not Found</h2>
        <p className="text-muted-foreground max-w-md text-xs">
          The requested work assessment with ID <code className="text-primary">{id}</code> could not be found or may have been deleted.
        </p>
        <Button
          onClick={() => navigate('/work/status-board')}
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Status Board
        </Button>
      </div>
    )
  }

  const statusMenu: MenuProps = {
    items: [
      { key: 'new', label: 'New', onClick: () => handleStatusChange('new') },
      { key: 'todo', label: 'To do', onClick: () => handleStatusChange('todo') },
      { key: 'clarifications', label: 'Clarifications / Doubts', onClick: () => handleStatusChange('clarifications') },
      { key: 'under_analysis', label: 'Under analysis', onClick: () => handleStatusChange('under_analysis') },
      { key: 'approval', label: 'Approval', onClick: () => handleStatusChange('approval') },
    ],
  }

  const priorityMenu: MenuProps = {
    items: [
      { key: 'high', label: 'High Priority', onClick: () => handlePriorityChange('high') },
      { key: 'medium', label: 'Medium Priority', onClick: () => handlePriorityChange('medium') },
      { key: 'low', label: 'Low Priority', onClick: () => handlePriorityChange('low') },
    ],
  }

  const dueDate = item.dueDate ? new Date(item.dueDate) : null
  const formattedDueDate =
    dueDate && isValid(dueDate) ? format(dueDate, 'dd MMMM, yyyy') : null

  const createdDate = item.createdAt ? new Date(item.createdAt) : null
  const formattedCreatedDate =
    createdDate && isValid(createdDate)
      ? format(createdDate, 'dd MMM yyyy, hh:mm a')
      : null

  const isHtml = !!(item?.description && /<[a-z][\s\S]*>/i.test(item.description))

  return (
    <div className="min-h-screen w-full flex-1 overflow-y-auto bg-background p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/work/status-board" className="hover:text-foreground transition-colors">
                Work Assignment
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold truncate max-w-xs">
                {item.title}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ID copy badge */}
            <button
              type="button"
              onClick={handleCopyId}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs font-mono transition-colors cursor-pointer"
              title="Copy Assessment ID"
            >
              <span>{item.id}</span>
              {copiedId ? (
                <Check className="h-3 w-3 text-kanban-board-circle-green" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>

            {/* Quick Share Link */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="gap-1 text-xs cursor-pointer"
              title="Share Link"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Delete button (Strictly Admins only) */}
            {canDelete && (
              <Popconfirm
                title="Delete this assessment?"
                description="Are you sure you want to permanently delete this assessment?"
                onConfirm={handleDelete}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 gap-1.5 text-xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* Status, Priority & Quick Navigation Strip */}
        <div className="bg-card border-border/80 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Control */}
            <div>
              <span className="text-muted-foreground mr-2 text-xs font-medium">Status:</span>
              {canChangeStatus ? (
                <Dropdown menu={statusMenu} trigger={['click']}>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all hover:opacity-90 shadow-2xs',
                      STATUS_CONFIG[item.status]?.bgClass,
                      STATUS_CONFIG[item.status]?.textClass
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        STATUS_CONFIG[item.status]?.colorClass
                      )}
                    />
                    <span>{STATUS_CONFIG[item.status]?.label ?? item.status}</span>
                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                  </button>
                </Dropdown>
              ) : (
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs',
                    STATUS_CONFIG[item.status]?.bgClass,
                    STATUS_CONFIG[item.status]?.textClass
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      STATUS_CONFIG[item.status]?.colorClass
                    )}
                  />
                  <span>{STATUS_CONFIG[item.status]?.label ?? item.status}</span>
                </div>
              )}
            </div>

            {/* Priority Control */}
            <div>
              <span className="text-muted-foreground mr-2 text-xs font-medium">Priority:</span>
              {canChangePriority ? (
                <Dropdown menu={priorityMenu} trigger={['click']}>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all hover:opacity-90 shadow-2xs',
                      PRIORITY_CONFIG[item.priority]?.bgClass,
                      PRIORITY_CONFIG[item.priority]?.textClass
                    )}
                  >
                    <Flag
                      className={cn(
                        'h-3.5 w-3.5',
                        PRIORITY_CONFIG[item.priority]?.flagColor
                      )}
                    />
                    <span>{PRIORITY_CONFIG[item.priority]?.label ?? item.priority}</span>
                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                  </button>
                </Dropdown>
              ) : (
                <div
                  title="Priority is calibrated by administration"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-default',
                    PRIORITY_CONFIG[item.priority]?.bgClass,
                    PRIORITY_CONFIG[item.priority]?.textClass
                  )}
                >
                  <Flag
                    className={cn(
                      'h-3.5 w-3.5',
                      PRIORITY_CONFIG[item.priority]?.flagColor
                    )}
                  />
                  <span>{PRIORITY_CONFIG[item.priority]?.label ?? item.priority}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Board Shortcuts */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/work/status-board')}
              className="gap-1.5 text-xs cursor-pointer hover:border-kanban-board-circle-blue"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-kanban-board-circle-blue" />
              View on Status Board
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/work/impact-board')}
              className="gap-1.5 text-xs cursor-pointer hover:border-kanban-board-circle-yellow"
            >
              <Zap className="h-3.5 w-3.5 text-kanban-board-circle-yellow" />
              View on Impact Board
            </Button>
          </div>
        </div>

        {/* Main Grid: Left Primary Content (70%), Right Metadata Sidebar (30%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column (Primary Details) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Title & Timestamp Card */}
            <div className="bg-card border-border/80 rounded-2xl border p-6 shadow-sm">
              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                {item.title}
              </h1>

              {formattedCreatedDate && (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Created on {formattedCreatedDate}</span>
                  </div>
                  {item.updatedAt && (
                    <div className="flex items-center gap-1.5">
                      <span>•</span>
                      <span>Last updated: {format(new Date(item.updatedAt), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-card border-border/80 rounded-2xl border p-6 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Assessment Description & Details
                </h2>

                {/* View Mode Toggle (Rendered View vs HTML Source) */}
                {isHtml && (
                  <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
                    <button
                      type="button"
                      onClick={() => setDescriptionViewMode('preview')}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all',
                        descriptionViewMode === 'preview'
                          ? 'bg-card text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Rendered View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescriptionViewMode('source')}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all',
                        descriptionViewMode === 'source'
                          ? 'bg-card text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      <span>HTML Source</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
                {item.description ? (
                  isHtml ? (
                    descriptionViewMode === 'preview' ? (
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed text-sm break-words [overflow-wrap:anywhere] [&_*]:!max-w-full [&_*]:!min-w-0 [&_*]:box-border [&_*]:[overflow-wrap:anywhere] [&_*]:break-words [&_table]:w-full [&_table]:table-auto [&_img]:max-w-full [&_img]:h-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-all"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-border/40">
                          <span className="text-[11px] font-mono text-muted-foreground">Raw HTML Source</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.description)
                              setCopiedHtml(true)
                              message.success('HTML source copied to clipboard!')
                              setTimeout(() => setCopiedHtml(false), 2000)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                          >
                            {copiedHtml ? (
                              <>
                                <Check className="h-3 w-3 text-kanban-board-circle-green" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy HTML</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all bg-background/60 p-3.5 rounded-lg border border-border/50 select-all [overflow-wrap:anywhere]">
                          {item.description}
                        </pre>
                      </div>
                    )
                  ) : (
                    <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
                      {item.description}
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    No description provided for this assessment.
                  </p>
                )}
              </div>
            </div>

            {/* Milestone Progress Card - Interactive & Role-Aware with Prominent Percentage */}
            <div className="bg-card border-border/80 rounded-2xl border p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Milestone Progress
                    </h2>
                    {isAssignee && (
                      <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold">
                        <Star className="h-2.5 w-2.5 fill-primary" />
                        Assigned to You
                      </span>
                    )}
                    {!canEditMilestones && (
                      <span className="bg-muted text-muted-foreground border-border inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                        <Lock className="h-2.5 w-2.5" />
                        Read-only
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {milestonePercent}%
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      ({completedMilestones} of {totalMilestones} completed)
                    </span>
                    {milestonePercent === 100 && (
                      <span className="text-base animate-bounce">🎉</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold border transition-all',
                      milestonePercent === 100
                        ? 'bg-kanban-board-circle-green/15 text-kanban-board-circle-green border-kanban-board-circle-green/30'
                        : milestonePercent > 0
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    )}
                  >
                    {milestonePercent === 100 ? '100% Completed' : milestonePercent > 0 ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
              </div>

              {/* Continuous Percentage Bar */}
              <div className="space-y-1.5">
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/60 border border-border/30">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 rounded-full',
                      milestonePercent === 100
                        ? 'bg-kanban-board-circle-green'
                        : milestonePercent >= 50
                        ? 'bg-linear-to-r from-blue-500 to-emerald-500'
                        : 'bg-blue-500'
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, milestonePercent))}%` }}
                  />
                </div>
              </div>

              {/* Quick Percentage Presets */}
              {canEditMilestones && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Quick Set:</span>
                  {[0, 25, 50, 75, 100].map((pct) => {
                    const isActive = milestonePercent === pct
                    return (
                      <button
                        key={pct}
                        type="button"
                        disabled={isUpdatingMilestone}
                        onClick={() => handleSetPercent(pct)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer',
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background hover:bg-muted text-foreground border-border/80'
                        )}
                      >
                        {pct}%
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Interactive Segmented Progress Blocks */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Milestone Steps</span>
                  <span>{completedMilestones} / {totalMilestones} steps</span>
                </div>
                <div className="flex items-center gap-1.5 py-1">
                  {Array.from({ length: Math.min(20, totalMilestones) }).map((_, idx) => {
                    const isCompleted = idx < completedMilestones
                    const targetStep = idx + 1
                    const stepPercent = Math.round((targetStep / totalMilestones) * 100)
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!canEditMilestones || isUpdatingMilestone}
                        onClick={() => {
                          if (!canEditMilestones) return
                          if (targetStep === completedMilestones) {
                            handleUpdateMilestones(idx)
                          } else {
                            handleUpdateMilestones(targetStep)
                          }
                        }}
                        className={cn(
                          'h-4 flex-1 rounded-sm transition-all relative group',
                          isCompleted
                            ? 'bg-kanban-board-circle-green shadow-2xs hover:opacity-90'
                            : 'bg-muted border border-border/40 hover:border-kanban-board-circle-green/60 hover:bg-kanban-board-circle-green/20',
                          canEditMilestones
                            ? 'cursor-pointer active:scale-95'
                            : 'cursor-default'
                        )}
                        title={
                          canEditMilestones
                            ? `Click to set milestone to Step ${targetStep} (${stepPercent}%)`
                            : `Step ${targetStep}: ${isCompleted ? 'Completed' : 'Pending'}`
                        }
                      >
                        {canEditMilestones && (
                          <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm border border-border z-10 whitespace-nowrap">
                            Step {targetStep} ({stepPercent}%)
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {canEditMilestones && (
                  <p className="text-muted-foreground text-[11px] italic">
                    Tip: Click preset percentage buttons, click any segment step, or use step increment buttons below.
                  </p>
                )}
              </div>

              {/* Quick Actions Toolbar for Milestones */}
              {canEditMilestones && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={completedMilestones >= totalMilestones || isUpdatingMilestone}
                      onClick={handleStepNext}
                      className="text-xs h-8 gap-1.5 font-medium cursor-pointer hover:border-kanban-board-circle-green hover:text-kanban-board-circle-green"
                    >
                      <Plus className="h-3 w-3" />
                      Complete Step (+1)
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={completedMilestones <= 0 || isUpdatingMilestone}
                      onClick={handleStepPrev}
                      className="text-xs h-8 gap-1.5 font-medium cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                      Undo Step (-1)
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {completedMilestones < totalMilestones ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdatingMilestone}
                        onClick={handleCompleteAll}
                        className="text-xs h-8 gap-1.5 font-semibold bg-kanban-board-circle-green text-white hover:bg-kanban-board-circle-green/90 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark 100% Completed
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isUpdatingMilestone}
                        onClick={handleResetMilestones}
                        className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset (0%)
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Completion Banner & Next Action Prompt */}
              {milestonePercent === 100 && (
                <div className="bg-kanban-board-circle-green/10 border-kanban-board-circle-green/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-kanban-board-circle-green/20 text-kanban-board-circle-green rounded-full p-1.5">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-xs font-bold">
                        All Milestones Completed!
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        All criteria and deliverables for this work assessment are satisfied.
                      </p>
                    </div>
                  </div>

                  {canChangeStatus && item.status !== 'approval' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStatusChange('approval')}
                      className="bg-kanban-board-circle-green text-white hover:bg-kanban-board-circle-green/90 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Advance to Approval
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="bg-card border-border/80 rounded-2xl border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Attached Files & Deliverables ({item.attachments ? item.attachments.length : item.attachmentsCount || 0})
                </h2>
              </div>

              {item.attachments && item.attachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {item.attachments.map((file) => {
                    const isImage =
                      file.type.startsWith('image/') ||
                      file.url.startsWith('data:image/') ||
                      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)
                    const isPdf =
                      file.type.includes('pdf') ||
                      file.url.includes('application/pdf') ||
                      file.name.endsWith('.pdf')

                    return (
                      <div
                        key={file.id}
                        className="group flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isImage ? (
                            <div
                              onClick={() => setPreviewImage(file.url)}
                              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted cursor-pointer group-hover:opacity-90"
                              title="Click to preview image"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : isPdf ? (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                              <FileText className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <Paperclip className="h-6 w-6" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p
                              className="text-foreground text-xs font-semibold truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 ml-2">
                          {isImage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setPreviewImage(file.url)}
                              title="Preview full image"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                  No files attached to this assessment.
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar / Collaborators / Due Date) */}
          <div className="space-y-6">
            {/* Due Date Card */}
            <div className="bg-card border-border/80 rounded-2xl border p-5 shadow-sm space-y-3">
              <h3 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Target Due Date
              </h3>

              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-foreground text-sm font-bold">
                    {formattedDueDate || 'No Due Date Assigned'}
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    {formattedDueDate ? 'Scheduled milestone target' : 'Flexible timeline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Collaborators Card */}
            <div className="bg-card border-border/80 rounded-2xl border p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Assigned Team ({item.assignees ? item.assignees.length : 0})
                </h3>
              </div>

              {item.assignees && item.assignees.length > 0 ? (
                <div className="space-y-2.5">
                  {item.assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 p-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {assignee.avatar ? (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="h-9 w-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
                            {assignee.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-foreground font-semibold text-xs truncate">
                            {assignee.name}
                          </p>
                          {assignee.email && (
                            <p className="text-muted-foreground text-[11px] truncate">
                              {assignee.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold',
                            ROLE_COLORS[assignee.role] ??
                              'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {assignee.role}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium border',
                            assignee.affiliation === 'external'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          )}
                        >
                          {assignee.affiliation === 'external' ? (
                            <>
                              <Globe className="h-2.5 w-2.5" />
                              <span>External</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-2.5 w-2.5" />
                              <span>Internal</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/80 p-5 text-center text-xs text-muted-foreground">
                  No collaborators assigned.
                </div>
              )}
            </div>

            {/* Assessment Meta Summary */}
            <div className="bg-card border-border/80 rounded-2xl border p-5 shadow-sm space-y-3">
              <h3 className="text-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assessment Metadata
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Current Stage</span>
                  <span className="font-semibold text-foreground">
                    {STATUS_CONFIG[item.status]?.label || item.status}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Priority Level</span>
                  <span className="font-semibold text-foreground">
                    {PRIORITY_CONFIG[item.priority]?.label || item.priority}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Attachments</span>
                  <span className="font-semibold text-foreground">
                    {item.attachments ? item.attachments.length : item.attachmentsCount || 0} files
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Collaborators</span>
                  <span className="font-semibold text-foreground">
                    {item.assignees ? item.assignees.length : 0} members
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in-0 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-card border border-border p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 px-2 border-b border-border/50">
              <span className="text-xs font-semibold text-foreground">
                Attachment Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
              <img
                src={previewImage}
                alt="Zoom"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
