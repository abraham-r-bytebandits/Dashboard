import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  File,
  FileText,
  Flag,
  Image as ImageIcon,
  Layers,
  Paperclip,
  Plus,
  UploadCloud,
  UserPlus,
  Users,
  Building2,
  Globe,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useAppDispatch } from '@/hooks/redux'
import { addWorkItem, addTeamMember } from '@/store/workSlice'
import { roleService, mapApiUserToAssignee } from '@/services/roleService'
import { workService } from '@/services/workService'
import { apiClient } from '@/lib/apiClient'
import { queryClient } from '@/lib/queryClient'
import { WORK_STATUS_OPTIONS_WITH_DESC } from '@/data/options'
import type {
  Priority,
  WorkStatus,
  UserAffiliation,
  Assignee,
  WorkItem,
  WorkAttachment,
} from '@/types/work'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export default function CreateAssessment() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()

  const initialStatus = (searchParams.get('status') as WorkStatus) || 'new'
  const initialPriority = (searchParams.get('priority') as Priority) || 'medium'
  const [primaryTarget, setPrimaryTarget] = useState<'status' | 'priority'>('status')

  const { data: functionalRoles = [] } = useQuery({
    queryKey: ['functional-roles'],
    queryFn: roleService.getFunctionalRoles,
  })

  // Fetch real users from API
  const { data: apiUsers = [] } = useQuery<Assignee[]>({
    queryKey: ['team-directory-users'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/users?page=1&pageSize=100')
        const users = res.data?.data || res.data || []
        return (Array.isArray(users) ? users : []).map(mapApiUserToAssignee)
      } catch {
        return []
      }
    },
  })

  const [localCollaborators, setLocalCollaborators] = useState<Assignee[]>([])
  const teamDirectory = [...apiUsers, ...localCollaborators]

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>(initialPriority)
  const [status, setStatus] = useState<WorkStatus>(initialStatus)
  const [milestoneTotal, setMilestoneTotal] = useState(4)
  const [milestoneCompleted, setMilestoneCompleted] = useState(0)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])
  const selectedAssignees = teamDirectory.filter((m) =>
    selectedAssigneeIds.includes(m.id),
  )

  // Attachments State
  const [attachments, setAttachments] = useState<WorkAttachment[]>([])
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [previewImage, setPreviewImage] = useState<{
    url: string
    name: string
  } | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    fileArray.forEach((file) => {
      // 25MB limit
      if (file.size > 25 * 1024 * 1024) {
        message.error(`File "${file.name}" exceeds 25MB limit`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || ''
        const newAttachment: WorkAttachment = {
          id: `att-${crypto.randomUUID()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        }
        setAttachments((prev) => [...prev, newAttachment])
        message.success(`Attached ${file.name}`)
      }
      reader.onerror = () => {
        message.error(`Failed to read file ${file.name}`)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  // New Collaborator Modal / Inline Form State
  const [showAddCollaborator, setShowAddCollaborator] = useState(false)
  const [newCollabName, setNewCollabName] = useState('')
  const [newCollabRole, setNewCollabRole] = useState('')
  const [newCollabAffiliation, setNewCollabAffiliation] =
    useState<UserAffiliation>('internal')
  const [newCollabEmail, setNewCollabEmail] = useState('')

  const handleToggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleCreateNewCollaborator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCollabName.trim()) {
      message.error('Please enter collaborator name')
      return
    }

    const assignedRole = newCollabRole || functionalRoles[0]?.name || 'Member'
    const newMemberId = `usr-${crypto.randomUUID()}`

    const newMember: Assignee = {
      id: newMemberId,
      name: newCollabName.trim(),
      role: assignedRole,
      affiliation: newCollabAffiliation,
      email: newCollabEmail.trim() || undefined,
    }

    setLocalCollaborators((prev) => [...prev, newMember])
    dispatch(addTeamMember(newMember))
    // Automatically select the newly created collaborator
    setSelectedAssigneeIds((prev) => [...prev, newMember.id])

    message.success(
      `Added ${newMember.name} (${newMember.role} · ${newMember.affiliation === 'internal' ? 'Internal' : 'External'}) to Directory!`,
    )

    // Reset inline form
    setNewCollabName('')
    setNewCollabEmail('')
    setShowAddCollaborator(false)
  }

  const handleSubmit = async (targetBoard: 'status' | 'priority') => {
    if (!title.trim()) {
      message.error('Please enter an assessment title')
      return
    }

    const selectedAssignees = teamDirectory.filter((m) =>
      selectedAssigneeIds.includes(m.id),
    )

    const workItemId = `work-${crypto.randomUUID()}`
    const newWorkItem: WorkItem = {
      id: workItemId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      assignees: selectedAssignees,
      milestone: {
        completed: Number(milestoneCompleted) || 0,
        total: Number(milestoneTotal) || 1,
      },
      attachmentsCount: attachments.length,
      attachments: attachments,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    }

    try {
      await workService.createWorkItem(newWorkItem)
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
    } catch {
      // offline/fallback
    }
    dispatch(addWorkItem(newWorkItem))

    message.success('Work assessment created successfully!')

    if (targetBoard === 'priority') {
      navigate('/work/impact-board')
    } else {
      navigate('/work/status-board')
    }
  }

  const renderSaveActions = (size: 'sm' | 'default' = 'sm') => (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={() => navigate('/work/status-board')}
        variant="outline"
        size={size}
        className="text-xs cursor-pointer"
      >
        Cancel
      </Button>

      <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden">
        {/* Main Action Button */}
        <Button
          type="button"
          onClick={() => handleSubmit(primaryTarget)}
          size={size}
          className={cn(
            'rounded-r-none gap-1.5 text-xs font-medium cursor-pointer border-r',
            primaryTarget === 'status'
              ? 'bg-kanban-board-circle-blue text-white hover:bg-kanban-board-circle-blue/90 border-white/20'
              : 'bg-kanban-board-circle-yellow text-slate-950 hover:bg-kanban-board-circle-yellow/90 font-semibold border-black/10',
          )}
        >
          {primaryTarget === 'status' ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save & View on Status Board
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              Save & View on Impact Board
            </>
          )}
        </Button>

        {/* Dropdown Chevron for Alternate Save Target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size={size}
              className={cn(
                'rounded-l-none px-2 cursor-pointer',
                primaryTarget === 'status'
                  ? 'bg-kanban-board-circle-blue text-white hover:bg-kanban-board-circle-blue/90'
                  : 'bg-kanban-board-circle-yellow text-slate-950 hover:bg-kanban-board-circle-yellow/90',
              )}
              title="More save options"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 p-1.5 shadow-lg border border-border bg-popover z-50"
          >
            <DropdownMenuItem
              onClick={() => {
                setPrimaryTarget('status')
                handleSubmit('status')
              }}
              className="cursor-pointer gap-2.5 p-2.5 rounded-md hover:bg-accent focus:bg-accent"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-kanban-board-circle-blue/15 text-kanban-board-circle-blue">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">
                  Save & View on Status Board
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Open workflow stages Kanban
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setPrimaryTarget('priority')
                handleSubmit('priority')
              }}
              className="cursor-pointer gap-2.5 p-2.5 rounded-md hover:bg-accent focus:bg-accent"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-kanban-board-circle-yellow/15 text-kanban-board-circle-yellow">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">
                  Save & View on Impact Board
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Open priority calibration matrix
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen w-full flex-1 overflow-y-auto bg-muted/20 p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button
              onClick={() => navigate('/work/status-board')}
              variant="ghost"
              size="sm"
              className="mb-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Boards
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kanban-board-circle-blue text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold tracking-tight">
                  Create Work Assessment
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Action Header Buttons */}
          {renderSaveActions('sm')}
        </div>
          {/* Card 1: Work Overview */}
          <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
              <Layers className="text-primary h-4 w-4" />
              <h2 className="text-foreground text-sm font-semibold">
                1. Work Overview & Scope
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">
                  Assessment Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Payment Gateway Integration, Mobile Dashboard..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-input focus-visible:ring-ring h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2"
                />
              </div>

              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">
                  Description & Context
                </label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Provide scope of work, technical requirements, acceptance criteria..."
                />
              </div>

              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">
                  Initial Workflow Stage (Status Board)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as WorkStatus)}
                  className="border-input focus-visible:ring-ring h-10 w-full rounded-md border bg-background px-3 text-xs outline-none transition-colors focus-visible:ring-2"
                >
                  {WORK_STATUS_OPTIONS_WITH_DESC.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Priority Check & Calibration */}
          <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
              <Flag className="text-primary h-4 w-4" />
              <h2 className="text-foreground text-sm font-semibold">
                2. Priority Check & Impact Calibration (Impact Board)
              </h2>
            </div>

            <p className="text-muted-foreground mb-3 text-xs">
              Determine the urgency and business impact for scheduling on the
              Impact Board.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* High */}
              <div
                onClick={() => setPriority('high')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'high'
                    ? 'border-kanban-board-circle-red bg-kanban-board-circle-red/10 ring-2 ring-kanban-board-circle-red/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-red/30',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-xs text-kanban-board-circle-red">
                    High Priority
                  </span>
                  <Flag className="h-4 w-4 text-kanban-board-circle-red" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Critical milestone, blocking dependencies, or high business
                  impact.
                </p>
              </div>

              {/* Medium */}
              <div
                onClick={() => setPriority('medium')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'medium'
                    ? 'border-kanban-board-circle-yellow bg-kanban-board-circle-yellow/10 ring-2 ring-kanban-board-circle-yellow/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-yellow/30',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-xs text-kanban-board-circle-yellow">
                    Medium Priority
                  </span>
                  <Flag className="h-4 w-4 text-kanban-board-circle-yellow" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Important delivery within standard sprint and operational
                  schedule.
                </p>
              </div>

              {/* Low */}
              <div
                onClick={() => setPriority('low')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'low'
                    ? 'border-kanban-board-circle-blue bg-kanban-board-circle-blue/10 ring-2 ring-kanban-board-circle-blue/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-blue/30',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-xs text-kanban-board-circle-blue">
                    Low Priority
                  </span>
                  <Flag className="h-4 w-4 text-kanban-board-circle-blue" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Routine, nice-to-have, or non-time-critical maintenance work.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Milestones & Subtasks */}
          <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
              <CheckCircle2 className="text-primary h-4 w-4" />
              <h2 className="text-foreground text-sm font-semibold">
                3. Milestones & Progress Tracking
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">
                  Total Milestones / Deliverables
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={milestoneTotal}
                  onChange={(e) =>
                    setMilestoneTotal(Math.max(1, Number(e.target.value)))
                  }
                  className="border-input focus-visible:ring-ring h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2"
                />
              </div>

              <div>
                <label className="text-foreground mb-1.5 block text-xs font-medium">
                  Completed Milestones (at start)
                </label>
                <input
                  type="number"
                  min={0}
                  max={milestoneTotal}
                  value={milestoneCompleted}
                  onChange={(e) =>
                    setMilestoneCompleted(
                      Math.min(
                        milestoneTotal,
                        Math.max(0, Number(e.target.value)),
                      ),
                    )
                  }
                  className="border-input focus-visible:ring-ring h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2"
                />
              </div>
            </div>

            {/* Visual preview */}
            <div className="mt-4 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Milestone Preview</span>
                <span>
                  {milestoneCompleted} of {milestoneTotal} completed (
                  {Math.round((milestoneCompleted / milestoneTotal) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (milestoneCompleted / milestoneTotal) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Work Assignment: User Roles & Affiliation */}
          <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="text-primary h-4 w-4" />
                <h2 className="text-foreground text-sm font-semibold">
                  4. Work Assignment (Roles & Affiliations)
                </h2>
              </div>

              <Button
                type="button"
                onClick={() => setShowAddCollaborator((prev) => !prev)}
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {showAddCollaborator
                  ? 'Close Collaborator Form'
                  : '+ Add New Collaborator'}
              </Button>
            </div>

            {/* Inline New Collaborator Form */}
            {showAddCollaborator && (
              <form
                onSubmit={handleCreateNewCollaborator}
                className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <h3 className="text-foreground mb-3 text-xs font-semibold flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                  Add New Collaborator to Directory
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={newCollabName}
                      onChange={(e) => setNewCollabName(e.target.value)}
                      className="border-input focus-visible:ring-ring h-8 w-full rounded-md border bg-background px-2.5 text-xs outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs">
                      Functional Role
                    </label>
                    <select
                      value={newCollabRole || functionalRoles[0]?.name || ''}
                      onChange={(e) => setNewCollabRole(e.target.value)}
                      className="border-input focus-visible:ring-ring h-8 w-full rounded-md border bg-background px-2 text-xs outline-none"
                    >
                      {functionalRoles.length > 0 ? (
                        functionalRoles.map((r) => (
                          <option key={r.publicId || r.name} value={r.name}>
                            {r.name}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          No roles available (create in Admin)
                        </option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-1 block text-xs">
                      Affiliation Type
                    </label>
                    <select
                      value={newCollabAffiliation}
                      onChange={(e) =>
                        setNewCollabAffiliation(
                          e.target.value as UserAffiliation,
                        )
                      }
                      className="border-input focus-visible:ring-ring h-8 w-full rounded-md border bg-background px-2 text-xs outline-none"
                    >
                      <option value="internal">Internal Team Member</option>
                      <option value="external">
                        External Contractor / Agency
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex-1 max-w-sm">
                    <input
                      type="email"
                      placeholder="Optional email address..."
                      value={newCollabEmail}
                      onChange={(e) => setNewCollabEmail(e.target.value)}
                      className="border-input focus-visible:ring-ring h-8 w-full rounded-md border bg-background px-2.5 text-xs outline-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="ml-3 gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add & Select
                  </Button>
                </div>
              </form>
            )}

            {/* Dropdown Assignee Selector Section */}
            <div className="space-y-3">
              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  Select Assignees
                </label>
                <p className="text-muted-foreground mb-3 text-xs">
                  Select one or more assignees. Each person's role (Developer,
                  Marketing, etc.) and affiliation (Internal vs External) will
                  appear on the card.
                </p>
              </div>

              {/* Simple Theme Button Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="gap-2 text-xs font-medium bg-white border text-black hover:bg-gray-50 shadow-xs cursor-pointer h-9 px-3.5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {selectedAssignees.length === 0
                          ? 'Select Assignees from Directory'
                          : `Select Assignees (${selectedAssignees.length} selected)`}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-80 max-h-72 overflow-y-auto p-1.5 shadow-lg border border-border bg-popover z-50"
                  >
                    {teamDirectory.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No team members in directory yet.
                      </div>
                    ) : (
                      teamDirectory.map((member) => {
                        const isSelected = selectedAssigneeIds.includes(member.id)
                        return (
                          <DropdownMenuItem
                            key={member.id}
                            onSelect={(e) => {
                              e.preventDefault()
                              handleToggleAssignee(member.id)
                            }}
                            className={cn(
                              'flex items-center justify-between gap-3 p-2.5 rounded-md cursor-pointer transition-colors text-xs',
                              isSelected
                                ? 'bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue font-medium'
                                : 'hover:bg-muted',
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={cn(
                                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                  isSelected
                                    ? 'border-kanban-board-circle-blue bg-kanban-board-circle-blue text-white'
                                    : 'border-muted-foreground/40 bg-background',
                                )}
                              >
                                {isSelected && (
                                  <Check className="h-3 w-3 stroke-[3]" />
                                )}
                              </div>

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kanban-board-circle-blue/15 text-kanban-board-circle-blue font-bold text-xs">
                                {member.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {member.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {member.role}
                                </p>
                              </div>
                            </div>

                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 inline-flex items-center gap-0.5',
                                member.affiliation === 'internal'
                                  ? 'bg-kanban-board-circle-blue/15 text-kanban-board-circle-blue'
                                  : 'bg-kanban-board-circle-purple/15 text-kanban-board-circle-purple',
                              )}
                            >
                              {member.affiliation === 'internal' ? (
                                <>
                                  <Building2 className="h-2.5 w-2.5" />
                                  Internal
                                </>
                              ) : (
                                <>
                                  <Globe className="h-2.5 w-2.5" />
                                  External
                                </>
                              )}
                            </span>
                          </DropdownMenuItem>
                        )
                      })
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedAssignees.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => setSelectedAssigneeIds([])}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer h-9"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all ({selectedAssignees.length})
                  </Button>
                )}
              </div>

              {/* Selected Assignees Cards Grid */}
              {selectedAssignees.length > 0 ? (
                <div className="pt-2">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {selectedAssignees.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border border-kanban-board-circle-blue/25 bg-kanban-board-circle-blue/5 p-3 flex items-center justify-between gap-2 shadow-xs transition-all hover:border-kanban-board-circle-blue/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kanban-board-circle-blue text-white text-xs font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {member.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {member.role}
                              </span>
                              <span className="text-muted-foreground/60 text-[10px]">
                                •
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-0.5',
                                  member.affiliation === 'internal'
                                    ? 'bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue'
                                    : 'bg-kanban-board-circle-purple/10 text-kanban-board-circle-purple',
                                )}
                              >
                                {member.affiliation === 'internal' ? (
                                  <>
                                    <Building2 className="h-2.5 w-2.5" />
                                    Internal
                                  </>
                                ) : (
                                  <>
                                    <Globe className="h-2.5 w-2.5" />
                                    External
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleAssignee(member.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                          title={`Remove ${member.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-kanban-board-circle-yellow pt-1">
                </p>
              )}
            </div>
          </div>

          {/* Card 5: Attachments & Documents */}
          <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="text-primary h-4 w-4" />
                <h2 className="text-foreground text-sm font-semibold">
                  5. Attachments & Supporting Files
                </h2>
                {attachments.length > 0 && (
                  <span className="bg-primary/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>

              {attachments.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setAttachments([])}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer h-7"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove all
                </Button>
              )}
            </div>

            <p className="text-muted-foreground mb-4 text-xs">
              Upload image assets (screenshots, designs, wireframes), PDF specifications, or documentation to attach to this assessment.
            </p>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingFile(true)
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingFile(false)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files)
                }
              }}
              onClick={() => {
                document.getElementById('assessment-file-upload')?.click()
              }}
              className={cn(
                'group relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                isDraggingFile
                  ? 'border-kanban-board-circle-blue bg-kanban-board-circle-blue/5 scale-[0.99]'
                  : 'border-border/80 bg-background/60 hover:border-kanban-board-circle-blue/50 hover:bg-muted/30',
              )}
            >
              <input
                id="assessment-file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files)
                    e.target.value = ''
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-xs font-semibold">
                    <span className="text-kanban-board-circle-blue underline">Click to upload</span> or drag & drop files here
                  </p>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    Supports Images (PNG, JPG, SVG, WebP, GIF), PDFs, and Documents (up to 25MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Attachments Grid */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-kanban-board-circle-blue" />
                  Attached Files ({attachments.length}):
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {attachments.map((file) => {
                    const isImage = file.type.startsWith('image/')
                    const isPdf =
                      file.type === 'application/pdf' ||
                      file.name.toLowerCase().endsWith('.pdf')

                    return (
                      <div
                        key={file.id}
                        className="group relative rounded-lg border border-border bg-background p-3 shadow-xs hover:border-kanban-board-circle-blue/40 transition-all flex flex-col justify-between"
                      >
                        {/* Preview Area */}
                        {isImage ? (
                          <div
                            onClick={() =>
                              setPreviewImage({ url: file.url, name: file.name })
                            }
                            className="relative mb-2 h-28 w-full overflow-hidden rounded-md bg-muted/40 cursor-zoom-in"
                            title="Click to zoom preview"
                          >
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white flex items-center gap-1">
                              <ImageIcon className="h-2.5 w-2.5" />
                              IMG
                            </div>
                          </div>
                        ) : isPdf ? (
                          <div className="relative mb-2 flex h-28 w-full flex-col items-center justify-center rounded-md bg-red-500/10 text-red-500">
                            <FileText className="h-10 w-10 mb-1" />
                            <span className="text-[11px] font-semibold">PDF Document</span>
                            <div className="absolute top-1.5 left-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              PDF
                            </div>
                          </div>
                        ) : (
                          <div className="relative mb-2 flex h-28 w-full flex-col items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                            <File className="h-10 w-10 mb-1" />
                            <span className="text-[11px] font-semibold">Attachment</span>
                            <div className="absolute top-1.5 left-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              DOC
                            </div>
                          </div>
                        )}

                        {/* File Details */}
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-xs font-semibold text-foreground"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {formatFileSize(file.size)}
                          </p>
                        </div>

                        {/* Action Links */}
                        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                          <a
                            href={file.url}
                            download={file.name}
                            className="text-[11px] text-kanban-board-circle-blue hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors cursor-pointer"
                            title={`Remove ${file.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Image Lightbox Modal */}
          {previewImage && (
            <div
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150 cursor-pointer"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-card border border-border p-2 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-2 px-2 border-b border-border/50">
                  <span className="text-xs font-semibold text-foreground truncate max-w-md">
                    {previewImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-auto">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-h-[70vh] w-auto rounded object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="bg-card border-border rounded-xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Ready to submit? Save directly or use the dropdown to view on the Impact Board.
            </div>
            {renderSaveActions('default')}
          </div>
        </div>
      </div>
    )
  }
