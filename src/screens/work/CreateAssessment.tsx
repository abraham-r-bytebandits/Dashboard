import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flag,
  Layers,
  Plus,
  UserPlus,
  Users,
  Building2,
  Globe,
  Sparkles,
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
} from '@/types/work'
import { cn } from '@/lib/utils'

export default function CreateAssessment() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()

  const initialStatus = (searchParams.get('status') as WorkStatus) || 'new'
  const initialPriority = (searchParams.get('priority') as Priority) || 'medium'

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
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [priority, setPriority] = useState<Priority>(initialPriority)
  const [status, setStatus] = useState<WorkStatus>(initialStatus)
  const [milestoneTotal, setMilestoneTotal] = useState(4)
  const [milestoneCompleted, setMilestoneCompleted] = useState(0)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([])

  // New Collaborator Modal / Inline Form State
  const [showAddCollaborator, setShowAddCollaborator] = useState(false)
  const [newCollabName, setNewCollabName] = useState('')
  const [newCollabRole, setNewCollabRole] = useState('')
  const [newCollabAffiliation, setNewCollabAffiliation] =
    useState<UserAffiliation>('internal')
  const [newCollabEmail, setNewCollabEmail] = useState('')

  const handleToggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
      `Added ${newMember.name} (${newMember.role} · ${newMember.affiliation === 'internal' ? 'Internal' : 'External'}) to Directory!`
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
      selectedAssigneeIds.includes(m.id)
    )

    const workItemId = `work-${crypto.randomUUID()}`
    const newWorkItem: WorkItem = {
      id: workItemId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      dueDate,
      assignees: selectedAssignees,
      milestone: {
        completed: Number(milestoneCompleted) || 0,
        total: Number(milestoneTotal) || 1,
      },
      attachmentsCount: 0,
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

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-muted/20 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/work/status-board')}
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Boards
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Create Work Assessment
              </h1>
              <p className="text-muted-foreground text-xs mt-0.5">
                Define work specifications, calibrate priority check, configure milestones, and designate roles.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
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
                <textarea
                  rows={3}
                  placeholder="Provide scope of work, technical requirements, acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-input focus-visible:ring-ring w-full rounded-md border bg-background p-3 text-sm outline-none transition-colors focus-visible:ring-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1.5 block text-xs font-medium">
                    Target Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="border-input focus-visible:ring-ring h-10 w-full rounded-md border bg-background pl-9 pr-3 text-xs outline-none transition-colors focus-visible:ring-2"
                    />
                  </div>
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
              Determine the urgency and business impact for scheduling on the Impact Board.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* High */}
              <div
                onClick={() => setPriority('high')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'high'
                    ? 'border-kanban-board-circle-red bg-kanban-board-circle-red/10 ring-2 ring-kanban-board-circle-red/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-red/30'
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-xs text-kanban-board-circle-red">
                    High Priority
                  </span>
                  <Flag className="h-4 w-4 text-kanban-board-circle-red" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Critical milestone, blocking dependencies, or high business impact.
                </p>
              </div>

              {/* Medium */}
              <div
                onClick={() => setPriority('medium')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'medium'
                    ? 'border-kanban-board-circle-yellow bg-kanban-board-circle-yellow/10 ring-2 ring-kanban-board-circle-yellow/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-yellow/30'
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-xs text-kanban-board-circle-yellow">
                    Medium Priority
                  </span>
                  <Flag className="h-4 w-4 text-kanban-board-circle-yellow" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Important delivery within standard sprint and operational schedule.
                </p>
              </div>

              {/* Low */}
              <div
                onClick={() => setPriority('low')}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-all',
                  priority === 'low'
                    ? 'border-kanban-board-circle-blue bg-kanban-board-circle-blue/10 ring-2 ring-kanban-board-circle-blue/30'
                    : 'border-border bg-background hover:border-kanban-board-circle-blue/30'
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
                  onChange={(e) => setMilestoneTotal(Math.max(1, Number(e.target.value)))}
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
                      Math.min(milestoneTotal, Math.max(0, Number(e.target.value)))
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
                      (milestoneCompleted / milestoneTotal) * 100
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

              <button
                type="button"
                onClick={() => setShowAddCollaborator((prev) => !prev)}
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {showAddCollaborator ? 'Close Collaborator Form' : '+ Add New Collaborator'}
              </button>
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
                        <option value="">No roles available (create in Admin)</option>
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
                        setNewCollabAffiliation(e.target.value as UserAffiliation)
                      }
                      className="border-input focus-visible:ring-ring h-8 w-full rounded-md border bg-background px-2 text-xs outline-none"
                    >
                      <option value="internal">Internal Team Member</option>
                      <option value="external">External Contractor / Agency</option>
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

                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 ml-3 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add & Select
                  </button>
                </div>
              </form>
            )}

            {/* Select Assignees from Directory */}
            <div>
              <p className="text-muted-foreground mb-3 text-xs">
                Select one or more assignees. Each person's role (Developer, Marketing, etc.) and affiliation (Internal vs External) will appear on the card.
              </p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {teamDirectory.map((member) => {
                  const isSelected = selectedAssigneeIds.includes(member.id)
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleToggleAssignee(member.id)}
                      className={cn(
                        'cursor-pointer rounded-lg border p-3 transition-all flex items-center gap-3',
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-background hover:bg-muted/40'
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {member.name}
                          </p>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {member.role}
                          </span>
                          <span className="text-muted-foreground/60 text-[10px]">•</span>
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-0.5',
                              member.affiliation === 'internal'
                                ? 'bg-kanban-board-circle-blue/10 text-kanban-board-circle-blue'
                                : 'bg-kanban-board-circle-purple/10 text-kanban-board-circle-purple'
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
                  )
                })}
              </div>

              {selectedAssigneeIds.length === 0 && (
                <p className="mt-2 text-xs text-kanban-board-circle-yellow">
                  Tip: No assignees selected yet. You can assign someone now or assign later from the boards.
                </p>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/work/status-board')}
              className="border-border hover:bg-muted text-muted-foreground rounded-lg border bg-background px-4 py-2 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('priority')}
              className="bg-kanban-board-circle-yellow text-primary-foreground hover:bg-kanban-board-circle-yellow/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shadow-sm transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
              Save & View on Impact Board
            </button>

            <button
              type="button"
              onClick={() => handleSubmit('status')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shadow-sm transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Save & View on Status Board
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
